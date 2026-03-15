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
    var pendingWatchInitialPrice: Double?
    var pendingWishlistWatches: [Watch] = []
    var pendingImage: UIImage? // Staged image before sending
    var shouldDismiss = false // Signal to close the chat drawer
    var subscriptionTier: SubscriptionTier = .free // Set by caller to enable frequency prompts

    /// Incremented whenever a new watch is ready — used to reliably trigger .onChange in ChatDrawer
    var watchReadySignal = 0

    /// Incremented whenever a price update is ready
    var priceUpdateSignal = 0
    var pendingPriceUpdateData: (watchId: UUID, price: Double)?

    /// Price detected during URL enrichment (stored for use in watch creation)
    private var lastDetectedPrice: Double?

    /// Watch ID awaiting a price update from the user (after "Change starting price" suggestion)
    var pendingPriceUpdateWatchId: UUID?

    /// Direct callback for updating an existing watch (set by ChatDrawer)
    var onWatchUpdate: ((String, String) -> Void)?  // (watchName, newURL)

    /// Tracks the watch name when in a fix-watch conversation (for fallback URL extraction)
    private var fixWatchName: String?

    /// Proposed fix awaiting user confirmation (watchName, url)
    private var pendingFix: (watchName: String, url: String)?

    /// Full conversation history for the AI (role + content pairs)
    private var conversationHistory: [AIService.Message] = []

    /// Active send task — stored so we can cancel it on reset()
    private var sendTask: Task<Void, Never>?

    /// Maximum number of conversation history entries to keep (sliding window)
    private static let maxHistoryCount = 30

    /// Shared URLSession for metadata/OG image fetching (reuses connections)
    private static let metadataSession: URLSession = {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 10
        return URLSession(configuration: config)
    }()

    // MARK: - Pre-compiled Regexes (avoid recompilation on every parseResponse call)

    private static let createWatchRegex = try! NSRegularExpression(pattern: "\\[CREATE_WATCH\\](.*?)\\[/CREATE_WATCH\\]", options: .dotMatchesLineSeparators)
    private static let proposeWatchRegex = try! NSRegularExpression(pattern: "\\[PROPOSE_WATCH\\].*?\\[/PROPOSE_WATCH\\]", options: .dotMatchesLineSeparators)
    private static let productLinksRegex = try! NSRegularExpression(pattern: "\\[PRODUCT_LINKS\\](.*?)\\[/PRODUCT_LINKS\\]", options: .dotMatchesLineSeparators)
    private static let suggestionsRegex = try! NSRegularExpression(pattern: "\\[SUGGESTIONS\\](.*?)\\[/SUGGESTIONS\\]", options: .dotMatchesLineSeparators)
    private static let leakedWatchJsonRegex = try! NSRegularExpression(pattern: "\\{\"emoji\".*?\\}", options: .dotMatchesLineSeparators)
    private static let leakedLinkJsonRegex = try! NSRegularExpression(pattern: "\\{\\s*\"title\"\\s*:.*?\"source\"\\s*:.*?\\}", options: .dotMatchesLineSeparators)
    private static let functionCallsRegex = try! NSRegularExpression(pattern: "<(?:antml:)?function_calls>[\\s\\S]*?</(?:antml:)?function_calls>", options: [])
    private static let invokeTagRegex = try! NSRegularExpression(pattern: "<(?:antml:)?invoke[^>]*>[\\s\\S]*?</(?:antml:)?invoke>", options: [])
    private static let xmlTagRegex = try! NSRegularExpression(pattern: "</?(?:antml:)?(?:function_calls|invoke|parameter)[^>]*>", options: [])

    // MARK: - Public API

    func send(_ text: String? = nil) {
        let messageText = text ?? inputText
        let image = pendingImage

        // Allow sending if there's text OR an image
        guard !messageText.trimmingCharacters(in: .whitespaces).isEmpty || image != nil else { return }

        // Handle price confirmation suggestions locally
        if pendingPriceUpdateWatchId != nil {
            let trimmed = messageText.trimmingCharacters(in: .whitespaces)

            if trimmed == "Looks good ✓" || trimmed == "Skip for now" {
                // User confirmed or skipped — dismiss and clear
                let userMsg = ChatMessage(role: .user, text: trimmed)
                withAnimation(.spring(response: 0.3)) {
                    messages.append(userMsg)
                }
                inputText = ""
                pendingPriceUpdateWatchId = nil
                return
            }

            if trimmed == "Change starting price" {
                // User wants to change — prompt for new price
                let userMsg = ChatMessage(role: .user, text: trimmed)
                withAnimation(.spring(response: 0.3)) {
                    messages.append(userMsg)
                }
                inputText = ""

                let promptMsg = ChatMessage(
                    role: .steward,
                    text: "What's the correct starting price? Just type the amount (e.g. 49.99)."
                )
                withAnimation(.spring(response: 0.3)) {
                    messages.append(promptMsg)
                }
                return
            }

            // Check if user typed a price number
            let cleaned = trimmed.replacingOccurrences(of: "$", with: "")
                .replacingOccurrences(of: ",", with: "")
            if let newPrice = Double(cleaned), newPrice > 0 {
                let watchId = pendingPriceUpdateWatchId!
                let userMsg = ChatMessage(role: .user, text: trimmed)
                withAnimation(.spring(response: 0.3)) {
                    messages.append(userMsg)
                }
                inputText = ""
                pendingPriceUpdateWatchId = nil

                // Signal price update for ChatDrawer to pick up
                pendingPriceUpdateData = (watchId: watchId, price: newPrice)
                priceUpdateSignal += 1

                let priceStr = String(format: "$%.2f", newPrice)
                let confirmMsg = ChatMessage(
                    role: .steward,
                    text: "Updated! Starting price set to \(priceStr). I'll track changes from here."
                )
                withAnimation(.spring(response: 0.3)) {
                    messages.append(confirmMsg)
                }
                return
            }
        }

        // Handle fix-watch confirmation suggestions locally
        if pendingFix != nil {
            let trimmed = messageText.trimmingCharacters(in: .whitespaces)

            if trimmed == "Yes, update it ✅" {
                let userMsg = ChatMessage(role: .user, text: trimmed)
                withAnimation(.spring(response: 0.3)) {
                    messages.append(userMsg)
                }
                inputText = ""

                let fix = pendingFix!
                onWatchUpdate?(fix.watchName, fix.url)
                pendingFix = nil
                fixWatchName = nil

                withAnimation(.spring(response: 0.3)) {
                    messages.append(ChatMessage(
                        role: .steward,
                        text: "✅ Watch URL has been updated and the warning has been cleared! Go back to check it out.",
                        suggestions: ["That's all for now"]
                    ))
                }
                return
            }

            // "No, find a different one" or other response — clear pending fix
            // and let the message flow through to the AI for alternatives
            pendingFix = nil
        }

        // For fix-watch prompts, show a friendly message instead of the raw technical prompt
        let isFixWatchPrompt = messageText.contains("[FIX_WATCH]")
        let displayText: String
        if messageText.trimmingCharacters(in: .whitespaces).isEmpty {
            displayText = "📸 [Screenshot]"
        } else if isFixWatchPrompt {
            // Extract the watch name for a friendly display
            let nameMatch = messageText.range(of: "\"", range: messageText.startIndex..<messageText.endIndex)
                .flatMap { start in
                    messageText.range(of: "\"", range: messageText.index(after: start.lowerBound)..<messageText.endIndex)
                        .map { end in String(messageText[messageText.index(after: start.lowerBound)..<end.lowerBound]) }
                }
            displayText = "Can you help fix my \(nameMatch ?? "broken") watch? 🔧"
        } else {
            displayText = messageText
        }

        // Create a small thumbnail for display (saves memory vs keeping full UIImage)
        let thumbnail: UIImage? = image.flatMap { createThumbnail($0, maxDimension: 200) }

        let userMsg = ChatMessage(role: .user, text: displayText, image: thumbnail)
        withAnimation(.spring(response: 0.3)) {
            messages.append(userMsg)
        }
        inputText = ""
        pendingImage = nil
        isTyping = true

        // Compress image to JPEG for API (from original, not thumbnail)
        var imageData: Data?
        if let image = image {
            imageData = compressImage(image)
        }

        // Track fix-watch context for fallback URL extraction
        if isFixWatchPrompt {
            // Extract the watch name from the prompt (between first pair of quotes)
            if let firstQuote = messageText.range(of: "\""),
               let secondQuote = messageText.range(of: "\"", range: messageText.index(after: firstQuote.lowerBound)..<messageText.endIndex) {
                fixWatchName = String(messageText[messageText.index(after: firstQuote.lowerBound)..<secondQuote.lowerBound])
                #if DEBUG
                print("[ChatViewModel] Fix-watch mode: tracking name '\(fixWatchName!)'")
                #endif
            }
        }

        // Build the text for conversation history
        var historyText = messageText.trimmingCharacters(in: .whitespaces).isEmpty
            ? "I'm sending you a screenshot. What product/item is this? Help me set up a watch for it."
            : messageText

        sendTask?.cancel()
        sendTask = Task {
            // Enrich URLs: resolve shortened links and fetch page titles before sending to AI
            if imageData == nil {
                let enriched = await enrichURLsInText(historyText)
                if enriched != historyText {
                    historyText = enriched
                }
            }

            // In fix-watch mode, adjust URL context to help AI prioritize correctly
            if isFixWatchPrompt {
                if historyText.contains("[URL_CONTEXT") && historyText.contains("resolves to:") {
                    // URL resolved — tell AI to use the resolved URL directly
                    historyText = historyText.replacingOccurrences(
                        of: "Use this info to understand what the user is referring to. Use the ORIGINAL URL the user provided for the watch, not the resolved one.]",
                        with: "IMPORTANT: The original URL resolved successfully! Use the RESOLVED URL (after '→ resolves to:') in your [UPDATE_WATCH] tag to fix the watch. Do NOT search by product name — the URL works.]"
                    )
                } else if !historyText.contains("[URL_CONTEXT") {
                    // URL didn't resolve — tell AI to search by name
                    historyText += "\n\n[NOTE: The original URL could not be resolved — it appears to be dead. Search for the product by name to find a working alternative.]"
                }
            }

            guard !Task.isCancelled else { return }

            // Inject subscription tier context on first message so AI knows which frequencies to offer
            // Always send tier — even for Free — so the AI knows NOT to offer frequency options
            if conversationHistory.isEmpty {
                historyText = "[USER_TIER]\(subscriptionTier.rawValue)[/USER_TIER]\n" + historyText
            }

            // Add to conversation history (with enriched URL context)
            conversationHistory.append(AIService.Message(role: "user", content: historyText, imageData: imageData))

            // Sliding window: keep history bounded and strip image data from older entries
            trimConversationHistory()

            do {
                let response = try await AIService.shared.chat(messages: conversationHistory)

                // Extract [UPDATE_WATCH] from raw response — store as pending fix (don't auto-apply)
                var proposedFix: (watchName: String, url: String)?
                if let startTag = response.range(of: "[UPDATE_WATCH]"),
                   let endTag = response.range(of: "[/UPDATE_WATCH]"),
                   startTag.upperBound < endTag.lowerBound {
                    let rawJSON = String(response[startTag.upperBound..<endTag.lowerBound])
                        .trimmingCharacters(in: .whitespacesAndNewlines)
                    #if DEBUG
                    print("[ChatViewModel] Found [UPDATE_WATCH] in response: \(rawJSON)")
                    #endif
                    proposedFix = parseUpdateWatchPayload(rawJSON)
                }

                // Fallback: if we're in fix-watch mode and the AI mentioned a URL but didn't use [UPDATE_WATCH]
                if proposedFix == nil, let watchName = fixWatchName {
                    let urlPattern = try? NSRegularExpression(pattern: "https?://[^\\s\\)\\]>\"]+", options: [])
                    let matches = urlPattern?.matches(in: response, range: NSRange(response.startIndex..., in: response)) ?? []
                    for match in matches {
                        if let range = Range(match.range, in: response) {
                            let url = String(response[range])
                            let lower = url.lowercased()
                            if lower.contains("google.com/search") || lower.contains("serper.dev") ||
                               lower.contains("google.com/shopping") { continue }
                            #if DEBUG
                            print("[ChatViewModel] Fallback fix: found URL '\(url)' for watch '\(watchName)'")
                            #endif
                            proposedFix = (watchName: watchName, url: url)
                            break
                        }
                    }
                }

                // Parse AI response for display text, watch JSON, suggestions, and proposal flag
                let parsed = parseResponse(response)

                // Add full response (with markers) to history so AI has context
                conversationHistory.append(AIService.Message(role: "assistant", content: response))

                // If a fix URL was proposed, store it and show AI's message with confirmation buttons
                if let fix = proposedFix {
                    pendingFix = fix
                    withAnimation(.spring(response: 0.3)) {
                        isTyping = false
                        messages.append(ChatMessage(
                            role: .steward,
                            text: parsed.displayText,
                            suggestions: ["Yes, update it ✅", "No, find a different one"],
                            productLinks: parsed.productLinks
                        ))
                    }
                } else {
                    withAnimation(.spring(response: 0.3)) {
                        isTyping = false
                        messages.append(ChatMessage(
                            role: .steward,
                            text: parsed.displayText,
                            suggestions: parsed.suggestions,
                            productLinks: parsed.productLinks
                        ))
                    }
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

    // MARK: - Parse Update Watch Payload

    /// Parses [UPDATE_WATCH] JSON and returns (name, url) if valid — does NOT apply the update
    private func parseUpdateWatchPayload(_ json: String) -> (watchName: String, url: String)? {
        let trimmed = json.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let data = trimmed.data(using: .utf8) else {
            #if DEBUG
            print("[ChatViewModel] parseUpdateWatchPayload: invalid UTF-8")
            #endif
            return nil
        }

        struct UpdatePayload: Codable {
            let name: String
            let url: String
        }

        do {
            let payload = try JSONDecoder().decode(UpdatePayload.self, from: data)
            var url = payload.url
            if !url.lowercased().hasPrefix("http") { url = "https://\(url)" }
            return (watchName: payload.name, url: url)
        } catch {
            #if DEBUG
            print("[ChatViewModel] Failed to parse update watch JSON: \(error)")
            #endif
            return nil
        }
    }

    // Price update flow is handled inline in send()

    func reset() {
        sendTask?.cancel()
        sendTask = nil
        messages = [ChatMessage.initial]
        inputText = ""
        isTyping = false
        pendingWatch = nil
        pendingWatchInitialPrice = nil
        pendingWishlistWatches = []
        pendingImage = nil
        lastDetectedPrice = nil
        pendingPriceUpdateWatchId = nil
        pendingPriceUpdateData = nil
        fixWatchName = nil
        pendingFix = nil
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

    /// Creates a small thumbnail for display in chat bubbles (saves memory vs full UIImage)
    private func createThumbnail(_ image: UIImage, maxDimension: CGFloat = 200) -> UIImage {
        let size = image.size
        let ratio = min(maxDimension / size.width, maxDimension / size.height)
        if ratio >= 1.0 { return image } // Already small enough
        let newSize = CGSize(width: size.width * ratio, height: size.height * ratio)
        let renderer = UIGraphicsImageRenderer(size: newSize)
        return renderer.image { _ in
            image.draw(in: CGRect(origin: .zero, size: newSize))
        }
    }

    /// Keeps conversation history bounded and strips image data from older entries
    private func trimConversationHistory() {
        // Strip imageData from all but the last 2 messages (only current turn needs images)
        if conversationHistory.count > 2 {
            for i in 0..<(conversationHistory.count - 2) {
                conversationHistory[i].imageData = nil
            }
        }

        // Sliding window: keep the last N messages
        if conversationHistory.count > Self.maxHistoryCount {
            conversationHistory = Array(conversationHistory.suffix(Self.maxHistoryCount))
        }
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

        // 0. Strip AI model artifacts (<function_calls>, <invoke>, etc.)
        text = Self.functionCallsRegex.stringByReplacingMatches(in: text, range: NSRange(text.startIndex..., in: text), withTemplate: "")
        text = Self.invokeTagRegex.stringByReplacingMatches(in: text, range: NSRange(text.startIndex..., in: text), withTemplate: "")
        text = Self.xmlTagRegex.stringByReplacingMatches(in: text, range: NSRange(text.startIndex..., in: text), withTemplate: "")

        // 0b. Strip [UPDATE_WATCH]...[/UPDATE_WATCH] tags if present
        if let startTag = text.range(of: "[UPDATE_WATCH]"),
           let endTag = text.range(of: "[/UPDATE_WATCH]"),
           startTag.upperBound <= endTag.lowerBound {
            text = String(text[text.startIndex..<startTag.lowerBound]) + String(text[endTag.upperBound...])
        }
        text = text.replacingOccurrences(of: "[UPDATE_WATCH]", with: "")
        text = text.replacingOccurrences(of: "[/UPDATE_WATCH]", with: "")
        text = text.replacingOccurrences(of: "[FIX_WATCH]", with: "")
        text = text.replacingOccurrences(of: "[/FIX_WATCH]", with: "")

        // 1. Extract [CREATE_WATCH] JSON if present
        var watchJSON: String?
        if let match = Self.createWatchRegex.firstMatch(in: text, range: NSRange(text.startIndex..., in: text)),
           let jsonRange = Range(match.range(at: 1), in: text) {
            watchJSON = String(text[jsonRange])
            text = Self.createWatchRegex.stringByReplacingMatches(in: text, range: NSRange(text.startIndex..., in: text), withTemplate: "")
        }

        // 2. Check for [PROPOSE_WATCH] marker — handle both block and standalone forms
        let isProposal = text.contains("[PROPOSE_WATCH]")
        // Strip block form: [PROPOSE_WATCH]...content...[/PROPOSE_WATCH]
        text = Self.proposeWatchRegex.stringByReplacingMatches(in: text, range: NSRange(text.startIndex..., in: text), withTemplate: "")
        // Strip standalone markers (in case AI uses them without closing tag)
        text = text.replacingOccurrences(of: "[PROPOSE_WATCH]", with: "")
        text = text.replacingOccurrences(of: "[/PROPOSE_WATCH]", with: "")

        // 3. Extract [PRODUCT_LINKS] if present
        var productLinks: [ProductLink]?
        if let match = Self.productLinksRegex.firstMatch(in: text, range: NSRange(text.startIndex..., in: text)),
           let linkRange = Range(match.range(at: 1), in: text) {
            let raw = String(text[linkRange])
            productLinks = parseProductLinks(raw)
            text = Self.productLinksRegex.stringByReplacingMatches(in: text, range: NSRange(text.startIndex..., in: text), withTemplate: "")
        }
        // Strip any remaining standalone PRODUCT_LINKS markers (empty tags, partial tags, etc.)
        text = text.replacingOccurrences(of: "[PRODUCT_LINKS]", with: "")
        text = text.replacingOccurrences(of: "[/PRODUCT_LINKS]", with: "")

        // 4. Extract [SUGGESTIONS] if present
        var suggestions: [String]?
        if let match = Self.suggestionsRegex.firstMatch(in: text, range: NSRange(text.startIndex..., in: text)),
           let sugRange = Range(match.range(at: 1), in: text) {
            let raw = String(text[sugRange])
            suggestions = raw.components(separatedBy: "|").map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }
            text = Self.suggestionsRegex.stringByReplacingMatches(in: text, range: NSRange(text.startIndex..., in: text), withTemplate: "")
        }

        // 5. Strip any raw watch JSON objects that leaked into display text
        //    (e.g., {"emoji":"...","name":"...","url":"...","condition":"...",...})
        text = Self.leakedWatchJsonRegex.stringByReplacingMatches(in: text, range: NSRange(text.startIndex..., in: text), withTemplate: "")

        // 5b. Strip leaked product-link JSON objects from display text
        //     (AI sometimes outputs {"title":"...","url":"...","source":"..."} without wrapping in [PRODUCT_LINKS])
        do {
            let linkMatches = Self.leakedLinkJsonRegex.matches(in: text, range: NSRange(text.startIndex..., in: text))
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
                text = Self.leakedLinkJsonRegex.stringByReplacingMatches(in: text, range: NSRange(text.startIndex..., in: text), withTemplate: "")
            }
        }  // end leaked link cleanup

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

    /// Resolves a URL (follows redirects) and fetches the page title + price info.
    /// Fetches the original URL first to follow short-link redirects, then falls back
    /// to the desktop-normalized URL if the original fails.
    private func resolveAndFetchMetadata(url: URL) async -> String? {
        let desktopUA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

        // Step 1: Try the ORIGINAL URL first — mobile short links only resolve on their original domain
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue(desktopUA, forHTTPHeaderField: "User-Agent")

        var html = ""
        var finalURL = url

        do {
            let (data, response) = try await Self.metadataSession.data(for: request)
            html = String(data: data, encoding: .utf8) ?? ""
            let responseURL = response.url ?? url

            // Don't use the resolved URL if it's just a homepage redirect
            // (app deep links like mobile.rei.com/AkCd/xyz → www.rei.com/ are useless)
            if Self.isHomepageRedirect(resolved: responseURL, original: url) {
                html = ""  // Discard homepage HTML
                #if DEBUG
                print("[ChatViewModel] Detected homepage redirect: \(url) → \(responseURL) — keeping original URL")
                #endif
            } else {
                finalURL = responseURL
            }

            // Step 2: If the original returned very little content, try the desktop-normalized URL
            if html.count < 200 {
                let normalizedURL = Self.normalizeToDesktopURL(url)
                if normalizedURL != url {
                    var fallbackRequest = URLRequest(url: normalizedURL)
                    fallbackRequest.httpMethod = "GET"
                    fallbackRequest.setValue(desktopUA, forHTTPHeaderField: "User-Agent")
                    if let (fbData, fbResponse) = try? await Self.metadataSession.data(for: fallbackRequest) {
                        let fbHTML = String(data: fbData, encoding: .utf8) ?? ""
                        let fbFinalURL = fbResponse.url ?? normalizedURL
                        if fbHTML.count > html.count && !Self.isHomepageRedirect(resolved: fbFinalURL, original: url) {
                            html = fbHTML
                            finalURL = fbFinalURL
                        }
                    }
                }
            }
        } catch {
            // If original fails entirely, try normalized URL as fallback
            let normalizedURL = Self.normalizeToDesktopURL(url)
            if normalizedURL != url {
                var fallbackRequest = URLRequest(url: normalizedURL)
                fallbackRequest.httpMethod = "GET"
                fallbackRequest.setValue(desktopUA, forHTTPHeaderField: "User-Agent")
                if let (fbData, fbResponse) = try? await Self.metadataSession.data(for: fallbackRequest) {
                    let fbFinalURL = fbResponse.url ?? normalizedURL
                    html = String(data: fbData, encoding: .utf8) ?? ""
                    if !Self.isHomepageRedirect(resolved: fbFinalURL, original: url) {
                        finalURL = fbFinalURL
                    }
                } else {
                    #if DEBUG
                    print("[ChatViewModel] Failed to resolve URL: \(url) — \(error.localizedDescription)")
                    #endif
                    return nil
                }
            } else {
                #if DEBUG
                print("[ChatViewModel] Failed to resolve URL: \(url) — \(error.localizedDescription)")
                #endif
                return nil
            }
        }

        // Extract page title
        let title = extractTitle(from: html)
        // Extract price if visible
        let price = extractPrice(from: html)

        // Store detected price for use in watch creation
        if let priceStr = price,
           let numericStr = priceStr.replacingOccurrences(of: "[^0-9.]", with: "", options: .regularExpression) as String?,
           let priceVal = Double(numericStr), priceVal > 0 {
            lastDetectedPrice = priceVal
        }

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

    /// Tries to extract a price from the HTML using multiple strategies
    private func extractPrice(from html: String) -> String? {
        // 1. OG / product meta tags
        let metaPatterns = [
            "property=\"(?:og|product):price:amount\"\\s+content=\"([^\"]+)\"",
            "content=\"([^\"]+)\"\\s+property=\"(?:og|product):price:amount\""
        ]
        for pattern in metaPatterns {
            if let price = firstMatch(pattern: pattern, in: html) {
                let cleaned = price.trimmingCharacters(in: .whitespacesAndNewlines)
                if !cleaned.isEmpty, Double(cleaned.replacingOccurrences(of: ",", with: "")) != nil {
                    return "$\(cleaned)"
                }
            }
        }

        // 2. JSON-LD structured data (common on modern e-commerce sites)
        let jsonLdPattern = "<script[^>]*type=\"application/ld\\+json\"[^>]*>([\\s\\S]*?)</script>"
        if let regex = try? NSRegularExpression(pattern: jsonLdPattern, options: .caseInsensitive) {
            let matches = regex.matches(in: html, range: NSRange(html.startIndex..., in: html))
            for match in matches {
                if let range = Range(match.range(at: 1), in: html) {
                    let jsonStr = String(html[range])
                    if let price = extractPriceFromJSONLD(jsonStr) {
                        return "$\(String(format: "%.2f", price))"
                    }
                }
            }
        }

        // 3. Structured HTML price selectors (Amazon, generic e-commerce)
        let structuredPatterns = [
            "priceAmount[^>]*>\\s*\\$?\\s*([\\d,]+\\.?\\d{0,2})",
            "priceToPay[^>]*>.*?\\$?\\s*([\\d,]+\\.?\\d{0,2})",
            "product[_-]?price[^>]*>\\s*\\$?\\s*([\\d,]+\\.?\\d{0,2})",
            "sale[_-]?price[^>]*>\\s*\\$?\\s*([\\d,]+\\.?\\d{0,2})",
            "current[_-]?price[^>]*>\\s*\\$?\\s*([\\d,]+\\.?\\d{0,2})"
        ]
        for pattern in structuredPatterns {
            if let priceStr = firstMatch(pattern: pattern, in: html),
               let price = Double(priceStr.replacingOccurrences(of: ",", with: "")),
               price > 0.50, price < 100_000 {
                return "$\(String(format: "%.2f", price))"
            }
        }

        // 4. Dollar amounts near price context words
        let contextPattern = "(?:price|cost|now|sale|buy|pay)[^$]{0,40}\\$([\\d,]+\\.\\d{2})"
        if let priceStr = firstMatch(pattern: contextPattern, in: html),
           let price = Double(priceStr.replacingOccurrences(of: ",", with: "")),
           price > 0.50, price < 100_000 {
            return "$\(String(format: "%.2f", price))"
        }

        // 5. Most frequent $X.XX on page (fallback)
        let allPricePattern = "\\$([\\d,]+\\.\\d{2})"
        if let regex = try? NSRegularExpression(pattern: allPricePattern, options: []) {
            let matches = regex.matches(in: html, range: NSRange(html.startIndex..., in: html))
            var freq: [Double: Int] = [:]
            for match in matches {
                if let range = Range(match.range(at: 1), in: html),
                   let price = Double(String(html[range]).replacingOccurrences(of: ",", with: "")),
                   price > 0.50, price < 100_000 {
                    freq[price, default: 0] += 1
                }
            }
            if let best = freq.max(by: { $0.value < $1.value }), best.value >= 2 {
                return "$\(String(format: "%.2f", best.key))"
            }
        }

        return nil
    }

    private func firstMatch(pattern: String, in text: String) -> String? {
        guard let regex = try? NSRegularExpression(pattern: pattern, options: [.caseInsensitive, .dotMatchesLineSeparators]),
              let match = regex.firstMatch(in: text, range: NSRange(text.startIndex..., in: text)),
              let range = Range(match.range(at: 1), in: text) else { return nil }
        return String(text[range])
    }

    private func extractPriceFromJSONLD(_ jsonStr: String) -> Double? {
        guard let data = jsonStr.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) else { return nil }

        func findPrice(in obj: Any) -> Double? {
            if let dict = obj as? [String: Any] {
                // Direct price field
                if let price = dict["price"] {
                    if let p = price as? Double, p > 0 { return p }
                    if let s = price as? String, let p = Double(s.replacingOccurrences(of: ",", with: "")), p > 0 { return p }
                }
                // Check offers.price or offers.lowPrice
                if let offers = dict["offers"] {
                    if let result = findPrice(in: offers) { return result }
                }
                if let lowPrice = dict["lowPrice"] {
                    if let p = lowPrice as? Double, p > 0 { return p }
                    if let s = lowPrice as? String, let p = Double(s.replacingOccurrences(of: ",", with: "")), p > 0 { return p }
                }
            } else if let arr = obj as? [Any] {
                for item in arr {
                    if let result = findPrice(in: item) { return result }
                }
            }
            return nil
        }

        return findPrice(in: json)
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
            let watchMode: String?
            let searchQuery: String?
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
                imageURL: payload.imageURL,
                watchMode: payload.watchMode ?? "url",
                searchQuery: payload.searchQuery
            )

            // If no image was provided by the AI, try to fetch og:image from the URL
            if payload.imageURL == nil || payload.imageURL?.isEmpty == true {
                Task { @MainActor in
                    if let ogImage = await self.fetchOGImage(from: url) {
                        watch.imageURL = ogImage
                    }
                }
            }

            // For price watches, create immediately and present detected price
            if actionType == .price {
                let detectedPrice = lastDetectedPrice
                lastDetectedPrice = nil

                // Create the watch (with initial price if detected)
                pendingWatch = watch
                pendingWatchInitialPrice = detectedPrice
                watchReadySignal += 1

                if let detectedPrice {
                    // Present the detected price with suggestions to confirm or change
                    let priceStr = String(format: "$%.2f", detectedPrice)
                    let msg = ChatMessage(
                        role: .steward,
                        text: "I detected the current price as \(priceStr). I'll start tracking from this price.",
                        suggestions: ["Looks good ✓", "Change starting price"]
                    )
                    withAnimation(.spring(response: 0.3)) {
                        messages.append(msg)
                    }
                    // Store watch ID in case user wants to change the price
                    pendingPriceUpdateWatchId = watch.id
                } else {
                    // No price detected (JS-heavy site, ticket marketplace, etc.)
                    // Ask the user to provide the price they're currently seeing
                    let msg = ChatMessage(
                        role: .steward,
                        text: "I couldn't detect the current price from this page. What price are you seeing right now? This helps me track changes more accurately.",
                        suggestions: ["Skip for now"]
                    )
                    withAnimation(.spring(response: 0.3)) {
                        messages.append(msg)
                    }
                    pendingPriceUpdateWatchId = watch.id
                }
            } else {
                pendingWatch = watch
                pendingWatchInitialPrice = nil
                watchReadySignal += 1
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

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1", forHTTPHeaderField: "User-Agent")

        do {
            let (data, _) = try await Self.metadataSession.data(for: request)
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

    // MARK: - URL Normalization

    /// Converts mobile URLs to their desktop equivalents for better page content
    static func normalizeToDesktopURL(_ url: URL) -> URL {
        guard var components = URLComponents(url: url, resolvingAgainstBaseURL: true),
              var host = components.host?.lowercased() else {
            return url
        }

        // Convert mobile subdomains to www
        let mobilePatterns = ["mobile.", "m.", "amp."]
        for pattern in mobilePatterns {
            if host.hasPrefix(pattern) {
                host = "www." + host.dropFirst(pattern.count)
                break
            }
        }

        components.host = host
        return components.url ?? url
    }

    /// Returns true if the redirect lost all path specificity — the original URL
    /// had a meaningful path but the resolved URL is just a homepage ("/").
    /// This happens with app deep links (e.g. mobile.rei.com/AkCd/xyz → www.rei.com/).
    private static func isHomepageRedirect(resolved: URL, original: URL) -> Bool {
        let resolvedPath = resolved.path
        let originalPath = original.path
        let resolvedIsHomepage = resolvedPath.isEmpty || resolvedPath == "/"
        let originalHadPath = !originalPath.isEmpty && originalPath != "/"
        return resolvedIsHomepage && originalHadPath
    }
}
