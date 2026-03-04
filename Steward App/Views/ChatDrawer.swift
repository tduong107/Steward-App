import SwiftUI

struct ChatDrawer: View {
    @State private var chatVM = ChatViewModel()
    @Binding var isPresented: Bool

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .bottom) {
                // Backdrop
                Color.black.opacity(0.4)
                    .ignoresSafeArea()
                    .onTapGesture { isPresented = false }

                // Sheet
                VStack(spacing: 0) {
                    dragHandle
                    chatHeader
                    messageList
                    inputBar
                }
                .frame(maxHeight: geo.size.height * 0.82)
                .background(Theme.bgCard)
                .clipShape(RoundedRectangle(cornerRadius: Theme.radiusXL))
                .shadow(color: .black.opacity(0.15), radius: 24, y: -4)
                .transition(.move(edge: .bottom))
            }
            .ignoresSafeArea(edges: .bottom)
        }
    }

    // MARK: - Drag Handle

    private var dragHandle: some View {
        VStack(spacing: 16) {
            RoundedRectangle(cornerRadius: 2)
                .fill(Theme.border)
                .frame(width: 40, height: 4)
                .padding(.top, 12)

            HStack {
                HStack(spacing: 10) {
                    Image(systemName: "sparkle")
                        .font(.system(size: 16))
                        .foregroundStyle(.white)
                        .frame(width: 34, height: 34)
                        .background(Theme.accent)
                        .clipShape(RoundedRectangle(cornerRadius: 10))

                    VStack(alignment: .leading, spacing: 1) {
                        Text("Steward AI")
                            .font(Theme.serif(15, weight: .semibold))
                            .foregroundStyle(Theme.ink)

                        HStack(spacing: 4) {
                            Circle()
                                .fill(Theme.accent)
                                .frame(width: 6, height: 6)

                            Text("Online")
                                .font(Theme.body(11))
                                .foregroundStyle(Theme.accent)
                        }
                    }
                }

                Spacer()

                Button {
                    isPresented = false
                } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundStyle(Theme.inkLight)
                        .frame(width: 30, height: 30)
                }
                .accessibilityLabel("Close chat")
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 14)

            Divider().foregroundStyle(Theme.border)
        }
    }

    private var chatHeader: some View {
        EmptyView()
    }

    // MARK: - Message List

    private var messageList: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(spacing: 14) {
                    ForEach(chatVM.messages) { msg in
                        ChatMessageView(message: msg, onSuggestion: { text in
                            chatVM.send(text)
                        })
                        .id(msg.id)
                    }

                    if chatVM.isTyping {
                        TypingIndicator()
                            .id("typing")
                    }
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 16)
            }
            .onChange(of: chatVM.messages.count) {
                withAnimation {
                    if let last = chatVM.messages.last {
                        proxy.scrollTo(last.id, anchor: .bottom)
                    }
                }
            }
            .onChange(of: chatVM.isTyping) {
                if chatVM.isTyping {
                    withAnimation {
                        proxy.scrollTo("typing", anchor: .bottom)
                    }
                }
            }
        }
    }

    // MARK: - Input Bar

    private var inputBar: some View {
        HStack(spacing: 10) {
            TextField("Tell Steward what to watch…", text: $chatVM.inputText)
                .font(Theme.body(13))
                .padding(.horizontal, 14)
                .padding(.vertical, 12)
                .background(Theme.bg)
                .clipShape(RoundedRectangle(cornerRadius: 14))
                .overlay(
                    RoundedRectangle(cornerRadius: 14)
                        .stroke(Theme.border, lineWidth: 1)
                )
                .submitLabel(.send)
                .onSubmit {
                    chatVM.send()
                }

            Button {
                chatVM.send()
            } label: {
                Image(systemName: "arrow.up")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(chatVM.inputText.trimmingCharacters(in: .whitespaces).isEmpty ? Theme.inkLight : .white)
                    .frame(width: 42, height: 42)
                    .background(chatVM.inputText.trimmingCharacters(in: .whitespaces).isEmpty ? Theme.bgDeep : Theme.accent)
                    .clipShape(RoundedRectangle(cornerRadius: 13))
            }
            .disabled(chatVM.inputText.trimmingCharacters(in: .whitespaces).isEmpty)
            .accessibilityLabel("Send message")
        }
        .padding(.horizontal, 16)
        .padding(.top, 12)
        .padding(.bottom, 16)
        .overlay(alignment: .top) {
            Divider().foregroundStyle(Theme.border)
        }
    }
}

// MARK: - Chat Message View

struct ChatMessageView: View {
    let message: ChatMessage
    let onSuggestion: (String) -> Void

    var body: some View {
        HStack(alignment: .top) {
            if message.role == .user { Spacer(minLength: 40) }

            VStack(alignment: message.role == .user ? .trailing : .leading, spacing: 6) {
                // Steward avatar
                if message.role == .steward {
                    HStack(spacing: 6) {
                        Image(systemName: "sparkle")
                            .font(.system(size: 11))
                            .foregroundStyle(.white)
                            .frame(width: 22, height: 22)
                            .background(Theme.accent)
                            .clipShape(RoundedRectangle(cornerRadius: 7))

                        Text("Steward")
                            .font(Theme.body(11))
                            .foregroundStyle(Theme.inkLight)
                    }
                }

                // Bubble
                Text(message.text)
                    .font(Theme.body(13))
                    .foregroundStyle(message.role == .user ? .white : Theme.ink)
                    .lineSpacing(4)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 11)
                    .background(message.role == .user ? Theme.accent : Theme.bgDeep)
                    .clipShape(ChatBubbleShape(isUser: message.role == .user))

                // Suggestions
                if let suggestions = message.suggestions {
                    FlowLayout(spacing: 7) {
                        ForEach(suggestions, id: \.self) { suggestion in
                            Button {
                                onSuggestion(suggestion)
                            } label: {
                                Text(suggestion)
                                    .font(Theme.body(12, weight: .medium))
                                    .foregroundStyle(Theme.accent)
                                    .padding(.horizontal, 13)
                                    .padding(.vertical, 7)
                                    .background(Theme.bgCard)
                                    .clipShape(Capsule())
                                    .overlay(
                                        Capsule()
                                            .stroke(Theme.accentMid, lineWidth: 1)
                                    )
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.top, 4)
                }

                // Action cards
                if let cards = message.actionCards {
                    VStack(spacing: 8) {
                        ForEach(cards) { card in
                            Button {
                                onSuggestion("Set up: \(card.label)")
                            } label: {
                                HStack(spacing: 10) {
                                    Image(systemName: card.icon)
                                        .font(.system(size: 18))
                                        .foregroundStyle(Theme.ink)

                                    Text(card.label)
                                        .font(Theme.body(13))
                                        .foregroundStyle(Theme.ink)

                                    Spacer()

                                    Image(systemName: "chevron.right")
                                        .font(.system(size: 12, weight: .medium))
                                        .foregroundStyle(Theme.accentMid)
                                }
                                .padding(.horizontal, 14)
                                .padding(.vertical, 11)
                                .background(Theme.bgCard)
                                .clipShape(RoundedRectangle(cornerRadius: Theme.radiusMd))
                                .overlay(
                                    RoundedRectangle(cornerRadius: Theme.radiusMd)
                                        .stroke(Theme.border, lineWidth: 1)
                                )
                                .shadow(color: .black.opacity(0.04), radius: 8, y: 4)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.top, 4)
                }
            }

            if message.role == .steward { Spacer(minLength: 40) }
        }
    }
}

// MARK: - Chat Bubble Shape

struct ChatBubbleShape: Shape {
    let isUser: Bool

    func path(in rect: CGRect) -> Path {
        let radius: CGFloat = 18
        let smallRadius: CGFloat = 4

        let topLeft = isUser ? radius : smallRadius
        let topRight = isUser ? radius : radius
        let bottomLeft = radius
        let bottomRight = isUser ? smallRadius : radius

        return Path { p in
            p.move(to: CGPoint(x: rect.minX + topLeft, y: rect.minY))
            p.addLine(to: CGPoint(x: rect.maxX - topRight, y: rect.minY))
            p.addArc(tangent1End: CGPoint(x: rect.maxX, y: rect.minY),
                      tangent2End: CGPoint(x: rect.maxX, y: rect.minY + topRight),
                      radius: topRight)
            p.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY - bottomRight))
            p.addArc(tangent1End: CGPoint(x: rect.maxX, y: rect.maxY),
                      tangent2End: CGPoint(x: rect.maxX - bottomRight, y: rect.maxY),
                      radius: bottomRight)
            p.addLine(to: CGPoint(x: rect.minX + bottomLeft, y: rect.maxY))
            p.addArc(tangent1End: CGPoint(x: rect.minX, y: rect.maxY),
                      tangent2End: CGPoint(x: rect.minX, y: rect.maxY - bottomLeft),
                      radius: bottomLeft)
            p.addLine(to: CGPoint(x: rect.minX, y: rect.minY + topLeft))
            p.addArc(tangent1End: CGPoint(x: rect.minX, y: rect.minY),
                      tangent2End: CGPoint(x: rect.minX + topLeft, y: rect.minY),
                      radius: topLeft)
        }
    }
}

// MARK: - Typing Indicator

struct TypingIndicator: View {
    @State private var phase: CGFloat = 0

    var body: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 6) {
                HStack(spacing: 6) {
                    Image(systemName: "sparkle")
                        .font(.system(size: 11))
                        .foregroundStyle(.white)
                        .frame(width: 22, height: 22)
                        .background(Theme.accent)
                        .clipShape(RoundedRectangle(cornerRadius: 7))

                    Text("Steward")
                        .font(Theme.body(11))
                        .foregroundStyle(Theme.inkLight)
                }

                HStack(spacing: 5) {
                    ForEach(0..<3, id: \.self) { i in
                        Circle()
                            .fill(Theme.inkLight)
                            .frame(width: 6, height: 6)
                            .opacity(dotOpacity(for: i))
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .background(Theme.bgDeep)
                .clipShape(ChatBubbleShape(isUser: false))
            }

            Spacer(minLength: 40)
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 1.2).repeatForever(autoreverses: true)) {
                phase = 1
            }
        }
    }

    private func dotOpacity(for index: Int) -> CGFloat {
        let delay = CGFloat(index) * 0.2
        let adjusted = (phase + delay).truncatingRemainder(dividingBy: 1.0)
        return 0.3 + 0.7 * abs(sin(adjusted * .pi))
    }
}

// MARK: - Flow Layout

struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = layout(in: proposal.width ?? 0, subviews: subviews)
        return result.size
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = layout(in: bounds.width, subviews: subviews)
        for (index, position) in result.positions.enumerated() {
            subviews[index].place(
                at: CGPoint(x: bounds.minX + position.x, y: bounds.minY + position.y),
                proposal: ProposedViewSize(subviews[index].sizeThatFits(.unspecified))
            )
        }
    }

    private func layout(in maxWidth: CGFloat, subviews: Subviews) -> (positions: [CGPoint], size: CGSize) {
        var positions: [CGPoint] = []
        var x: CGFloat = 0
        var y: CGFloat = 0
        var rowHeight: CGFloat = 0
        var maxX: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > maxWidth, x > 0 {
                x = 0
                y += rowHeight + spacing
                rowHeight = 0
            }
            positions.append(CGPoint(x: x, y: y))
            rowHeight = max(rowHeight, size.height)
            x += size.width + spacing
            maxX = max(maxX, x)
        }

        return (positions, CGSize(width: maxX, height: y + rowHeight))
    }
}
