import Foundation
import UIKit

enum ChatRole {
    case steward
    case user
}

struct ActionCard: Identifiable {
    let id = UUID()
    let icon: String
    let label: String
    let type: ActionType
}

struct ProductLink: Identifiable {
    let id = UUID()
    let title: String
    let url: String
    let source: String // e.g. "Amazon", "Google Shopping", "eBay"
    let price: String? // Optional price snippet
    let imageURL: String? // Product image from search results

    var displayURL: String {
        URL(string: url)?.host ?? url
    }
}

struct ChatMessage: Identifiable {
    let id: UUID
    let role: ChatRole
    let text: String
    var suggestions: [String]?
    var actionCards: [ActionCard]?
    var productLinks: [ProductLink]?
    var image: UIImage? // Thumbnail for display (compressed from original)

    init(
        id: UUID = UUID(),
        role: ChatRole,
        text: String,
        suggestions: [String]? = nil,
        actionCards: [ActionCard]? = nil,
        productLinks: [ProductLink]? = nil,
        image: UIImage? = nil
    ) {
        self.id = id
        self.role = role
        self.text = text
        self.suggestions = suggestions
        self.actionCards = actionCards
        self.productLinks = productLinks
        self.image = image
    }
}

extension ChatMessage {
    static let initial = ChatMessage(
        role: .steward,
        text: "Hello! 👋 I'm Steward, your personal web watcher. I keep an eye on websites and take action on your behalf. What can I help you with?",
        suggestions: ["Track a price drop", "Watch for a restock", "Find tickets or appointments", "Monitor a booking"]
    )
}
