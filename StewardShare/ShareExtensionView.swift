import SwiftUI
import UniformTypeIdentifiers

/// Share Extension view — lets users create a watch directly from the share sheet.
///
/// Flow:
/// 1. Extract URL from shared content
/// 2. User picks watch type (Price Drop, Restock, Any Changes)
/// 3. AI analyzes the URL and creates the watch
/// 4. Watch saved to Supabase → success → dismiss
struct ShareExtensionView: View {
    let attachments: [NSItemProvider]
    let onComplete: (String) -> Void
    let onCancel: () -> Void

    // MARK: - State

    @State private var sharedURL: String = ""
    @State private var pageTitle: String?
    @State private var phase: Phase = .extracting

    enum Phase: Equatable {
        case extracting
        case ready
        case analyzing
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

    // Steward colors
    private let accentGreen = Color(red: 0.165, green: 0.361, blue: 0.271)
    private let cardBg = Color(red: 0.12, green: 0.13, blue: 0.12)
    private let darkBg = Color(red: 0.07, green: 0.08, blue: 0.07)

    // MARK: - Body

    var body: some View {
        ZStack {
            darkBg.ignoresSafeArea()

            VStack(spacing: 0) {
                // ── Header ──
                header

                Divider().overlay(Color.white.opacity(0.1))

                // ── Content ──
                switch phase {
                case .extracting:
                    loadingContent(message: "Reading shared content...")

                case .ready:
                    readyContent

                case .analyzing:
                    loadingContent(message: "Analyzing page...")

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
        HStack {
            Button("Cancel") { onCancel() }
                .font(.system(size: 15))
                .foregroundStyle(.gray)
            Spacer()
            Text("Steward")
                .font(.system(size: 17, weight: .semibold, design: .serif))
                .foregroundStyle(.white)
            Spacer()
            Color.clear.frame(width: 60)
        }
        .padding(.horizontal, 20)
        .padding(.top, 16)
        .padding(.bottom, 12)
    }

    // MARK: - URL Card

    private var urlCard: some View {
        HStack(spacing: 10) {
            Image(systemName: "link")
                .font(.system(size: 13))
                .foregroundStyle(.white)
                .frame(width: 28, height: 28)
                .background(accentGreen)
                .clipShape(RoundedRectangle(cornerRadius: 7))

            VStack(alignment: .leading, spacing: 2) {
                Text(pageTitle ?? displayHost)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(.white)
                    .lineLimit(1)
                Text(displayHost)
                    .font(.system(size: 12))
                    .foregroundStyle(.gray)
                    .lineLimit(1)
            }
            Spacer()
        }
        .padding(12)
        .background(cardBg)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal, 20)
    }

    // MARK: - Ready Content (pick watch type)

    private var readyContent: some View {
        VStack(spacing: 16) {
            urlCard
                .padding(.top, 16)

            Text("What should I watch for?")
                .font(.system(size: 15, weight: .medium))
                .foregroundStyle(.white.opacity(0.7))
                .padding(.top, 4)

            VStack(spacing: 10) {
                watchTypeButton(icon: "tag.fill", label: "Price Drop", type: "price")
                watchTypeButton(icon: "cart.fill", label: "Back in Stock", type: "cart")
                watchTypeButton(icon: "bell.fill", label: "Any Changes", type: "notify")
            }
            .padding(.horizontal, 20)

            Spacer()
        }
    }

    private func watchTypeButton(icon: String, label: String, type: String) -> some View {
        Button {
            Task { await analyzeAndCreateWatch(watchType: type) }
        } label: {
            HStack(spacing: 10) {
                Image(systemName: icon)
                    .font(.system(size: 14))
                    .foregroundStyle(accentGreen)
                    .frame(width: 24)
                Text(label)
                    .font(.system(size: 15, weight: .medium))
                    .foregroundStyle(.white)
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(.gray)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
            .background(cardBg)
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }

    // MARK: - Watch Proposal Content

    private func watchProposalContent(_ info: WatchInfo) -> some View {
        VStack(spacing: 16) {
            urlCard
                .padding(.top, 16)

            // Watch preview card
            VStack(spacing: 8) {
                Text(info.emoji)
                    .font(.system(size: 36))
                Text(info.name)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(.white)
                    .multilineTextAlignment(.center)
                    .lineLimit(2)
                Text(info.condition)
                    .font(.system(size: 13))
                    .foregroundStyle(.gray)
                    .multilineTextAlignment(.center)
                    .lineLimit(2)

                HStack(spacing: 4) {
                    Image(systemName: "clock")
                        .font(.system(size: 11))
                    Text("Checks \(info.checkFrequency.lowercased())")
                        .font(.system(size: 12))
                }
                .foregroundStyle(.gray)
                .padding(.top, 2)
            }
            .padding(20)
            .frame(maxWidth: .infinity)
            .background(cardBg)
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .padding(.horizontal, 20)

            Spacer()

            // Start Watching button
            Button {
                Task { await saveWatch(info) }
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
            .padding(.bottom, 20)
        }
    }

    // MARK: - Loading / Saving / Success / Error States

    private func loadingContent(message: String) -> some View {
        VStack(spacing: 16) {
            Spacer()
            ProgressView()
                .tint(accentGreen)
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
                .tint(accentGreen)
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
                    .foregroundStyle(accentGreen)
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
            .foregroundStyle(accentGreen)

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

    // MARK: - URL Extraction

    private func extractURL() async {
        for provider in attachments {
            // Try URL type first (Safari, Chrome, etc.)
            if provider.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
                do {
                    if let url = try await provider.loadItem(
                        forTypeIdentifier: UTType.url.identifier
                    ) as? URL {
                        sharedURL = url.absoluteString
                        await fetchPageTitle()
                        checkAuthAndProceed()
                        return
                    }
                } catch { /* fall through */ }
            }

            // Fallback: plain text that contains a URL (Amazon, Resy, Instagram, etc.)
            if provider.hasItemConformingToTypeIdentifier(UTType.plainText.identifier) {
                do {
                    if let text = try await provider.loadItem(
                        forTypeIdentifier: UTType.plainText.identifier
                    ) as? String {
                        if let url = extractURLFromText(text) {
                            sharedURL = url
                            await fetchPageTitle()
                            checkAuthAndProceed()
                            return
                        }
                    }
                } catch { /* fall through */ }
            }
        }

        // No valid URL found — dismiss
        onCancel()
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
                let title = String(html[range]).trimmingCharacters(in: .whitespacesAndNewlines)
                if !title.isEmpty {
                    pageTitle = title
                    return
                }
            }
        }
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
        default:
            typeDescription = "Watch for any meaningful changes on this page. Create the watch immediately with actionType \"notify\"."
        }

        // Build enriched message with URL context
        var message = "I want to watch this: \(sharedURL)"
        if let title = pageTitle {
            message += "\n\n[URL_CONTEXT: Page title: \"\(title)\" | Website: \(displayHost)]"
        }
        message += "\n\n\(typeDescription) Respond with a [CREATE_WATCH] JSON block."

        do {
            let response = try await ShareAPIService.chatWithAI(userMessage: message)

            // Parse [CREATE_WATCH] JSON from response
            if let watchInfo = parseCreateWatch(from: response) {
                withAnimation(.spring(response: 0.3)) {
                    phase = .watchCreated(watchInfo)
                }
            } else {
                // AI didn't return a create block — create a fallback watch
                let fallback = createFallbackWatch(type: watchType)
                withAnimation(.spring(response: 0.3)) {
                    phase = .watchCreated(fallback)
                }
            }
        } catch {
            withAnimation { phase = .error(error.localizedDescription) }
        }
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

    /// Creates a fallback watch when AI doesn't return proper JSON
    private func createFallbackWatch(type: String) -> WatchInfo {
        let name = pageTitle ?? displayHost
        let emoji: String
        let condition: String
        let actionType: String

        switch type {
        case "price":
            emoji = "💰"
            condition = "Price drops on this product"
            actionType = "price"
        case "cart":
            emoji = "🛒"
            condition = "Product becomes available / back in stock"
            actionType = "cart"
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
            created_at: now
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
