import Foundation
import SwiftUI
import Observation

@Observable
@MainActor
final class ChatViewModel {
    var messages: [ChatMessage] = [ChatMessage.initial]
    var inputText = ""
    var isTyping = false
    var pendingWatch: Watch?
    var pendingWishlistWatches: [Watch] = []
    var pendingImage: UIImage? // Staged image before sending
    var shouldDismiss = false // Signal to close the chat drawer
    var subscriptionTier: SubscriptionTier = .free // Set by caller to enable frequency prompts

    /// Full conversation history for the AI (role + content pairs)
    private var conversationHistory: [AIService.Message] = []

    // MARK: - Public API

    func send(_ text: String? = nil) {
        let messageText = text ?? inputText
        let image = pendingImage

        // Allow sending if there's text OR an image
        guard !messageText.trimmingCharacters(in: .whitespaces).isEmpty || image != nil else { return }

        let displayText = messageText.trimmingCharacters(in: .whitespaces).isEmpty
            ? "📸 [Screenshot]"
            : messageText

        let userMsg = ChatMessage(role: .user, text: displayText, image: image)
        withAnimation(.spring(response: 0.3)) {
            messages.append(userMsg)
        }
        inputText = ""
        pendingImage = nil
        isTyping = true

        // Compress image to JPEG for API
        var imageData: Data?
        if let image = image {
            imageData = compressImage(image)
        }

        // Build the text for conversation history
        var historyText = messageText.trimmingCharacters(in: .whitespaces).isEmpty
            ? "I'm sending you a screenshot. What product/item is this? Help me set up a watch for it."
            : messageText

        Task {
            // Enrich URLs: resolve shortened links and fetch page titles before sending to AI
            if imageData == nil {
                let enriched = await enrichURLsInText(historyText)
                if enriched != historyText {
                    historyText = enriched
                }
            }

            // Inject subscription tier context on first message so AI knows which frequencies to offer
            if conversationHistory.isEmpty && subscriptionTier != .free {
                historyText = "[USER_TIER]\(subscriptionTier.rawValue)[/USER_TIER]\n" + historyText
            }

            // Add to conversation history (with enriched URL context)
            conversationHistory.append(AIService.Message(role: "user", content: historyText, imageData: imageData))

            do {
                let response = try await AIService.shared.chat(messages: conversationHistory)

                // Parse AI response for display text, watch JSON, suggestions, and proposal flag
                let parsed = parseResponse(response)

                // Add full response (with markers) to history so AI has context
                conversationHistory.append(AIService.Message(role: "assistant", content: response))

                withAnimation(.spring(response: 0.3)) {
                    isTyping = false
                    messages.append(ChatMessage(
                        role: .steward,
                        text: parsed.displayText,
                        suggestions: parsed.suggestions,
                        productLinks: parsed.productLinks
                    ))
                }

                // Create watch if AI included the marker
                if let json = parsed.watchJSON {
                    createWatchFromJSON(json)
                }

                // Signal dismiss if AI wants to end the conversation
                if parsed.shouldDismiss {
                    // Delay so user can read the goodbye message
                    Task { @MainActor in
                        try? await Task.sleep(for: .seconds(2.0))
                        shouldDismiss = true
                    }
                }

            } catch {
                let errorDetail = error.localizedDescription
                withAnimation(.spring(response: 0.3)) {
                    isTyping = false
                    messages.append(ChatMessage(
                        role: .steward,
                        text: "Sorry, I had trouble connecting. Error: \(errorDetail)"
                    ))
                }
                #if DEBUG
                print("[ChatViewModel] AI error: \(error)")
                #endif
            }
        }
    }

    func clearPendingImage() {
        pendingImage = nil
    }

    func reset() {
        messages = [ChatMessage.initial]
        inputText = ""
        isTyping = false
        pendingWatch = nil
        pendingWishlistWatches = []
        pendingImage = nil
        conversationHistory = []
    }

    // MARK: - Image Compression

    /// Compresses and resizes image for API (max ~1MB, max 1568px on longest side)
    private func compressImage(_ image: UIImage) -> Data? {
        let maxDimension: CGFloat = 1024
        let size = image.size

        var newSize = size
        if size.width > maxDimension || size.height > maxDimension {
            let ratio = min(maxDimension / size.width, maxDimension / size.height)
            newSize = CGSize(width: size.width * ratio, height: size.height * ratio)
        }

        let renderer = UIGraphicsImageRenderer(size: newSize)
        let resized = renderer.image { _ in
            image.draw(in: CGRect(origin: .zero, size: newSize))
        }

        return resized.jpegData(compressionQuality: 0.7)
    }

    // MARK: - Parse AI Response

    struct ParsedResponse {
        let displayText: String
        let watchJSON: String?
        let suggestions: [String]?
        let productLinks: [ProductLink]?
        let isProposal: Bool
        let shouldDismiss: Bool
    }

    /// Extracts display text, optional watch JSON, suggestions, product links, and proposal flag from AI response
    private func parseResponse(_ response: String) -> ParsedResponse {
        var text = response

        // 1. Extract [CREATE_WATCH] JSON if present
        var watchJSON: String?
        if let regex = try? NSRegularExpression(pattern: "\\[CREATE_WATCH\\](.*?)\\[/CREATE_WATCH\\]", options: .dotMatchesLineSeparators),
           let match = regex.firstMatch(in: text, range: NSRange(text.startIndex..., in: text)),
           let jsonRange = Range(match.range(at: 1), in: text) {
            watchJSON = String(text[jsonRange])
            text = text.replacingOccurrences(of: "\\[CREATE_WATCH\\].*?\\[/CREATE_WATCH\\]", with: "", options: .regularExpression)
        }

        // 2. Check for [PROPOSE_WATCH] marker — handle both block and standalone forms
        let isProposal = text.contains("[PROPOSE_WATCH]")
        // Strip block form: [PROPOSE_WATCH]...content...[/PROPOSE_WATCH]
        if let proposeRegex = try? NSRegularExpression(pattern: "\\[PROPOSE_WATCH\\].*?\\[/PROPOSE_WATCH\\]", options: .dotMatchesLineSeparators) {
            text = proposeRegex.stringByReplacingMatches(in: text, range: NSRange(text.startIndex..., in: text), withTemplate: "")
        }
        // Strip standalone markers (in case AI uses them without closing tag)
        text = text.replacingOccurrences(of: "[PROPOSE_WATCH]", with: "")
        text = text.replacingOccurrences(of: "[/PROPOSE_WATCH]", with: "")

        // 3. Extract [PRODUCT_LINKS] if present
        var productLinks: [ProductLink]?
        if let regex = try? NSRegularExpression(pattern: "\\[PRODUCT_LINKS\\](.*?)\\[/PRODUCT_LINKS\\]", options: .dotMatchesLineSeparators),
           let match = regex.firstMatch(in: text, range: NSRange(text.startIndex..., in: text)),
           let linkRange = Range(match.range(at: 1), in: text) {
            let raw = String(text[linkRange])
            productLinks = parseProductLinks(raw)
            text = text.replacingOccurrences(of: "\\[PRODUCT_LINKS\\].*?\\[/PRODUCT_LINKS\\]", with: "", options: .regularExpression)
        }
        // Strip any remaining standalone PRODUCT_LINKS markers (empty tags, partial tags, etc.)
        text = text.replacingOccurrences(of: "[PRODUCT_LINKS]", with: "")
        text = text.replacingOccurrences(of: "[/PRODUCT_LINKS]", with: "")

        // 4. Extract [SUGGESTIONS] if present
        var suggestions: [String]?
        if let regex = try? NSRegularExpression(pattern: "\\[SUGGESTIONS\\](.*?)\\[/SUGGESTIONS\\]", options: .dotMatchesLineSeparators),
           let match = regex.firstMatch(in: text, range: NSRange(text.startIndex..., in: text)),
           let sugRange = Range(match.range(at: 1), in: text) {
            let raw = String(text[sugRange])
            suggestions = raw.components(separatedBy: "|").map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }
            text = text.replacingOccurrences(of: "\\[SUGGESTIONS\\].*?\\[/SUGGESTIONS\\]", with: "", options: .regularExpression)
        }

        // 5. Strip any raw watch JSON objects that leaked into display text
        //    (e.g., {"emoji":"...","name":"...","url":"...","condition":"...",...})
        if let jsonRegex = try? NSRegularExpression(pattern: "\\{\"emoji\".*?\\}", options: .dotMatchesLineSeparators) {
            text = jsonRegex.stringByReplacingMatches(in: text, range: NSRange(text.startIndex..., in: text), withTemplate: "")
        }

        // 5b. Strip leaked product-link JSON objects from display text
        //     (AI sometimes outputs {"title":"...","url":"...","source":"..."} without wrapping in [PRODUCT_LINKS])
        if let linkJsonRegex = try? NSRegularExpression(
            pattern: "\\{\\s*\"title\"\\s*:.*?\"source\"\\s*:.*?\\}",
            options: .dotMatchesLineSeparators
        ) {
            let linkMatches = linkJsonRegex.matches(in: text, range: NSRange(text.startIndex..., in: text))
            if !linkMatches.isEmpty {
                // If we didn't already find product links from the tagged block, try parsing these
                if productLinks == nil || productLinks!.isEmpty {
                    var rawLines: [String] = []
                    for match in linkMatches {
                        if let range = Range(match.range, in: text) {
                            rawLines.append(String(text[range]))
                        }
                    }
                    let parsed = parseProductLinks(rawLines.joined(separator: "\n"))
                    if let parsed = parsed, !parsed.isEmpty {
                        productLinks = parsed
                    }
                }
                // Strip the raw JSON from display text regardless
                text = linkJsonRegex.stringByReplacingMatches(in: text, range: NSRange(text.startIndex..., in: text), withTemplate: "")
            }
        }

        // 6. If product links are present, strip bare URLs from the display text
        //    (safety net in case the AI still writes URLs in its conversational text)
        if productLinks != nil, !productLinks!.isEmpty {
            // Remove standalone URLs (http/https) that appear on their own or in sentences
            text = text.replacingOccurrences(
                of: "https?://[^\\s\\)\\]>]+",
                with: "",
                options: .regularExpression
            )
            // Clean up leftover artifacts: bullets/dashes with just whitespace, empty parentheses, double spaces
            text = text.replacingOccurrences(of: "()", with: "")
            text = text.replacingOccurrences(of: "[ ]+", with: " ", options: .regularExpression)
            // Remove lines that are now just whitespace, bullets, or dashes
            let cleanedLines = text.components(separatedBy: "\n").filter { line in
                let trimmed = line.trimmingCharacters(in: .whitespaces)
                return !trimmed.isEmpty && trimmed != "-" && trimmed != "•" && trimmed != "*"
            }
            text = cleanedLines.joined(separator: "\n")
        }

        // 7. Check for [DISMISS] marker (AI wants to end the conversation)
        let shouldDismiss = text.contains("[DISMISS]")
        text = text.replacingOccurrences(of: "[DISMISS]", with: "")

        // 8. If it's a proposal, override suggestions with confirm/deny buttons
        if isProposal {
            suggestions = ["Yes, set it up! ✅", "No, let me change something"]
        }

        return ParsedResponse(
            displayText: text.trimmingCharacters(in: .whitespacesAndNewlines),
            watchJSON: watchJSON,
            suggestions: suggestions,
            productLinks: productLinks,
            isProposal: isProposal,
            shouldDismiss: shouldDismiss
        )
    }

    /// Parse product links from the [PRODUCT_LINKS] block (one JSON object per line)
    private func parseProductLinks(_ raw: String) -> [ProductLink]? {
        struct LinkPayload: Codable {
            let title: String
            let url: String
            let source: String
            let price: String?
            let imageURL: String?
        }

        var links: [ProductLink] = []
        let lines = raw.components(separatedBy: "\n").map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }

        for line in lines {
            guard let data = line.data(using: .utf8) else { continue }
            do {
                let payload = try JSONDecoder().decode(LinkPayload.self, from: data)
                links.append(ProductLink(
                    title: payload.title,
                    url: payload.url,
                    source: payload.source,
                    price: payload.price,
                    imageURL: payload.imageURL
                ))
            } catch {
                #if DEBUG
                print("[ChatViewModel] Failed to parse product link: \(line)")
                #endif
            }
        }

        return links.isEmpty ? nil : links
    }

    // MARK: - URL Enrichment

    /// Finds URLs in text, resolves shortened ones, fetches page titles, and appends context for the AI
    private func enrichURLsInText(_ text: String) async -> String {
        // Find all URLs in the text
        guard let detector = try? NSDataDetector(types: NSTextCheckingResult.CheckingType.link.rawValue) else {
            return text
        }
        let matches = detector.matches(in: text, range: NSRange(text.startIndex..., in: text))
        guard !matches.isEmpty else { return text }

        var enrichments: [String] = []

        for match in matches {
            guard let range = Range(match.range, in: text),
                  let url = URL(string: String(text[range])) else { continue }

            // Resolve the URL and fetch page metadata
            if let metadata = await resolveAndFetchMetadata(url: url) {
                enrichments.append(metadata)
            }
        }

        if enrichments.isEmpty { return text }

        // Append URL context as a system note the AI can use
        let context = enrichments.joined(separator: "\n")
        return text + "\n\n[URL_CONTEXT: I resolved the URLs for you. Here's what I found:\n\(context)\nUse this info to understand what the user is referring to. Use the ORIGINAL URL the user provided for the watch, not the resolved one.]"
    }

    /// Resolves a URL (follows redirects) and fetches the page title + price info
    private func resolveAndFetchMetadata(url: URL) async -> String? {
        // Use a custom session that follows redirects so we can capture the final URL
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 10
        let session = URLSession(configuration: config)

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        // Mimic a real browser to avoid blocks
        request.setValue("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1", forHTTPHeaderField: "User-Agent")

        do {
            let (data, response) = try await session.data(for: request)

            let finalURL = response.url ?? url
            let html = String(data: data, encoding: .utf8) ?? ""

            // Extract page title
            let title = extractTitle(from: html)
            // Extract price if visible
            let price = extractPrice(from: html)

            var result = "URL: \(url.absoluteString)"
            if finalURL.absoluteString != url.absoluteString {
                result += " → resolves to: \(finalURL.absoluteString)"
            }
            if let title = title {
                result += " | Page title: \"\(title)\""
            }
            if let price = price {
                result += " | Price found: \(price)"
            }

            // Try to identify the website
            if let host = finalURL.host {
                result += " | Website: \(host)"
            }

            return result
        } catch {
            #if DEBUG
            print("[ChatViewModel] Failed to resolve URL: \(url) — \(error.localizedDescription)")
            #endif
            return nil
        }
    }

    /// Extracts the <title> or og:title from HTML
    private func extractTitle(from html: String) -> String? {
        // Try og:title first (more descriptive for product pages)
        let ogPatterns = [
            "property=\"og:title\"\\s+content=\"([^\"]+)\"",
            "content=\"([^\"]+)\"\\s+property=\"og:title\"",
            "property='og:title'\\s+content='([^']+)'",
            "content='([^']+)'\\s+property='og:title'"
        ]
        for pattern in ogPatterns {
            if let regex = try? NSRegularExpression(pattern: pattern, options: .caseInsensitive),
               let match = regex.firstMatch(in: html, range: NSRange(html.startIndex..., in: html)),
               let range = Range(match.range(at: 1), in: html) {
                let title = String(html[range]).trimmingCharacters(in: .whitespacesAndNewlines)
                if !title.isEmpty { return title }
            }
        }

        // Fallback to <title> tag
        if let regex = try? NSRegularExpression(pattern: "<title[^>]*>([^<]+)</title>", options: .caseInsensitive),
           let match = regex.firstMatch(in: html, range: NSRange(html.startIndex..., in: html)),
           let range = Range(match.range(at: 1), in: html) {
            let title = String(html[range])
                .trimmingCharacters(in: .whitespacesAndNewlines)
                .replacingOccurrences(of: "\\s+", with: " ", options: .regularExpression)
            if !title.isEmpty { return title }
        }

        return nil
    }

    /// Tries to extract a price from the HTML (common meta tags and patterns)
    private func extractPrice(from html: String) -> String? {
        // Try og:price:amount or product:price:amount
        let pricePatterns = [
            "property=\"(?:og|product):price:amount\"\\s+content=\"([^\"]+)\"",
            "content=\"([^\"]+)\"\\s+property=\"(?:og|product):price:amount\"",
            "\"price\"\\s*:\\s*\"?([\\d,.]+)\"?"
        ]
        for pattern in pricePatterns {
            if let regex = try? NSRegularExpression(pattern: pattern, options: .caseInsensitive),
               let match = regex.firstMatch(in: html, range: NSRange(html.startIndex..., in: html)),
               let range = Range(match.range(at: 1), in: html) {
                let price = String(html[range]).trimmingCharacters(in: .whitespacesAndNewlines)
                if !price.isEmpty { return "$\(price)" }
            }
        }
        return nil
    }

    // MARK: - Create Watch from AI JSON

    private func createWatchFromJSON(_ json: String) {
        guard let data = json.data(using: .utf8) else { return }

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

        do {
            let payload = try JSONDecoder().decode(WatchPayload.self, from: data)
            let actionType = ActionType(rawValue: payload.actionType) ?? .notify

            // Ensure URL has a protocol
            var url = payload.url
            if !url.lowercased().hasPrefix("http") {
                url = "https://\(url)"
            }

            // Use AI-specified frequency, fall back to user's default, then "Daily"
            let frequency = payload.checkFrequency
                ?? UserDefaults.standard.string(forKey: "defaultCheckFrequency")
                ?? "Daily"

            let watch = Watch(
                emoji: payload.emoji,
                name: payload.name,
                url: url,
                condition: payload.condition,
                actionLabel: payload.actionLabel,
                actionType: actionType,
                checkFrequency: frequency,
                imageURL: payload.imageURL
            )
            pendingWatch = watch

            // If no image was provided by the AI, try to fetch og:image from the URL
            if payload.imageURL == nil || payload.imageURL?.isEmpty == true {
                Task { @MainActor in
                    if let ogImage = await self.fetchOGImage(from: url) {
                        watch.imageURL = ogImage
                    }
                }
            }
        } catch {
            #if DEBUG
            print("[ChatViewModel] Failed to parse watch JSON: \(error)")
            #endif
        }
    }

    // MARK: - Fetch Product Image

    /// Fetches the og:image from a URL to use as the watch hero photo
    private func fetchOGImage(from urlString: String) async -> String? {
        guard let url = URL(string: urlString) else { return nil }

        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 8
        let session = URLSession(configuration: config)

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1", forHTTPHeaderField: "User-Agent")

        do {
            let (data, _) = try await session.data(for: request)
            let html = String(data: data, encoding: .utf8) ?? ""

            // Try og:image patterns
            let patterns = [
                "property=\"og:image\"\\s+content=\"([^\"]+)\"",
                "content=\"([^\"]+)\"\\s+property=\"og:image\"",
                "property='og:image'\\s+content='([^']+)'",
                "content='([^']+)'\\s+property='og:image'"
            ]

            for pattern in patterns {
                if let regex = try? NSRegularExpression(pattern: pattern, options: .caseInsensitive),
                   let match = regex.firstMatch(in: html, range: NSRange(html.startIndex..., in: html)),
                   let range = Range(match.range(at: 1), in: html) {
                    let imageURL = String(html[range]).trimmingCharacters(in: .whitespacesAndNewlines)
                    if !imageURL.isEmpty, imageURL.hasPrefix("http") {
                        return imageURL
                    }
                }
            }
            return nil
        } catch {
            #if DEBUG
            print("[ChatViewModel] Failed to fetch og:image: \(error.localizedDescription)")
            #endif
            return nil
        }
    }
}
