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
    @State private var speechRecognizer = SpeechRecognizer()

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

            // Set up direct callback for watch URL updates (from "Ask AI to fix")
            chatVM.onWatchUpdate = { [watchVM] name, url in
                #if DEBUG
                print("[ChatDrawer] onWatchUpdate callback: name=\(name), url=\(url)")
                #endif
                watchVM.fixBrokenWatch(name: name, newURL: url)
            }

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

    // MARK: - Suggestion Handler

    private func handleSuggestionTap(_ text: String) {
        let lower: String = text.lowercased()

        // "Email support" opens mailto link
        if lower == "email support" {
            let mailURL: URL? = URL(string: "mailto:hello@joinsteward.app?subject=Steward%20Support")
            if let url = mailURL { UIApplication.shared.open(url) }
            return
        }

        // "Browse & find it" / "Find the link myself" opens in-app browser
        let isBrowse: Bool = lower.contains("browse & find it") || lower.contains("find the link myself") || lower.contains("find it myself")
        if isBrowse {
            // Gather ALL conversation text (user + steward) for full context
            let allText: String = chatVM.messages.map { $0.text.lowercased() }.joined(separator: " ")

            let browseURL: URL? = {
                // Use RECENT messages (last 4) for context, not full history
                // This prevents early category chips (e.g. "Camping") from overriding
                // when the user shifted topics (e.g. to concert tickets)
                let recentMessages = Array(chatVM.messages.suffix(4))
                let recentText = recentMessages.map { $0.text.lowercased() }.joined(separator: " ")

                // ─── 1. Check for specific brand/site mentions in recent context ───
                let brands: [(keywords: [String], url: String)] = [
                    // Car rental brands
                    (["hertz"], "https://www.hertz.com"),
                    (["enterprise"], "https://www.enterprise.com"),
                    (["avis"], "https://www.avis.com"),
                    (["budget rental", "budget car"], "https://www.budget.com"),
                    (["national car", "nationalcar"], "https://www.nationalcar.com"),
                    (["sixt"], "https://www.sixt.com"),
                    (["turo"], "https://turo.com"),
                    // Hotel brands
                    (["marriott", "bonvoy"], "https://www.marriott.com"),
                    (["hilton"], "https://www.hilton.com"),
                    (["hyatt"], "https://www.hyatt.com"),
                    (["airbnb"], "https://www.airbnb.com"),
                    (["vrbo"], "https://www.vrbo.com"),
                    // Airline brands
                    (["southwest", "wanna get away"], "https://www.southwest.com"),
                    (["delta air", "delta flight"], "https://www.delta.com"),
                    (["united air", "united flight"], "https://www.united.com"),
                    (["american airlines"], "https://www.aa.com"),
                    (["jetblue"], "https://www.jetblue.com"),
                    (["spirit air", "spirit flight"], "https://www.spirit.com"),
                    (["frontier air", "frontier flight"], "https://www.flyfrontier.com"),
                    (["alaska air"], "https://www.alaskaair.com"),
                    // Ticket sites
                    (["stubhub"], "https://www.stubhub.com"),
                    (["seatgeek"], "https://www.seatgeek.com"),
                ]
                for brand in brands {
                    if brand.keywords.contains(where: { recentText.contains($0) }) {
                        return URL(string: brand.url)
                    }
                }

                // ─── 2. Smart search URL from recent context ───
                // Use the AI's LAST RESPONSE to extract parsed details (event name, venue, etc.)
                // The AI already did the hard work of understanding the user's intent
                let lastAIMsg = recentMessages.last(where: { $0.role == .steward })?.text ?? ""
                let lastUserMsg = recentMessages.last(where: { $0.role == .user })?.text ?? ""

                // Helper: extract a smart search query from the AI's response
                // The AI typically says things like "The Chicks concert at Yaamava' Resort"
                // or "Carbone in NYC" — this is much better than the raw user message
                func extractSearchQuery(from aiResponse: String, userMsg: String, category: String) -> String {
                    // Try to extract specific names from AI response
                    // Pattern: look for quoted names, or text after "The" / "at" / "for" / "in"
                    let ai = aiResponse
                    let patterns: [String] = [
                        // "The Chicks concert at Yaamava' Resort & Casino"
                        "(?:Got it!|Perfect!|I'll|Let me).*?\\b((?:[A-Z][a-z']+(?:\\s+(?:&|and|at|the|in|vs|vs\\.))?\\s*)+(?:[A-Z][a-z']+|[A-Z]+)(?:\\s+(?:Resort|Casino|Arena|Center|Stadium|Theatre|Theater|Garden|Hall|Park|Club|Lounge)(?:\\s*&?\\s*\\w+)?)?)",
                    ]
                    for pattern in patterns {
                        if let match = ai.range(of: pattern, options: .regularExpression) {
                            let extracted = String(ai[match])
                                .replacingOccurrences(of: "(?i)^(got it!?|perfect!?|i'll|let me)\\s*", with: "", options: .regularExpression)
                                .trimmingCharacters(in: .whitespacesAndNewlines)
                                .components(separatedBy: ".").first ?? ""
                            if extracted.count > 3 && extracted.count < 100 {
                                return extracted.trimmingCharacters(in: .punctuationCharacters.union(.whitespaces))
                            }
                        }
                    }
                    // Fallback: clean up the user message
                    return userMsg
                        .replacingOccurrences(of: "(?i)browse.*find.*it|this is for|i want|can you|please|watch for|track|monitor", with: "", options: .regularExpression)
                        .replacingOccurrences(of: "(?i)^(a |an |the |some )", with: "", options: .regularExpression)
                        .trimmingCharacters(in: .whitespacesAndNewlines)
                }

                // Tickets/events — build Ticketmaster search with event details from AI
                if recentText.contains("ticket") || recentText.contains("concert") || recentText.contains("event") || recentText.contains("show") || recentText.contains("game") {
                    let query = extractSearchQuery(from: lastAIMsg, userMsg: lastUserMsg, category: "tickets")
                    if !query.isEmpty, let encoded = query.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) {
                        return URL(string: "https://www.ticketmaster.com/search?q=\(encoded)")
                    }
                    return URL(string: "https://www.ticketmaster.com")
                }

                // Restaurant reservations — use AI's parsed restaurant name
                if recentText.contains("reservation") || recentText.contains("restaurant") || recentText.contains("table for") || recentText.contains("resy") || recentText.contains("opentable") {
                    let query = extractSearchQuery(from: lastAIMsg, userMsg: lastUserMsg, category: "restaurant")
                    if !query.isEmpty, let encoded = query.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) {
                        return URL(string: "https://resy.com/cities?query=\(encoded)")
                    }
                    return URL(string: "https://resy.com")
                }

                // Camping — use AI's parsed campground name
                if recentText.contains("camping") || recentText.contains("campground") || recentText.contains("campsite") || recentText.contains("recreation.gov") {
                    let query = extractSearchQuery(from: lastAIMsg, userMsg: lastUserMsg, category: "camping")
                    if !query.isEmpty, let encoded = query.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) {
                        return URL(string: "https://www.recreation.gov/search?q=\(encoded)")
                    }
                    return URL(string: "https://www.recreation.gov")
                }

                // Car rental (generic)
                if recentText.contains("car rental") || recentText.contains("rental car") || recentText.contains("rent a car") {
                    return URL(string: "https://www.kayak.com/cars")
                }
                // Hotel (generic)
                if recentText.contains("hotel") || recentText.contains("stay") || recentText.contains("lodging") || recentText.contains("accommodation") {
                    return URL(string: "https://www.kayak.com/hotels")
                }
                // Flight (generic)
                if recentText.contains("flight") || recentText.contains("fly") || recentText.contains("airfare") {
                    return URL(string: "https://www.kayak.com/flights")
                }

                // ─── 3. Default: Google search with AI's understanding ───
                let smartQuery = extractSearchQuery(from: lastAIMsg, userMsg: lastUserMsg, category: "general")
                let query: String = !smartQuery.isEmpty ? smartQuery : (watchVM.selectedWatch?.name ?? "product")
                let encoded: String = query.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? query
                return URL(string: "https://www.google.com/search?q=\(encoded)")
            }()
            if let url = browseURL { browserItem = BrowserItem(url: url) }
            return
        }

        // Category follow-ups (Product, Travel, Reservation, Events, Camping, Screenshot, General, Need help?)
        if let followUp = ChatMessage.categoryFollowUp(for: text) {
            let userMsg = ChatMessage(role: .user, text: text)
            withAnimation(.spring(response: 0.3)) {
                chatVM.messages.append(userMsg)
            }
            Task { @MainActor in
                try? await Task.sleep(for: .milliseconds(300))
                withAnimation(.spring(response: 0.3)) {
                    chatVM.messages.append(followUp)
                }
            }
            return
        }

        // Special sub-chip handlers (Best price anywhere, Watch Resy tables, camping/event chips)
        if let followUp = ChatMessage.specialChipFollowUp(for: text) {
            let userMsg = ChatMessage(role: .user, text: text)
            withAnimation(.spring(response: 0.3)) {
                chatVM.messages.append(userMsg)
            }
            Task { @MainActor in
                try? await Task.sleep(for: .milliseconds(300))
                withAnimation(.spring(response: 0.3)) {
                    chatVM.messages.append(followUp)
                }
            }
            return
        }

        // Beta-tagged suggestions — show disclaimer then send to AI
        if text.hasSuffix("(Beta)") {
            let cleanText = text.replacingOccurrences(of: " (Beta)", with: "")
            let userMsg = ChatMessage(role: .user, text: cleanText)
            withAnimation(.spring(response: 0.3)) {
                chatVM.messages.append(userMsg)
            }
            Task { @MainActor in
                try? await Task.sleep(for: .milliseconds(300))
                let disclaimer = ChatMessage(
                    role: .steward,
                    text: "Just a heads up, this one's still in beta so it might not catch every change perfectly. But let's give it a shot!\n\nDrop me a link and I'll get it set up \u{1F517}"
                )
                withAnimation(.spring(response: 0.3)) {
                    chatVM.messages.append(disclaimer)
                }
            }
            return
        }

        chatVM.send(text)
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

    // MARK: - First Watch Suggestions

    private var firstWatchSuggestions: some View {
        VStack(spacing: 16) {
            Spacer()

            Image(systemName: "sparkles")
                .font(.system(size: 32))
                .foregroundStyle(Theme.accent.opacity(0.6))
                .padding(.bottom, 4)

            Text("What would you like to watch?")
                .font(Theme.serif(18, weight: .bold))
                .foregroundStyle(Theme.ink)

            Text("Paste any URL, or try one of these:")
                .font(Theme.body(13))
                .foregroundStyle(Theme.inkLight)

            VStack(spacing: 8) {
                suggestionChip("Watch AirPods Pro price on Amazon", icon: "tag.fill")
                suggestionChip("Track Nike Dunk Low price", icon: "cart.fill")
                suggestionChip("Monitor a campsite on Recreation.gov", icon: "leaf.fill")
                suggestionChip("Watch for concert ticket prices", icon: "music.note")
            }
            .padding(.horizontal, 8)

            Spacer()
        }
        .padding(.horizontal, 20)
    }

    private func suggestionChip(_ text: String, icon: String) -> some View {
        Button {
            chatVM.send(text)
        } label: {
            HStack(spacing: 10) {
                Image(systemName: icon)
                    .font(.system(size: 13))
                    .foregroundStyle(Theme.accent)
                    .frame(width: 24)

                Text(text)
                    .font(Theme.body(13))
                    .foregroundStyle(Theme.ink)
                    .lineLimit(1)

                Spacer()

                Image(systemName: "arrow.up.right")
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundStyle(Theme.inkLight)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .background(Theme.bgCard)
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Theme.border, lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }

    // MARK: - Message List

    private var messageList: some View {
        ScrollViewReader { proxy in
            ScrollView {
                VStack(spacing: 14) {
                    // Show suggestions when chat is empty (first-watch flow)
                    if chatVM.messages.isEmpty && watchVM.watches.isEmpty {
                        firstWatchSuggestions
                    }

                    ForEach(chatVM.messages) { msg in
                        ChatMessageView(
                            message: msg,
                            onSuggestion: { text in
                                handleSuggestionTap(text)
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
        VStack(spacing: 0) {
            // Listening indicator
            if speechRecognizer.isListening {
                HStack(spacing: 8) {
                    // Pulsing dot
                    Circle()
                        .fill(Color.red)
                        .frame(width: 8, height: 8)
                        .modifier(PulseModifier())

                    Text("Listening...")
                        .font(Theme.body(12, weight: .medium))
                        .foregroundStyle(Theme.accent)

                    Spacer()

                    Button {
                        speechRecognizer.stopListening()
                    } label: {
                        Text("Done")
                            .font(Theme.body(12, weight: .semibold))
                            .foregroundStyle(Theme.accent)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 8)
                .background(Theme.accent.opacity(0.08))
                .transition(.move(edge: .bottom).combined(with: .opacity))
            }

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
                            .stroke(speechRecognizer.isListening ? Theme.accent : Theme.border, lineWidth: speechRecognizer.isListening ? 1.5 : 1)
                    )
                    .focused($isInputFocused)
                    .submitLabel(.send)
                    .onSubmit {
                        chatVM.send()
                    }

                // Mic button (shown when input is empty and not sending)
                if !canSend && !speechRecognizer.isListening {
                    Button {
                        speechRecognizer.toggleListening()
                    } label: {
                        Image(systemName: "mic.fill")
                            .font(.system(size: 16, weight: .medium))
                            .foregroundStyle(Theme.inkLight)
                            .frame(width: 42, height: 42)
                            .background(Theme.bgDeep)
                            .clipShape(RoundedRectangle(cornerRadius: 13))
                    }
                    .accessibilityLabel("Voice input")
                    .transition(.scale.combined(with: .opacity))
                } else if speechRecognizer.isListening {
                    // Stop/send button while listening
                    Button {
                        speechRecognizer.stopListening()
                        // Small delay to let final transcript settle, then send
                        if !chatVM.inputText.trimmingCharacters(in: .whitespaces).isEmpty {
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                                chatVM.send()
                            }
                        }
                    } label: {
                        Image(systemName: "stop.fill")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(.white)
                            .frame(width: 42, height: 42)
                            .background(Color.red)
                            .clipShape(RoundedRectangle(cornerRadius: 13))
                    }
                    .accessibilityLabel("Stop listening and send")
                    .transition(.scale.combined(with: .opacity))
                } else {
                    // Regular send button
                    Button {
                        chatVM.send()
                    } label: {
                        Image(systemName: "arrow.up")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundStyle(.white)
                            .frame(width: 42, height: 42)
                            .background(Theme.accent)
                            .clipShape(RoundedRectangle(cornerRadius: 13))
                    }
                    .accessibilityLabel("Send message")
                    .transition(.scale.combined(with: .opacity))
                }
            }
            .padding(.horizontal, 16)
            .padding(.top, 12)
            .padding(.bottom, 16)
            .animation(.spring(response: 0.25), value: canSend)
            .animation(.spring(response: 0.25), value: speechRecognizer.isListening)
        }
        .overlay(alignment: .top) {
            Divider().foregroundStyle(Theme.border)
        }
        // Sync speech transcript → chat input in real time
        .onChange(of: speechRecognizer.transcript) { _, newValue in
            if !newValue.isEmpty {
                chatVM.inputText = newValue
            }
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
                            let isBeta = suggestion.hasSuffix("(Beta)") || suggestion == "General (Beta)"
                            let displayText = isBeta ? suggestion.replacingOccurrences(of: " (Beta)", with: "").replacingOccurrences(of: "(Beta)", with: "") : suggestion
                            Button {
                                onSuggestion(suggestion)
                            } label: {
                                HStack(spacing: 5) {
                                    Text(displayText)
                                        .font(Theme.body(12, weight: .medium))
                                        .foregroundStyle(Theme.accent)

                                    if isBeta {
                                        Text("Beta")
                                            .font(.system(size: 9, weight: .bold))
                                            .foregroundStyle(.white)
                                            .padding(.horizontal, 5)
                                            .padding(.vertical, 2)
                                            .background(Color.orange)
                                            .clipShape(Capsule())
                                    }
                                }
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
