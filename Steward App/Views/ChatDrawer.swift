import SwiftUI
import PhotosUI

struct ChatDrawer: View {
    @State private var chatVM = ChatViewModel()
    @Binding var isPresented: Bool
    @Environment(WatchViewModel.self) private var watchVM
    @Environment(SubscriptionManager.self) private var subscriptionManager

    @FocusState private var isInputFocused: Bool
    @State private var selectedPhotoItem: PhotosPickerItem?
    @State private var showImageSourcePicker = false
    @State private var browserItem: BrowserItem?
    @State private var dragOffset: CGFloat = 0

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .bottom) {
                // Backdrop
                Color.black.opacity(0.4)
                    .ignoresSafeArea()
                    .onTapGesture {
                        isInputFocused = false
                        isPresented = false
                    }

                // Sheet — respects keyboard safe area
                VStack(spacing: 0) {
                    dragHandle
                    chatHeader
                    messageList
                    imagePreview
                    inputBar
                }
                .frame(maxHeight: geo.size.height * 0.82)
                .background(Theme.bgCard)
                .clipShape(RoundedRectangle(cornerRadius: Theme.radiusXL))
                .shadow(color: .black.opacity(0.15), radius: 24, y: -4)
                .offset(y: dragOffset)
                .gesture(
                    DragGesture()
                        .onChanged { value in
                            // Only allow dragging down (positive translation)
                            if value.translation.height > 0 {
                                dragOffset = value.translation.height
                            }
                        }
                        .onEnded { value in
                            // Dismiss if dragged down past threshold or with enough velocity
                            if value.translation.height > 80 || value.predictedEndTranslation.height > 200 {
                                withAnimation(.easeOut(duration: 0.25)) {
                                    dragOffset = 600
                                }
                                DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) {
                                    isPresented = false
                                    dragOffset = 0
                                }
                            } else {
                                // Snap back
                                withAnimation(.spring(response: 0.3)) {
                                    dragOffset = 0
                                }
                            }
                        }
                )
                .transition(.move(edge: .bottom))
            }
        }
        .onChange(of: chatVM.watchReadySignal) {
            // Bridge single watch creation (with optional initial price)
            if let watch = chatVM.pendingWatch {
                if let price = chatVM.pendingWatchInitialPrice {
                    watchVM.addWatchWithPrice(watch, initialPrice: price)
                } else {
                    watchVM.addWatch(watch)
                }
                chatVM.pendingWatch = nil
                chatVM.pendingWatchInitialPrice = nil
            }
        }
        .onChange(of: chatVM.pendingWishlistWatches.count) {
            // Bridge wishlist bulk import
            if !chatVM.pendingWishlistWatches.isEmpty {
                for watch in chatVM.pendingWishlistWatches {
                    watchVM.addWatch(watch)
                }
                chatVM.pendingWishlistWatches = []
            }
        }
        .onChange(of: chatVM.priceUpdateSignal) {
            // Bridge price update for an already-created watch
            if let update = chatVM.pendingPriceUpdateData {
                watchVM.updateWatchPrice(watchId: update.watchId, price: update.price)
                chatVM.pendingPriceUpdateData = nil
            }
        }
        .onChange(of: selectedPhotoItem) {
            Task {
                if let item = selectedPhotoItem,
                   let data = try? await item.loadTransferable(type: Data.self),
                   let uiImage = UIImage(data: data) {
                    chatVM.pendingImage = uiImage
                }
                selectedPhotoItem = nil
            }
        }
        .onChange(of: chatVM.shouldDismiss) {
            if chatVM.shouldDismiss {
                withAnimation(.easeOut(duration: 0.3)) {
                    isPresented = false
                }
                chatVM.shouldDismiss = false
            }
        }
        .sheet(item: $browserItem) { item in
            InAppBrowser(initialURL: item.url) { capturedURL in
                // Send the captured URL back into chat
                chatVM.send("I found it! Here's the URL: \(capturedURL)")
            }
        }
        .onAppear {
            chatVM.subscriptionTier = subscriptionManager.currentTier

            // If there's a shared URL from the Share Extension, auto-send it to the AI
            if let pendingURL = watchVM.pendingChatURL {
                watchVM.pendingChatURL = nil
                chatVM.send("I want to watch this: \(pendingURL)")
            }

            // If there's a fix context from a broken watch, auto-send it to the AI
            if let fixContext = watchVM.pendingFixContext {
                watchVM.pendingFixContext = nil
                chatVM.send(fixContext)
            }
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
                    StewardLogo(size: 34)

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
                VStack(spacing: 14) {
                    ForEach(chatVM.messages) { msg in
                        ChatMessageView(
                            message: msg,
                            onSuggestion: { text in
                                chatVM.send(text)
                            },
                            onProductLinkTap: { link in
                                if let url = URL(string: link.url) {
                                    browserItem = BrowserItem(url: url)
                                }
                            }
                        )
                        .id(msg.id)
                    }

                    if chatVM.isTyping {
                        TypingIndicator()
                            .id("typing")
                    }

                    // Invisible anchor at the very bottom for reliable scrolling
                    Color.clear
                        .frame(height: 1)
                        .id("bottomAnchor")
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 16)
            }
            .onChange(of: chatVM.messages.count) {
                scrollToBottom(proxy: proxy)
            }
            .onChange(of: chatVM.isTyping) {
                if chatVM.isTyping {
                    scrollToBottom(proxy: proxy)
                }
            }
        }
    }

    /// Scrolls to the bottom anchor with a small delay to let layout settle
    private func scrollToBottom(proxy: ScrollViewProxy) {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            withAnimation(.easeOut(duration: 0.3)) {
                proxy.scrollTo("bottomAnchor", anchor: .bottom)
            }
        }
    }

    // MARK: - Image Preview (staged image before sending)

    private var imagePreview: some View {
        Group {
            if let image = chatVM.pendingImage {
                HStack(spacing: 10) {
                    Image(uiImage: image)
                        .resizable()
                        .scaledToFill()
                        .frame(width: 60, height: 60)
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                        .overlay(
                            RoundedRectangle(cornerRadius: 10)
                                .stroke(Theme.border, lineWidth: 1)
                        )

                    VStack(alignment: .leading, spacing: 2) {
                        Text("Screenshot attached")
                            .font(Theme.body(12, weight: .medium))
                            .foregroundStyle(Theme.ink)

                        Text("Send to analyze")
                            .font(Theme.body(11))
                            .foregroundStyle(Theme.inkLight)
                    }

                    Spacer()

                    Button {
                        withAnimation(.spring(response: 0.3)) {
                            chatVM.clearPendingImage()
                        }
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .font(.system(size: 20))
                            .foregroundStyle(Theme.inkLight)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .background(Theme.bgDeep)
                .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
    }

    // MARK: - Input Bar

    private var inputBar: some View {
        HStack(spacing: 8) {
            // Photo picker button
            PhotosPicker(selection: $selectedPhotoItem, matching: .images) {
                Image(systemName: "photo.on.rectangle.angled")
                    .font(.system(size: 18))
                    .foregroundStyle(Theme.inkLight)
                    .frame(width: 36, height: 42)
            }
            .accessibilityLabel("Attach screenshot")

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
                .focused($isInputFocused)
                .submitLabel(.send)
                .onSubmit {
                    chatVM.send()
                }

            Button {
                chatVM.send()
            } label: {
                Image(systemName: "arrow.up")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(canSend ? .white : Theme.inkLight)
                    .frame(width: 42, height: 42)
                    .background(canSend ? Theme.accent : Theme.bgDeep)
                    .clipShape(RoundedRectangle(cornerRadius: 13))
            }
            .disabled(!canSend)
            .accessibilityLabel("Send message")
        }
        .padding(.horizontal, 16)
        .padding(.top, 12)
        .padding(.bottom, 16)
        .overlay(alignment: .top) {
            Divider().foregroundStyle(Theme.border)
        }
    }

    /// Send button is enabled when there's text OR a pending image
    private var canSend: Bool {
        !chatVM.inputText.trimmingCharacters(in: .whitespaces).isEmpty || chatVM.pendingImage != nil
    }
}

// MARK: - Chat Message View

struct ChatMessageView: View {
    let message: ChatMessage
    let onSuggestion: (String) -> Void
    var onProductLinkTap: ((ProductLink) -> Void)?

    var body: some View {
        HStack(alignment: .top) {
            if message.role == .user { Spacer(minLength: 40) }

            VStack(alignment: message.role == .user ? .trailing : .leading, spacing: 6) {
                // Steward avatar
                if message.role == .steward {
                    HStack(spacing: 6) {
                        StewardLogo(size: 22)

                        Text("Steward")
                            .font(Theme.body(11))
                            .foregroundStyle(Theme.inkLight)
                    }
                }

                // Image attachment (if present)
                if let image = message.image {
                    Image(uiImage: image)
                        .resizable()
                        .scaledToFill()
                        .frame(maxWidth: 200, maxHeight: 200)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                        .overlay(
                            RoundedRectangle(cornerRadius: 14)
                                .stroke(message.role == .user ? Color.white.opacity(0.2) : Theme.border, lineWidth: 1)
                        )
                }

                // Bubble (hide if text is just the screenshot placeholder and image exists)
                if message.image == nil || message.text != "📸 [Screenshot]" {
                    Text(message.text)
                        .font(Theme.body(13))
                        .foregroundStyle(message.role == .user ? .white : Theme.ink)
                        .lineSpacing(4)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 11)
                        .background(message.role == .user ? Theme.accent : Theme.bgDeep)
                        .clipShape(ChatBubbleShape(isUser: message.role == .user))
                }

                // Product link cards
                if let links = message.productLinks, !links.isEmpty {
                    VStack(spacing: 6) {
                        ForEach(links) { link in
                            ProductLinkCard(link: link) {
                                onProductLinkTap?(link)
                            }
                        }
                    }
                    .padding(.top, 4)
                }

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

// MARK: - Product Link Card

struct ProductLinkCard: View {
    let link: ProductLink
    let onTap: () -> Void

    private var sourceIcon: String {
        switch link.source.lowercased() {
        case let s where s.contains("amazon"): return "cart"
        case let s where s.contains("google"): return "magnifyingglass"
        case let s where s.contains("ebay"): return "tag"
        case let s where s.contains("walmart"): return "storefront"
        case let s where s.contains("target"): return "target"
        case let s where s.contains("best buy"): return "desktopcomputer"
        default: return "globe"
        }
    }

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 10) {
                // Product image or source icon fallback
                if let imageURLString = link.imageURL, let imgURL = URL(string: imageURLString) {
                    AsyncImage(url: imgURL) { phase in
                        switch phase {
                        case .success(let image):
                            image
                                .resizable()
                                .scaledToFill()
                        case .failure:
                            sourceIconView
                        default:
                            ProgressView()
                                .controlSize(.small)
                                .frame(width: 40, height: 40)
                        }
                    }
                    .frame(width: 40, height: 40)
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                } else {
                    sourceIconView
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text(link.title)
                        .font(Theme.body(12, weight: .semibold))
                        .foregroundStyle(Theme.ink)
                        .lineLimit(1)

                    HStack(spacing: 4) {
                        Text(link.source)
                            .font(Theme.body(10, weight: .medium))
                            .foregroundStyle(Theme.accent)

                        if let price = link.price {
                            Text("·")
                                .foregroundStyle(Theme.inkLight)
                            Text(price)
                                .font(Theme.body(10))
                                .foregroundStyle(Theme.inkMid)
                        }
                    }
                }

                Spacer()

                Image(systemName: "arrow.up.right.square")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(Theme.accent)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
            .background(Theme.bgCard)
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Theme.accentMid, lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }

    private var sourceIconView: some View {
        Image(systemName: sourceIcon)
            .font(.system(size: 14))
            .foregroundStyle(Theme.accent)
            .frame(width: 40, height: 40)
            .background(Theme.accentLight)
            .clipShape(RoundedRectangle(cornerRadius: 8))
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
                    StewardLogo(size: 22)

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

// MARK: - Browser Item (for .sheet(item:))

struct BrowserItem: Identifiable {
    let id = UUID()
    let url: URL
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
