import Foundation

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

    init(
        id: UUID = UUID(),
        role: ChatRole,
        text: String,
        suggestions: [String]? = nil,
        actionCards: [ActionCard]? = nil
    ) {
        self.id = id
        self.role = role
        self.text = text
        self.suggestions = suggestions
        self.actionCards = actionCards
    }
}

extension ChatMessage {
    static let initial = ChatMessage(
        role: .steward,
        text: "Good morning. I'm Steward — I watch websites and act on your behalf so you don't have to. What would you like me to keep an eye on?",
        suggestions: ["Monitor a product price", "Watch for a restock", "Track an appointment slot", "Something else"]
    )
}
