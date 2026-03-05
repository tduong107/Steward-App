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
        let historyText = messageText.trimmingCharacters(in: .whitespaces).isEmpty
            ? "I'm sending you a screenshot. What product/item is this? Help me set up a watch for it."
            : messageText

        // Add to conversation history
        conversationHistory.append(AIService.Message(role: "user", content: historyText, imageData: imageData))

        Task {
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
                        suggestions: parsed.suggestions
                    ))
                }

                // Create watch if AI included the marker
                if let json = parsed.watchJSON {
                    createWatchFromJSON(json)
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
                print("[ChatViewModel] AI error: \(error)")
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
        let isProposal: Bool
    }

    /// Extracts display text, optional watch JSON, suggestions, and proposal flag from AI response
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

        // 2. Check for [PROPOSE_WATCH] marker
        let isProposal = text.contains("[PROPOSE_WATCH]")
        text = text.replacingOccurrences(of: "[PROPOSE_WATCH]", with: "")

        // 3. Extract [SUGGESTIONS] if present
        var suggestions: [String]?
        if let regex = try? NSRegularExpression(pattern: "\\[SUGGESTIONS\\](.*?)\\[/SUGGESTIONS\\]", options: .dotMatchesLineSeparators),
           let match = regex.firstMatch(in: text, range: NSRange(text.startIndex..., in: text)),
           let sugRange = Range(match.range(at: 1), in: text) {
            let raw = String(text[sugRange])
            suggestions = raw.components(separatedBy: "|").map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }
            text = text.replacingOccurrences(of: "\\[SUGGESTIONS\\].*?\\[/SUGGESTIONS\\]", with: "", options: .regularExpression)
        }

        // 4. If it's a proposal, override suggestions with confirm/deny buttons
        if isProposal {
            suggestions = ["Yes, set it up! ✅", "No, let me change something"]
        }

        return ParsedResponse(
            displayText: text.trimmingCharacters(in: .whitespacesAndNewlines),
            watchJSON: watchJSON,
            suggestions: suggestions,
            isProposal: isProposal
        )
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
        }

        do {
            let payload = try JSONDecoder().decode(WatchPayload.self, from: data)
            let actionType = ActionType(rawValue: payload.actionType) ?? .notify

            // Ensure URL has a protocol
            var url = payload.url
            if !url.lowercased().hasPrefix("http") {
                url = "https://\(url)"
            }

            let watch = Watch(
                emoji: payload.emoji,
                name: payload.name,
                url: url,
                condition: payload.condition,
                actionLabel: payload.actionLabel,
                actionType: actionType
            )
            pendingWatch = watch
        } catch {
            print("[ChatViewModel] Failed to parse watch JSON: \(error)")
        }
    }
}
