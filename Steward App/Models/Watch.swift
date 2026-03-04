import Foundation

enum WatchStatus: String, Codable {
    case watching
    case triggered
    case paused
}

enum ActionType: String, Codable {
    case cart
    case form
    case book
    case notify
    case price
}

struct Watch: Identifiable, Codable {
    let id: UUID
    var emoji: String
    var name: String
    var url: String
    var condition: String
    var actionLabel: String
    var actionType: ActionType
    var status: WatchStatus
    var lastSeen: String
    var triggered: Bool
    var changeNote: String?
    var checkFrequency: String

    init(
        id: UUID = UUID(),
        emoji: String,
        name: String,
        url: String,
        condition: String,
        actionLabel: String,
        actionType: ActionType,
        status: WatchStatus = .watching,
        lastSeen: String = "Just now",
        triggered: Bool = false,
        changeNote: String? = nil,
        checkFrequency: String = "Every 5 minutes"
    ) {
        self.id = id
        self.emoji = emoji
        self.name = name
        self.url = url
        self.condition = condition
        self.actionLabel = actionLabel
        self.actionType = actionType
        self.status = status
        self.lastSeen = lastSeen
        self.triggered = triggered
        self.changeNote = changeNote
        self.checkFrequency = checkFrequency
    }
}

// MARK: - Sample Data
extension Watch {
    static let samples: [Watch] = [
        Watch(
            emoji: "👟",
            name: "Nike Air Max 95",
            url: "nike.com/air-max-95",
            condition: "Back in stock · Size 10",
            actionLabel: "Add to cart automatically",
            actionType: .cart,
            status: .watching,
            lastSeen: "3 min ago"
        ),
        Watch(
            emoji: "🚗",
            name: "Tesla Model Y",
            url: "tesla.com/modely",
            condition: "Price drops below $42,000",
            actionLabel: "Submit test drive form",
            actionType: .form,
            status: .triggered,
            lastSeen: "Just now",
            triggered: true,
            changeNote: "Price dropped to $41,500"
        ),
        Watch(
            emoji: "🏡",
            name: "Airbnb · Malibu",
            url: "airbnb.com/rooms/98123",
            condition: "Dates available · Aug 12–15",
            actionLabel: "Book instantly",
            actionType: .book,
            status: .watching,
            lastSeen: "12 min ago"
        ),
    ]
}
