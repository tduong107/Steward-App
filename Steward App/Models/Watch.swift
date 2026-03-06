import Foundation
import SwiftData

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

@Model
final class Watch {
    var id: UUID
    var emoji: String
    var name: String
    var url: String
    var condition: String
    var actionLabel: String
    var actionTypeRaw: String
    var statusRaw: String
    var lastSeen: String
    var triggered: Bool
    var changeNote: String?
    var checkFrequency: String
    var imageURL: String?
    var lastCheckedAt: Date?
    var createdAt: Date

    var actionType: ActionType {
        get { ActionType(rawValue: actionTypeRaw) ?? .notify }
        set { actionTypeRaw = newValue.rawValue }
    }

    var status: WatchStatus {
        get { WatchStatus(rawValue: statusRaw) ?? .watching }
        set { statusRaw = newValue.rawValue }
    }

    init(
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
        checkFrequency: String = "Daily",
        imageURL: String? = nil,
        lastCheckedAt: Date? = nil
    ) {
        self.id = UUID()
        self.emoji = emoji
        self.name = name
        self.url = url
        self.condition = condition
        self.actionLabel = actionLabel
        self.actionTypeRaw = actionType.rawValue
        self.statusRaw = status.rawValue
        self.lastSeen = lastSeen
        self.triggered = triggered
        self.changeNote = changeNote
        self.checkFrequency = checkFrequency
        self.imageURL = imageURL
        self.lastCheckedAt = lastCheckedAt
        self.createdAt = Date()
    }
}

// MARK: - Computed Helpers

extension Watch {
    /// The full URL with https:// prepended if missing
    var fullURL: URL? {
        var urlString = url
        if !urlString.lowercased().hasPrefix("http") {
            urlString = "https://\(urlString)"
        }
        return URL(string: urlString)
    }

    /// The next check date based on last check + frequency interval
    var nextCheckDate: Date? {
        guard let freq = CheckFrequency.from(string: checkFrequency) else { return nil }
        let baseDate = lastCheckedAt ?? createdAt
        return baseDate.addingTimeInterval(freq.intervalSeconds)
    }

    /// Formatted countdown string to next check (e.g. "in 4h 23m", "in 12m")
    var nextCheckCountdown: String {
        guard let nextDate = nextCheckDate else { return checkFrequency }

        let now = Date()
        if nextDate <= now {
            return "Checking soon…"
        }

        let remaining = nextDate.timeIntervalSince(now)

        if remaining < 60 {
            return "in <1m"
        } else if remaining < 3600 {
            let mins = Int(remaining / 60)
            return "in \(mins)m"
        } else if remaining < 86400 {
            let hours = Int(remaining / 3600)
            let mins = Int((remaining.truncatingRemainder(dividingBy: 3600)) / 60)
            return mins > 0 ? "in \(hours)h \(mins)m" : "in \(hours)h"
        } else {
            let hours = Int(remaining / 3600)
            return "in \(hours)h"
        }
    }
}

#if DEBUG
// MARK: - Sample Data (for previews only)
extension Watch {
    static func createSamples() -> [Watch] {
        [
            Watch(
                emoji: "👟",
                name: "Nike Air Max 95",
                url: "nike.com/air-max-95",
                condition: "Back in stock · Size 10",
                actionLabel: "Add to cart automatically",
                actionType: .cart,
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
                lastSeen: "12 min ago"
            ),
        ]
    }
}
#endif
