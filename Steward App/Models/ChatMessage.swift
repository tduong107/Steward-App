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

struct ChatMessage: Identifiable {
    let id: UUID
    let role: ChatRole
    let text: String
    var suggestions: [String]?
    var actionCards: [ActionCard]?
    var image: UIImage? // Optional attached screenshot/photo

    init(
        id: UUID = UUID(),
        role: ChatRole,
        text: String,
        suggestions: [String]? = nil,
        actionCards: [ActionCard]? = nil,
        image: UIImage? = nil
    ) {
        self.id = id
        self.role = role
        self.text = text
        self.suggestions = suggestions
        self.actionCards = actionCards
        self.image = image
    }
}

extension ChatMessage {
    static let initial = ChatMessage(
        role: .steward,
        text: "Hello! 👋 I'm Steward, your personal web watcher. I keep an eye on websites and take action on your behalf. What can I help you with?",
        suggestions: ["Monitor a product price", "Watch for a restock", "Track an appointment slot", "Import a wishlist"]
    )
}
