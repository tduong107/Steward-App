import SwiftUI
import UniformTypeIdentifiers

/// Share Extension view — lets users create a watch directly from the share sheet.
///
/// Flow:
/// 1. Extract URL from shared content
/// 2. User picks watch type (Price Drop, Restock, Any Changes) or enters a custom prompt
/// 3. AI analyzes the URL and creates the watch
/// 4. Watch saved to Supabase -> success -> dismiss
struct ShareExtensionView: View {
    let attachments: [NSItemProvider]
    let onComplete: (String) -> Void
    let onCancel: () -> Void

    // MARK: - State

    @State private var sharedURL: String = ""
    @State private var sharedText: String = ""   // context text shared alongside URL
    @State private var pageTitle: String?
    @State private var rewriteResult: RewriteResult?   // URL rewriting for known sites
    @State private var phase: Phase = .extracting
    @State private var chatMessages: [ChatMessage] = []
    @State private var userInput: String = ""
    @State private var isSendingChat = false
    @State private var capturedCookies: [SerializedCookie]?  // cookies from WebView login
    @State private var cookieDomain: String?
    @FocusState private var isInputFocused: Bool

    // Watch proposal editing state
    @State private var proposalFrequency: String = "Daily"
    @State private var partySize: Int = 2
    @State private var preferredDate: Date = Date()
    @State private var preferredTime: Date = {
        // Default to 7 PM today
        let cal = Calendar.current
        return cal.date(bySettingHour: 19, minute: 0, second: 0, of: Date()) ?? Date()
    }()

    enum Phase: Equatable {
        case extracting
        case ready
        case analyzing
        case customChat          // AI conversational flow
        case loginWebView(URL)   // WebView for auth cookie capture
        case watchCreated(WatchInfo)
        case saving(WatchInfo)
        case success(WatchInfo)
        case error(String)
        case notSignedIn
    }

    struct WatchInfo: Equatable {
        let emoji: String
        let name: String
        let condition: String
        let actionType: String
        let checkFrequency: String
        let imageURL: String?
    }

    struct ChatMessage: Identifiable, Equatable {
        let id = UUID()
        let role: Role
        let text: String
        enum Role: Equatable { case user, assistant }
    }

    // Steward colors
    private let accentGreen = Color(red: 0.165, green: 0.361, blue: 0.271)
    private let mintGreen = Color(red: 0.431, green: 0.906, blue: 0.718)  // #6EE7B7
    private let cardBg = Color(red: 0.12, green: 0.13, blue: 0.12)
    private let darkBg = Color(red: 0.07, green: 0.08, blue: 0.07)
    private let inputBg = Color(red: 0.15, green: 0.16, blue: 0.15)

    // MARK: - Body

    var body: some View {
        ZStack {
            darkBg.ignoresSafeArea()

            VStack(spacing: 0) {
                // -- Header --
                header
                    .padding(.top, 12)

                Divider()
                    .overlay(Color.white.opacity(0.08))

                // -- Content --
                switch phase {
                case .extracting:
                    loadingContent(message: "Reading shared content...")

                case .ready:
                    readyContent

                case .analyzing:
                    loadingContent(message: "Analyzing page...")

                case .customChat:
                    customChatContent

                case .loginWebView(let url):
                    LoginWebView(
                        url: url,
                        targetDomain: displayHost,
                        onCookiesCaptured: { cookies in
                            capturedCookies = cookies
                            cookieDomain = displayHost
                            withAnimation { phase = .ready }
                        },
                        onDismiss: {
                            withAnimation { phase = .ready }
                        }
                    )

                case .watchCreated(let info):
                    watchProposalContent(info)

                case .saving(let info):
                    savingContent(info)

                case .success(let info):
                    successContent(info)

                case .error(let message):
                    errorContent(message)

                case .notSignedIn:
                    notSignedInContent
                }
            }
        }
        .task {
            await extractURL()
        }
    }

    // MARK: - Header

    private var header: some View {
        HStack(spacing: 10) {
            // App icon + title
            HStack(spacing: 8) {
                Image("StewardIcon", bundle: .main)
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .frame(width: 30, height: 30)
                    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))

                Text("Steward")
                    .font(.custom("Georgia-Bold", size: 18))
                    .foregroundStyle(.white)
            }

            Spacer()

            // Close button
            Button {
                onCancel()
            } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(.gray)
                    .frame(width: 28, height: 28)
                    .background(Color.white.opacity(0.1))
                    .clipShape(Circle())
            }
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 12)
    }

    // MARK: - URL Card

    private var urlCard: some View {
        VStack(spacing: 8) {
            HStack(spacing: 10) {
                Image(systemName: "link")
                    .font(.system(size: 13))
                    .foregroundStyle(.white)
                    .frame(width: 28, height: 28)
                    .background(accentGreen)
                    .clipShape(RoundedRectangle(cornerRadius: 7))

                VStack(alignment: .leading, spacing: 2) {
                    // Show shared text as title if it's more descriptive than the host
                    Text(pageTitle ?? (sharedText.isEmpty ? displayHost : sharedText))
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(.white)
                        .lineLimit(2)
                    Text(displayHost)
                        .font(.system(size: 12))
                        .foregroundStyle(.gray)
                        .lineLimit(1)
                }
                Spacer()
            }

            // URL rewritten for known site
            if rewriteResult != nil {
                HStack(spacing: 6) {
                    Image(systemName: "checkmark.shield.fill")
                        .font(.system(size: 10))
                    Text("Public page — no login needed")
                        .font(.system(size: 11))
                }
                .foregroundStyle(mintGreen)
                .padding(.horizontal, 4)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            // Auth-walled site with cookies captured
            else if isAuthWalled && capturedCookies != nil {
                HStack(spacing: 6) {
                    Image(systemName: "checkmark.shield.fill")
                        .font(.system(size: 10))
                    Text("Signed in — Steward can check this page")
                        .font(.system(size: 11))
                }
                .foregroundStyle(mintGreen)
                .padding(.horizontal, 4)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            // Auth-walled site, no cookies yet
            else if isAuthWalled {
                VStack(spacing: 8) {
                    HStack(spacing: 6) {
                        Image(systemName: "lock.fill")
                            .font(.system(size: 10))
                        Text("This site requires login to check content")
                            .font(.system(size: 11))
                    }
                    .foregroundStyle(.orange)
                    .frame(maxWidth: .infinity, alignment: .leading)

                    Button {
                        if let url = URL(string: sharedURL) {
                            withAnimation { phase = .loginWebView(url) }
                        }
                    } label: {
                        HStack(spacing: 6) {
                            Image(systemName: "person.crop.circle.badge.checkmark")
                                .font(.system(size: 12))
                            Text("Sign in to watch")
                                .font(.system(size: 13, weight: .medium))
                        }
                        .foregroundStyle(mintGreen)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 7)
                        .background(accentGreen.opacity(0.2))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
                .padding(.horizontal, 4)
            }
        }
        .padding(12)
        .background(cardBg)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal, 20)
    }

    // MARK: - Ready Content (pick watch type)

    private var readyContent: some View {
        ScrollView {
            VStack(spacing: 14) {
                urlCard
                    .padding(.top, 14)

                Text("What should I watch for?")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(.white.opacity(0.6))
                    .padding(.top, 2)

                // Context-aware preset watch types
                VStack(spacing: 8) {
                    ForEach(Array(suggestionChips.enumerated()), id: \.offset) { _, chip in
                        watchTypeButton(icon: chip.icon, label: chip.label, subtitle: chip.subtitle, type: chip.type)
                    }
                }
                .padding(.horizontal, 20)

                // Divider with "or"
                HStack(spacing: 12) {
                    Rectangle()
                        .fill(Color.white.opacity(0.08))
                        .frame(height: 1)
                    Text("or")
                        .font(.system(size: 12))
                        .foregroundStyle(.gray)
                    Rectangle()
                        .fill(Color.white.opacity(0.08))
                        .frame(height: 1)
                }
                .padding(.horizontal, 32)
                .padding(.vertical, 2)

                // Custom AI option
                Button {
                    withAnimation(.spring(response: 0.3)) {
                        phase = .customChat
                        chatMessages = [
                            ChatMessage(
                                role: .assistant,
                                text: "Tell me what you'd like to watch for on this page. For example: \"notify me when tickets go on sale\" or \"watch for new sizes.\""
                            )
                        ]
                    }
                } label: {
                    HStack(spacing: 10) {
                        Image(systemName: "sparkles")
                            .font(.system(size: 14))
                            .foregroundStyle(mintGreen)
                            .frame(width: 24)
                        VStack(alignment: .leading, spacing: 1) {
                            Text("Something else...")
                                .font(.system(size: 15, weight: .medium))
                                .foregroundStyle(.white)
                            Text("Describe what you want to watch")
                                .font(.system(size: 12))
                                .foregroundStyle(.gray)
                        }
                        Spacer()
                        Image(systemName: "chevron.right")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(.gray)
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                    .background(cardBg)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .strokeBorder(mintGreen.opacity(0.2), lineWidth: 1)
                    )
                }
                .padding(.horizontal, 20)
            }
            .padding(.bottom, 20)
        }
    }

    private func watchTypeButton(icon: String, label: String, subtitle: String, type: String) -> some View {
        Button {
            Task { await analyzeAndCreateWatch(watchType: type) }
        } label: {
            HStack(spacing: 10) {
                Image(systemName: icon)
                    .font(.system(size: 14))
                    .foregroundStyle(accentGreen)
                    .frame(width: 24)
                VStack(alignment: .leading, spacing: 1) {
                    Text(label)
                        .font(.system(size: 15, weight: .medium))
                        .foregroundStyle(.white)
                    Text(subtitle)
                        .font(.system(size: 12))
                        .foregroundStyle(.gray)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(.gray)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(cardBg)
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }

    // MARK: - Custom Chat Content

    private var customChatContent: some View {
        VStack(spacing: 0) {
            // Compact URL card
            urlCard
                .padding(.top, 10)

            // Chat messages
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 10) {
                        ForEach(chatMessages) { msg in
                            chatBubble(msg)
                                .id(msg.id)
                        }

                        if isSendingChat {
                            HStack(spacing: 6) {
                                ProgressView()
                                    .tint(mintGreen)
                                    .scaleEffect(0.7)
                                Text("Thinking...")
                                    .font(.system(size: 13))
                                    .foregroundStyle(.gray)
                                Spacer()
                            }
                            .padding(.horizontal, 20)
                            .padding(.vertical, 4)
                            .id("typing")
                        }
                    }
                    .padding(.vertical, 12)
                }
                .onChange(of: chatMessages.count) { _, _ in
                    withAnimation {
                        proxy.scrollTo(chatMessages.last?.id, anchor: .bottom)
                    }
                }
                .onChange(of: isSendingChat) { _, sending in
                    if sending {
                        withAnimation {
                            proxy.scrollTo("typing", anchor: .bottom)
                        }
                    }
                }
            }

            Divider()
                .overlay(Color.white.opacity(0.08))

            // Input bar
            chatInputBar
        }
    }

    private func chatBubble(_ message: ChatMessage) -> some View {
        HStack {
            if message.role == .user { Spacer(minLength: 48) }

            Text(message.text)
                .font(.system(size: 14))
                .foregroundStyle(message.role == .user ? .white : .white.opacity(0.9))
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(
                    message.role == .user
                        ? accentGreen
                        : cardBg
                )
                .clipShape(RoundedRectangle(cornerRadius: 16))

            if message.role == .assistant { Spacer(minLength: 48) }
        }
        .padding(.horizontal, 20)
    }

    private var chatInputBar: some View {
        HStack(spacing: 10) {
            TextField("Describe what to watch...", text: $userInput)
                .font(.system(size: 15))
                .foregroundStyle(.white)
                .tint(mintGreen)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(inputBg)
                .clipShape(RoundedRectangle(cornerRadius: 20))
                .focused($isInputFocused)

            Button {
                sendChatMessage()
            } label: {
                Image(systemName: "arrow.up.circle.fill")
                    .font(.system(size: 30))
                    .foregroundStyle(
                        userInput.trimmingCharacters(in: .whitespaces).isEmpty || isSendingChat
                            ? Color.gray.opacity(0.4)
                            : mintGreen
                    )
            }
            .disabled(userInput.trimmingCharacters(in: .whitespaces).isEmpty || isSendingChat)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .onAppear {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                isInputFocused = true
            }
        }
    }

    // MARK: - Watch Proposal Content

    /// Whether the current watch is a booking/reservation type (restaurant or ticketing)
    private var isBookingWatch: Bool {
        let category = URLRewriter.categorize(sharedURL, rewriteResult: rewriteResult)
        return category == .restaurant || category == .ticketing
    }

    /// Builds the final condition string including reservation details for booking watches
    private func buildFinalCondition(base: String) -> String {
        guard isBookingWatch else { return base }

        let category = URLRewriter.categorize(sharedURL, rewriteResult: rewriteResult)
        let dateFormatter = DateFormatter()
        dateFormatter.dateStyle = .medium
        let timeFormatter = DateFormatter()
        timeFormatter.timeStyle = .short

        let dateStr = dateFormatter.string(from: preferredDate)
        let timeStr = timeFormatter.string(from: preferredTime)

        if category == .restaurant {
            return "Table for \(partySize) on \(dateStr) around \(timeStr)"
        } else {
            return "Tickets available on \(dateStr)"
        }
    }

    /// Builds the final WatchInfo with user edits applied
    private func buildFinalWatch(from info: WatchInfo) -> WatchInfo {
        WatchInfo(
            emoji: info.emoji,
            name: info.name,
            condition: buildFinalCondition(base: info.condition),
            actionType: info.actionType,
            checkFrequency: proposalFrequency,
            imageURL: info.imageURL
        )
    }

    private func watchProposalContent(_ info: WatchInfo) -> some View {
        ScrollView {
            VStack(spacing: 16) {
                // Back button
                HStack {
                    Button {
                        withAnimation(.spring(response: 0.3)) { phase = .ready }
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "chevron.left")
                                .font(.system(size: 13, weight: .semibold))
                            Text("Back")
                                .font(.system(size: 14, weight: .medium))
                        }
                        .foregroundStyle(mintGreen)
                    }
                    Spacer()
                }
                .padding(.horizontal, 20)
                .padding(.top, 10)

                // Watch preview card
                VStack(spacing: 6) {
                    Text(info.emoji)
                        .font(.system(size: 36))
                    Text(info.name)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(.white)
                        .multilineTextAlignment(.center)
                        .lineLimit(2)
                }
                .padding(.top, 4)
                .padding(.horizontal, 20)

                // Reservation details (for restaurant & ticketing watches)
                if isBookingWatch {
                    reservationDetailsSection
                }

                // Frequency picker
                frequencyPickerSection

                Spacer(minLength: 20)
            }
        }
        .safeAreaInset(edge: .bottom) {
            // Start Watching button pinned to bottom
            Button {
                Task { await saveWatch(buildFinalWatch(from: info)) }
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: "eye")
                        .font(.system(size: 15, weight: .semibold))
                    Text("Start Watching")
                        .font(.system(size: 16, weight: .semibold))
                }
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(accentGreen)
                .clipShape(RoundedRectangle(cornerRadius: 14))
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 16)
            .background(darkBg)
        }
    }

    // MARK: - Reservation Details Section

    private var reservationDetailsSection: some View {
        let category = URLRewriter.categorize(sharedURL, rewriteResult: rewriteResult)

        return VStack(alignment: .leading, spacing: 12) {
            Text(category == .restaurant ? "Reservation Details" : "Event Details")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(.white.opacity(0.6))
                .padding(.horizontal, 4)

            VStack(spacing: 0) {
                // Party size (restaurant only)
                if category == .restaurant {
                    HStack {
                        Image(systemName: "person.2.fill")
                            .font(.system(size: 13))
                            .foregroundStyle(mintGreen)
                            .frame(width: 24)
                        Text("Party size")
                            .font(.system(size: 14))
                            .foregroundStyle(.white)
                        Spacer()
                        HStack(spacing: 12) {
                            Button {
                                if partySize > 1 { partySize -= 1 }
                            } label: {
                                Image(systemName: "minus.circle.fill")
                                    .font(.system(size: 22))
                                    .foregroundStyle(partySize > 1 ? mintGreen : .gray.opacity(0.3))
                            }
                            .disabled(partySize <= 1)

                            Text("\(partySize)")
                                .font(.system(size: 16, weight: .semibold, design: .rounded))
                                .foregroundStyle(.white)
                                .frame(minWidth: 24)

                            Button {
                                if partySize < 20 { partySize += 1 }
                            } label: {
                                Image(systemName: "plus.circle.fill")
                                    .font(.system(size: 22))
                                    .foregroundStyle(partySize < 20 ? mintGreen : .gray.opacity(0.3))
                            }
                            .disabled(partySize >= 20)
                        }
                    }
                    .padding(.horizontal, 14)
                    .padding(.vertical, 12)

                    Divider().overlay(Color.white.opacity(0.06))
                }

                // Preferred date
                HStack {
                    Image(systemName: "calendar")
                        .font(.system(size: 13))
                        .foregroundStyle(mintGreen)
                        .frame(width: 24)
                    Text("Date")
                        .font(.system(size: 14))
                        .foregroundStyle(.white)
                    Spacer()
                    DatePicker("", selection: $preferredDate, in: Date()..., displayedComponents: .date)
                        .labelsHidden()
                        .tint(mintGreen)
                        .colorScheme(.dark)
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 10)

                // Preferred time (restaurant only)
                if category == .restaurant {
                    Divider().overlay(Color.white.opacity(0.06))

                    HStack {
                        Image(systemName: "clock.fill")
                            .font(.system(size: 13))
                            .foregroundStyle(mintGreen)
                            .frame(width: 24)
                        Text("Time")
                            .font(.system(size: 14))
                            .foregroundStyle(.white)
                        Spacer()
                        DatePicker("", selection: $preferredTime, displayedComponents: .hourAndMinute)
                            .labelsHidden()
                            .tint(mintGreen)
                            .colorScheme(.dark)
                    }
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                }
            }
            .background(cardBg)
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
        .padding(.horizontal, 20)
    }

    // MARK: - Frequency Picker Section

    private let frequencyOptions: [(label: String, value: String)] = [
        ("Daily", "Daily"),
        ("12h", "Every 12 hours"),
        ("6h", "Every 6 hours"),
        ("1h", "Every hour"),
    ]

    private var frequencyPickerSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Check Frequency")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(.white.opacity(0.6))
                .padding(.horizontal, 4)

            HStack(spacing: 8) {
                ForEach(frequencyOptions, id: \.value) { option in
                    Button {
                        withAnimation(.easeInOut(duration: 0.15)) {
                            proposalFrequency = option.value
                        }
                    } label: {
                        Text(option.label)
                            .font(.system(size: 13, weight: proposalFrequency == option.value ? .semibold : .regular))
                            .foregroundStyle(proposalFrequency == option.value ? .white : .gray)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 9)
                            .background(proposalFrequency == option.value ? accentGreen : cardBg)
                            .clipShape(Capsule())
                            .overlay(
                                Capsule()
                                    .stroke(proposalFrequency == option.value ? Color.clear : Color.white.opacity(0.1), lineWidth: 1)
                            )
                    }
                }
            }
        }
        .padding(.horizontal, 20)
    }

    // MARK: - Loading / Saving / Success / Error States

    private func loadingContent(message: String) -> some View {
        VStack(spacing: 16) {
            Spacer()
            ProgressView()
                .tint(mintGreen)
                .scaleEffect(1.2)
            Text(message)
                .font(.system(size: 14))
                .foregroundStyle(.gray)
            Spacer()
        }
    }

    private func savingContent(_ info: WatchInfo) -> some View {
        VStack(spacing: 16) {
            Spacer()
            Text(info.emoji)
                .font(.system(size: 40))
            ProgressView()
                .tint(mintGreen)
            Text("Creating watch...")
                .font(.system(size: 14))
                .foregroundStyle(.gray)
            Spacer()
        }
    }

    private func successContent(_ info: WatchInfo) -> some View {
        VStack(spacing: 12) {
            Spacer()
            ZStack {
                Circle()
                    .fill(accentGreen.opacity(0.15))
                    .frame(width: 72, height: 72)
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 48))
                    .foregroundStyle(mintGreen)
            }
            Text("Watching!")
                .font(.system(size: 20, weight: .semibold))
                .foregroundStyle(.white)
            Text("\(info.emoji) \(info.name)")
                .font(.system(size: 14))
                .foregroundStyle(.gray)
                .multilineTextAlignment(.center)
            Text(info.condition)
                .font(.system(size: 13))
                .foregroundStyle(.gray.opacity(0.7))
                .multilineTextAlignment(.center)
            Spacer()
        }
        .padding(.horizontal, 20)
    }

    private func errorContent(_ message: String) -> some View {
        VStack(spacing: 16) {
            Spacer()
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 36))
                .foregroundStyle(.orange)
            Text(message)
                .font(.system(size: 14))
                .foregroundStyle(.gray)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 20)

            Button("Try Again") {
                withAnimation { phase = .ready }
            }
            .font(.system(size: 15, weight: .medium))
            .foregroundStyle(mintGreen)

            Spacer()
        }
    }

    private var notSignedInContent: some View {
        VStack(spacing: 16) {
            Spacer()
            Image(systemName: "person.crop.circle.badge.exclamationmark")
                .font(.system(size: 40))
                .foregroundStyle(.orange)
            Text("Sign in Required")
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(.white)
            Text("Open Steward and sign in first,\nthen come back to share.")
                .font(.system(size: 14))
                .foregroundStyle(.gray)
                .multilineTextAlignment(.center)
            Spacer()
        }
    }

    // MARK: - Helpers

    private var displayHost: String {
        URL(string: sharedURL)?.host ?? sharedURL
    }

    /// Whether this URL likely requires login to access content.
    /// Sites handled by URLRewriter are NOT considered auth-walled (they have public pages).
    private var isAuthWalled: Bool {
        // If URLRewriter handled it, it's been rewritten to a public page
        if rewriteResult != nil { return false }

        let host = displayHost.lowercased()
        // Domains known to require login for meaningful content
        // NOTE: resy.com, opentable.com, ticketmaster.com are handled by URLRewriter
        let authDomains = ["yelp.com/reservations"]
        return authDomains.contains(where: { host.contains($0) })
    }

    /// A single suggestion chip definition for the share extension.
    private struct SuggestionChip {
        let icon: String
        let label: String
        let subtitle: String
        let type: String  // maps to watch type: "price", "cart", "book", "notify"
    }

    /// Context-aware suggestion chips based on the site category.
    private var suggestionChips: [SuggestionChip] {
        let category = URLRewriter.categorize(sharedURL, rewriteResult: rewriteResult)

        switch category {
        case .restaurant:
            return [
                SuggestionChip(icon: "calendar", label: "Track Reservations",
                              subtitle: "Watch for open tables or time slots", type: "book"),
                SuggestionChip(icon: "tag.fill", label: "Price Changes",
                              subtitle: "Get notified of menu or price updates", type: "price"),
                SuggestionChip(icon: "bell.fill", label: "Any Changes",
                              subtitle: "Monitor for any page updates", type: "notify"),
            ]
        case .ticketing:
            return [
                SuggestionChip(icon: "ticket.fill", label: "Ticket Availability",
                              subtitle: "Watch for tickets to become available", type: "book"),
                SuggestionChip(icon: "tag.fill", label: "Price Drop",
                              subtitle: "Get notified when price decreases", type: "price"),
                SuggestionChip(icon: "bell.fill", label: "Any Changes",
                              subtitle: "Monitor for any page updates", type: "notify"),
            ]
        case .ecommerce:
            return [
                SuggestionChip(icon: "tag.fill", label: "Price Drop",
                              subtitle: "Get notified when price decreases", type: "price"),
                SuggestionChip(icon: "cart.fill", label: "Back in Stock",
                              subtitle: "Know when it's available again", type: "cart"),
                SuggestionChip(icon: "bell.fill", label: "Any Changes",
                              subtitle: "Monitor for any page updates", type: "notify"),
            ]
        case .general:
            return [
                SuggestionChip(icon: "tag.fill", label: "Price Drop",
                              subtitle: "Get notified when price decreases", type: "price"),
                SuggestionChip(icon: "cart.fill", label: "Back in Stock",
                              subtitle: "Know when it's available again", type: "cart"),
                SuggestionChip(icon: "bell.fill", label: "Any Changes",
                              subtitle: "Monitor for any page updates", type: "notify"),
            ]
        }
    }

    /// A description of the context text + URL for the AI
    private var fullContext: String {
        var parts: [String] = []
        parts.append("URL: \(sharedURL)")
        parts.append("Website: \(displayHost)")
        if let title = pageTitle {
            parts.append("Page title: \(title)")
        }
        if let pathName = urlPathName {
            parts.append("Name from URL: \(pathName)")
        }
        if !sharedText.isEmpty {
            parts.append("Shared text: \(sharedText)")
        }
        // Include rich context from URL rewriter (restaurant name, date, event, etc.)
        if let rewrite = rewriteResult {
            parts.append(rewrite.extraContext)
        }
        if isAuthWalled {
            if capturedCookies != nil {
                parts.append("NOTE: User has signed in. Steward has session cookies and can check this page's logged-in content.")
            } else {
                parts.append("NOTE: This page requires user login. Steward cannot access logged-in content, so the watch should focus on publicly accessible aspects of this URL, or warn the user about this limitation.")
            }
        }
        return parts.joined(separator: "\n")
    }

    /// Extracts a human-readable name from the URL path (e.g. "carbone" from resy.com/cities/ny/carbone)
    private var urlPathName: String? {
        guard let url = URL(string: sharedURL) else { return nil }
        let pathComponents = url.pathComponents.filter { $0 != "/" }
        // Skip common structural segments
        let skipWords: Set<String> = ["cities", "venues", "products", "items", "pages", "p", "dp", "gp", "www"]

        // Scan all path segments from last to first, find the best human-readable one
        for segment in pathComponents.reversed() {
            // Skip empty, numbers-only, short IDs, or structural words
            if segment.isEmpty { continue }
            if segment.allSatisfy({ $0.isNumber }) { continue }
            if segment.count <= 2 { continue }
            if skipWords.contains(segment.lowercased()) { continue }
            // Skip UUID-like and hex hash segments
            if segment.range(of: "^[0-9a-f-]{8,}$", options: .regularExpression) != nil { continue }

            // Convert slugs like "le-bernardin" to "Le Bernardin"
            let cleaned = segment
                .replacingOccurrences(of: "-", with: " ")
                .replacingOccurrences(of: "_", with: " ")
                .split(separator: " ")
                .map { $0.prefix(1).uppercased() + $0.dropFirst() }
                .joined(separator: " ")
            if !cleaned.isEmpty {
                return cleaned
            }
        }
        return nil
    }

    // MARK: - URL Extraction

    private func extractURL() async {
        // First pass: try to get a URL object (Safari, Chrome, etc.)
        for provider in attachments {
            if provider.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
                do {
                    if let url = try await provider.loadItem(
                        forTypeIdentifier: UTType.url.identifier
                    ) as? URL {
                        sharedURL = url.absoluteString
                    }
                } catch { /* fall through */ }
            }
        }

        // Second pass: try to get plain text (may contain URL + context like "Check out Carbone on Resy!")
        for provider in attachments {
            if provider.hasItemConformingToTypeIdentifier(UTType.plainText.identifier) {
                do {
                    if let text = try await provider.loadItem(
                        forTypeIdentifier: UTType.plainText.identifier
                    ) as? String {
                        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)

                        // If we don't have a URL yet, try to extract from text
                        if sharedURL.isEmpty {
                            if let url = extractURLFromText(trimmed) {
                                sharedURL = url
                            }
                        }

                        // Capture surrounding text as context (strip out the URL itself)
                        let contextText = trimmed
                            .replacingOccurrences(of: sharedURL, with: "")
                            .trimmingCharacters(in: .whitespacesAndNewlines)
                        if !contextText.isEmpty && contextText.count > 2 {
                            sharedText = contextText
                        }
                    }
                } catch { /* fall through */ }
            }
        }

        guard !sharedURL.isEmpty else {
            onCancel()
            return
        }

        // Try URL rewriting for known sites (Resy, OpenTable, Ticketmaster)
        if let result = URLRewriter.rewrite(sharedURL) {
            rewriteResult = result
            if result.wasRewritten {
                sharedURL = result.rewrittenURL  // Use the public URL for monitoring
            }
            // Use the rewriter's site name as page title if we don't have one
            // Also pre-populate reservation details from the URL context
            let lines = result.extraContext.components(separatedBy: "\n")
            for line in lines {
                if pageTitle == nil && (line.hasPrefix("Restaurant:") || line.hasPrefix("Event:")) {
                    pageTitle = line.components(separatedBy: ": ").dropFirst().joined(separator: ": ")
                }
                // Pre-populate party size from URL params
                if line.hasPrefix("Party size:") {
                    let value = line.components(separatedBy: ": ").dropFirst().joined()
                    if let size = Int(value.trimmingCharacters(in: .whitespaces)), size >= 1 && size <= 20 {
                        partySize = size
                    }
                }
                // Pre-populate date from URL params (format: YYYY-MM-DD)
                if line.hasPrefix("Requested date:") {
                    let value = line.components(separatedBy: ": ").dropFirst().joined().trimmingCharacters(in: .whitespaces)
                    let df = DateFormatter()
                    df.dateFormat = "yyyy-MM-dd"
                    if let date = df.date(from: value) {
                        preferredDate = date
                    }
                }
            }
        }

        await fetchPageTitle()
        checkAuthAndProceed()
    }

    /// Extracts the first HTTP(S) URL from a block of text
    private func extractURLFromText(_ text: String) -> String? {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)

        // If the entire text is a URL, use it directly
        if let url = URL(string: trimmed), url.scheme?.hasPrefix("http") == true {
            return trimmed
        }

        // Search for URLs within the text using NSDataDetector
        guard let detector = try? NSDataDetector(types: NSTextCheckingResult.CheckingType.link.rawValue) else {
            return nil
        }
        let range = NSRange(trimmed.startIndex..., in: trimmed)
        let matches = detector.matches(in: trimmed, range: range)

        for match in matches {
            guard let matchRange = Range(match.range, in: trimmed) else { continue }
            let urlString = String(trimmed[matchRange])
            if let url = URL(string: urlString), url.scheme?.hasPrefix("http") == true {
                return urlString
            }
        }

        return nil
    }

    private func checkAuthAndProceed() {
        if ShareAPIService.isAuthenticated {
            withAnimation { phase = .ready }
        } else {
            withAnimation { phase = .notSignedIn }
        }
    }

    /// Fetches the page title for display in the URL card
    private func fetchPageTitle() async {
        guard let url = URL(string: sharedURL) else { return }

        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 5
        let session = URLSession(configuration: config)

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)", forHTTPHeaderField: "User-Agent")

        guard let (data, _) = try? await session.data(for: request),
              let html = String(data: data, encoding: .utf8) else { return }

        // Extract og:title or <title>
        let patterns = [
            "property=\"og:title\"\\s+content=\"([^\"]+)\"",
            "content=\"([^\"]+)\"\\s+property=\"og:title\"",
            "<title[^>]*>([^<]+)</title>"
        ]
        for pattern in patterns {
            if let regex = try? NSRegularExpression(pattern: pattern, options: .caseInsensitive),
               let match = regex.firstMatch(in: html, range: NSRange(html.startIndex..., in: html)),
               let range = Range(match.range(at: 1), in: html) {
                let title = decodeHTMLEntities(String(html[range]).trimmingCharacters(in: .whitespacesAndNewlines))
                if !title.isEmpty {
                    pageTitle = title
                    return
                }
            }
        }
    }

    /// Decodes common HTML entities in a string (e.g. &#x27; → ', &amp; → &)
    private func decodeHTMLEntities(_ string: String) -> String {
        var result = string
        // Named entities
        let namedEntities: [(String, String)] = [
            ("&amp;", "&"),
            ("&lt;", "<"),
            ("&gt;", ">"),
            ("&quot;", "\""),
            ("&apos;", "'"),
            ("&nbsp;", " "),
            ("&ndash;", "–"),
            ("&mdash;", "—"),
        ]
        for (entity, replacement) in namedEntities {
            result = result.replacingOccurrences(of: entity, with: replacement)
        }

        // Hex entities: &#x27; &#x2F; etc.
        if let hexRegex = try? NSRegularExpression(pattern: "&#x([0-9A-Fa-f]+);") {
            let nsResult = result as NSString
            let matches = hexRegex.matches(in: result, range: NSRange(location: 0, length: nsResult.length))
            for match in matches.reversed() {
                let hexStr = nsResult.substring(with: match.range(at: 1))
                if let code = UInt32(hexStr, radix: 16), let scalar = Unicode.Scalar(code) {
                    result = (result as NSString).replacingCharacters(in: match.range, with: String(scalar))
                }
            }
        }

        // Decimal entities: &#39; &#8217; etc.
        if let decRegex = try? NSRegularExpression(pattern: "&#(\\d+);") {
            let nsResult = result as NSString
            let matches = decRegex.matches(in: result, range: NSRange(location: 0, length: nsResult.length))
            for match in matches.reversed() {
                let decStr = nsResult.substring(with: match.range(at: 1))
                if let code = UInt32(decStr), let scalar = Unicode.Scalar(code) {
                    result = (result as NSString).replacingCharacters(in: match.range, with: String(scalar))
                }
            }
        }

        return result
    }

    // MARK: - AI Analysis & Watch Creation

    private func analyzeAndCreateWatch(watchType: String) async {
        withAnimation { phase = .analyzing }

        let typeDescription: String
        switch watchType {
        case "price":
            typeDescription = "Watch for a price drop on this product. Create the watch immediately with actionType \"price\"."
        case "cart":
            typeDescription = "Watch for this product to come back in stock / become available. Create the watch immediately with actionType \"cart\"."
        case "book":
            typeDescription = "Watch for reservation availability, open booking slots, or ticket availability on this page. Create the watch immediately with actionType \"book\"."
        default:
            typeDescription = "Watch for any meaningful changes on this page. Create the watch immediately with actionType \"notify\"."
        }

        // Build enriched message with URL context
        var message = "I want to watch this page.\n\(fullContext)"
        message += "\n\n\(typeDescription)"
        message += "\n\nIMPORTANT: Respond ONLY with a [CREATE_WATCH] JSON block. Do NOT include [URL_CONTEXT], [SUGGESTIONS], [FETCH_PRICE], [PRODUCT_LINKS], or any other bracket tags."

        // Try AI analysis, but always fall back to a locally-built watch if it fails.
        // Share extensions have limited resources — the AI call can time out or fail
        // due to memory pressure, network limits, or rate limiting.
        var watchInfo: WatchInfo?

        do {
            let response = try await ShareAPIService.chatWithAI(userMessage: message)
            watchInfo = parseCreateWatch(from: response)
        } catch {
            // AI call failed — that's OK, we'll use the fallback
            #if DEBUG
            print("[ShareExtension] AI call failed, using fallback: \(error.localizedDescription)")
            #endif
        }

        // Use AI result or fall back to a locally-constructed watch
        let finalWatch = watchInfo ?? createFallbackWatch(type: watchType)
        proposalFrequency = finalWatch.checkFrequency
        withAnimation(.spring(response: 0.3)) {
            phase = .watchCreated(finalWatch)
        }
    }

    // MARK: - Custom Chat

    private func sendChatMessage() {
        let text = userInput.trimmingCharacters(in: .whitespaces)
        guard !text.isEmpty else { return }

        // Add user message
        chatMessages.append(ChatMessage(role: .user, text: text))
        userInput = ""
        isSendingChat = true

        Task {
            // Build full conversation history so the AI has context
            var messages: [[String: Any]] = []

            // System-level context as the first user message
            let systemContext = """
            I'm sharing a link and want to set up a watch.
            \(fullContext)

            IMPORTANT: Respond in plain conversational text only. Do NOT use any bracket tags like [URL_CONTEXT], [SUGGESTIONS], etc.
            When the user confirms they want to create a watch, respond with a [CREATE_WATCH] JSON block containing: emoji, name, url, condition, actionLabel, actionType, checkFrequency, imageURL.
            """

            messages.append(["role": "user", "content": systemContext])
            messages.append(["role": "assistant", "content": "I understand. I'll help you set up a watch for this page. What would you like to monitor?"])

            // Replay the full chat history
            for msg in chatMessages {
                let role = msg.role == .user ? "user" : "assistant"
                messages.append(["role": role, "content": msg.text])
            }

            do {
                let response = try await ShareAPIService.chatWithAI(messages: messages)

                // Try to parse [CREATE_WATCH]
                if let watchInfo = parseCreateWatch(from: response) {
                    isSendingChat = false
                    proposalFrequency = watchInfo.checkFrequency
                    withAnimation(.spring(response: 0.3)) {
                        phase = .watchCreated(watchInfo)
                    }
                } else {
                    // AI responded conversationally - show its message and let user continue
                    let cleanResponse = stripAllTags(from: response)
                    chatMessages.append(ChatMessage(role: .assistant, text: cleanResponse))
                    isSendingChat = false
                }
            } catch {
                chatMessages.append(ChatMessage(role: .assistant, text: "Something went wrong. Please try again."))
                isSendingChat = false
            }
        }
    }

    /// Removes ALL bracket-style tags from AI responses for clean display
    private func stripAllTags(from text: String) -> String {
        var result = text

        // Remove all [TAG]...[/TAG] blocks (CREATE_WATCH, URL_CONTEXT, SUGGESTIONS, etc.)
        if let regex = try? NSRegularExpression(
            pattern: "\\[[A-Z_]+\\].*?\\[/[A-Z_]+\\]",
            options: .dotMatchesLineSeparators
        ) {
            result = regex.stringByReplacingMatches(in: result, range: NSRange(result.startIndex..., in: result), withTemplate: "")
        }

        // Remove any orphan opening/closing tags like [CREATE_WATCH] or [/SUGGESTIONS]
        if let orphanRegex = try? NSRegularExpression(
            pattern: "\\[/?[A-Z_]+\\]",
            options: []
        ) {
            result = orphanRegex.stringByReplacingMatches(in: result, range: NSRange(result.startIndex..., in: result), withTemplate: "")
        }

        // Clean up extra whitespace/newlines left behind
        while result.contains("\n\n\n") {
            result = result.replacingOccurrences(of: "\n\n\n", with: "\n\n")
        }

        return result.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    /// Extracts [CREATE_WATCH] JSON from the AI response
    private func parseCreateWatch(from response: String) -> WatchInfo? {
        guard let regex = try? NSRegularExpression(
            pattern: "\\[CREATE_WATCH\\](.*?)\\[/CREATE_WATCH\\]",
            options: .dotMatchesLineSeparators
        ),
        let match = regex.firstMatch(in: response, range: NSRange(response.startIndex..., in: response)),
        let jsonRange = Range(match.range(at: 1), in: response) else {
            return nil
        }

        let jsonString = String(response[jsonRange])
        guard let data = jsonString.data(using: .utf8) else { return nil }

        struct WatchPayload: Codable {
            let emoji: String
            let name: String
            let url: String
            let condition: String
            let actionLabel: String
            let actionType: String
            let checkFrequency: String?
            let imageURL: String?
        }

        guard let payload = try? JSONDecoder().decode(WatchPayload.self, from: data) else {
            return nil
        }

        return WatchInfo(
            emoji: payload.emoji,
            name: payload.name,
            condition: payload.condition,
            actionType: payload.actionType,
            checkFrequency: payload.checkFrequency ?? "Daily",
            imageURL: payload.imageURL
        )
    }

    /// Creates a fallback watch when AI doesn't return proper JSON.
    /// Uses site category to provide context-appropriate defaults.
    private func createFallbackWatch(type: String) -> WatchInfo {
        let name = pageTitle ?? displayHost
        let category = URLRewriter.categorize(sharedURL, rewriteResult: rewriteResult)
        let emoji: String
        let condition: String
        let actionType: String

        switch (type, category) {
        // Restaurant-specific fallbacks
        case ("book", .restaurant):
            emoji = "🍽️"
            condition = "Reservation becomes available"
            actionType = "book"
        case ("price", .restaurant):
            emoji = "💰"
            condition = "Menu or pricing changes"
            actionType = "price"
        case ("notify", .restaurant):
            emoji = "🔔"
            condition = "Any changes on this restaurant page"
            actionType = "notify"

        // Ticketing-specific fallbacks
        case ("book", .ticketing):
            emoji = "🎫"
            condition = "Tickets become available"
            actionType = "book"
        case ("price", .ticketing):
            emoji = "💰"
            condition = "Ticket price drops"
            actionType = "price"
        case ("notify", .ticketing):
            emoji = "🔔"
            condition = "Any changes on this event page"
            actionType = "notify"

        // General / ecommerce fallbacks
        case ("price", _):
            emoji = "💰"
            condition = "Price drops on this product"
            actionType = "price"
        case ("cart", _):
            emoji = "🛒"
            condition = "Product becomes available / back in stock"
            actionType = "cart"
        case ("book", _):
            emoji = "📅"
            condition = "Reservation or ticket becomes available"
            actionType = "book"
        default:
            emoji = "👀"
            condition = "Any meaningful changes on this page"
            actionType = "notify"
        }

        return WatchInfo(
            emoji: emoji,
            name: name,
            condition: condition,
            actionType: actionType,
            checkFrequency: "Daily",
            imageURL: nil
        )
    }

    // MARK: - Save Watch to Supabase

    private func saveWatch(_ info: WatchInfo) async {
        withAnimation { phase = .saving(info) }

        guard let userId = ShareAPIService.userId else {
            withAnimation { phase = .error("Not signed in. Open Steward to sign in first.") }
            return
        }

        let watchId = UUID().uuidString

        // Format current time as HH:mm for preferred check time
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm"
        let preferredTime = formatter.string(from: Date())

        // ISO 8601 date
        let isoFormatter = ISO8601DateFormatter()
        isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let now = isoFormatter.string(from: Date())

        // Ensure URL has protocol
        var watchURL = sharedURL
        if !watchURL.lowercased().hasPrefix("http") {
            watchURL = "https://\(watchURL)"
        }

        // Serialize captured cookies if present
        var cookiesJSON: String?
        if let cookies = capturedCookies {
            if let data = try? JSONEncoder().encode(cookies) {
                cookiesJSON = String(data: data, encoding: .utf8)
            }
        }

        let dto = ShareWatchDTO(
            id: watchId,
            user_id: userId,
            emoji: info.emoji,
            name: info.name,
            url: watchURL,
            condition: info.condition,
            action_label: actionLabelFor(info.actionType),
            action_type: info.actionType,
            status: "watching",
            check_frequency: info.checkFrequency,
            preferred_check_time: preferredTime,
            notify_channels: "push",
            triggered: false,
            image_url: info.imageURL,
            created_at: now,
            site_cookies: cookiesJSON,
            cookie_domain: cookieDomain,
            cookie_status: cookiesJSON != nil ? "active" : nil,
            watch_mode: "url",
            search_query: nil
        )

        do {
            try await ShareAPIService.createWatch(dto)

            withAnimation(.spring(response: 0.3)) {
                phase = .success(info)
            }

            // Trigger first check in background (fire-and-forget)
            Task { try? await ShareAPIService.triggerCheck(watchId: watchId) }

            // Auto-dismiss after showing success
            try? await Task.sleep(for: .seconds(1.5))
            onComplete(sharedURL)
        } catch {
            withAnimation { phase = .error(error.localizedDescription) }
        }
    }

    private func actionLabelFor(_ actionType: String) -> String {
        switch actionType {
        case "price": return "Notify when price drops"
        case "cart": return "Notify when back in stock"
        case "book": return "Notify when available"
        default: return "Notify when changed"
        }
    }
}
