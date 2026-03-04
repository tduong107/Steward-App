import Foundation
import SwiftUI
import Observation

@Observable
@MainActor
final class ChatViewModel {
    var messages: [ChatMessage] = [ChatMessage.initial]
    var inputText = ""
    var isTyping = false

    // Multi-turn conversation state
    private enum ConversationStage {
        case initial
        case awaitingURL(intent: String)
        case awaitingConfirmation(url: String, actionType: ActionType)
        case complete
    }

    private var stage: ConversationStage = .initial

    func send(_ text: String? = nil) {
        let messageText = text ?? inputText
        guard !messageText.trimmingCharacters(in: .whitespaces).isEmpty else { return }

        let userMsg = ChatMessage(role: .user, text: messageText)
        withAnimation(.spring(response: 0.3)) {
            messages.append(userMsg)
        }
        inputText = ""

        isTyping = true

        Task {
            try? await Task.sleep(for: .seconds(1.0))
            let replies = buildReply(for: messageText)
            withAnimation(.spring(response: 0.3)) {
                isTyping = false
                messages.append(contentsOf: replies)
            }
        }
    }

    func reset() {
        messages = [ChatMessage.initial]
        inputText = ""
        isTyping = false
        stage = .initial
    }

    // MARK: - Conversation Logic

    private func buildReply(for text: String) -> [ChatMessage] {
        let lower = text.lowercased()

        switch stage {
        case .initial:
            return handleInitialMessage(lower, original: text)
        case .awaitingURL(let intent):
            return handleURLInput(lower, intent: intent)
        case .awaitingConfirmation(let url, let actionType):
            return handleConfirmation(lower, url: url, actionType: actionType)
        case .complete:
            stage = .initial
            return [ChatMessage(
                role: .steward,
                text: "Anything else you'd like me to watch?",
                suggestions: ["Monitor a product price", "Watch for a restock", "Track an appointment slot"]
            )]
        }
    }

    private func handleInitialMessage(_ lower: String, original: String) -> [ChatMessage] {
        if lower.contains("price") || lower.contains("tesla") || lower.contains("drop") {
            stage = .awaitingURL(intent: "price")
            return [ChatMessage(
                role: .steward,
                text: "I can watch that page for a price change. What's the URL?"
            )]
        }

        if lower.contains("restock") || lower.contains("stock") || lower.contains("nike") || lower.contains("shoe") {
            stage = .awaitingURL(intent: "restock")
            return [ChatMessage(
                role: .steward,
                text: "Got it — I'll monitor that page for a restock. Paste the product URL and I'll get started."
            )]
        }

        if lower.contains("appointment") || lower.contains("book") || lower.contains("slot") {
            stage = .awaitingURL(intent: "appointment")
            return [ChatMessage(
                role: .steward,
                text: "I can watch for an open slot and book it the moment it appears. What site should I monitor?"
            )]
        }

        if lower.contains("http") || lower.contains(".com") || lower.contains("www") {
            return handleURLDetected(lower)
        }

        stage = .awaitingURL(intent: "general")
        return [ChatMessage(
            role: .steward,
            text: "Sure — to get started, share the URL of the page you'd like me to watch. I'll scan it and suggest the best actions."
        )]
    }

    private func handleURLInput(_ lower: String, intent: String) -> [ChatMessage] {
        if lower.contains("http") || lower.contains(".com") || lower.contains("www") || lower.contains(".") {
            return handleURLDetected(lower)
        }
        return [ChatMessage(
            role: .steward,
            text: "That doesn't look like a URL. Please paste a link like nike.com/product or https://example.com"
        )]
    }

    private func handleURLDetected(_ lower: String) -> [ChatMessage] {
        let url = lower.trimmingCharacters(in: .whitespaces)
        stage = .awaitingConfirmation(url: url, actionType: .notify)
        return [ChatMessage(
            role: .steward,
            text: "I've scanned that page. Here's what I can do for you automatically:",
            actionCards: [
                ActionCard(icon: "bell", label: "Notify me when anything changes", type: .notify),
                ActionCard(icon: "cart", label: "Add to cart when back in stock", type: .cart),
                ActionCard(icon: "chart.line.downtrend.xyaxis", label: "Alert me if price drops", type: .price),
                ActionCard(icon: "doc.text", label: "Submit a form on my behalf", type: .form),
            ]
        )]
    }

    private func handleConfirmation(_ lower: String, url: String, actionType: ActionType) -> [ChatMessage] {
        stage = .complete
        return [ChatMessage(
            role: .steward,
            text: "All set! I'll start monitoring right away and let you know the moment something changes. You can check the status on your home screen."
        )]
    }
}
