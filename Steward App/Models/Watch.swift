import Foundation
import SwiftData

enum WatchStatus: String, Codable {
    case watching
    case triggered
    case paused
}

enum ActionType: String, Codable, CaseIterable {
    case cart
    case form
    case book
    case notify
    case price

    var displayName: String {
        switch self {
        case .price: return "Price Drop"
        case .cart:  return "Add to Cart"
        case .form:  return "Fill Form"
        case .book:  return "Book"
        case .notify: return "Notify Me"
        }
    }

    var iconName: String {
        switch self {
        case .price: return "tag.fill"
        case .cart:  return "cart.fill"
        case .form:  return "doc.text.fill"
        case .book:  return "calendar"
        case .notify: return "bell.fill"
        }
    }
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
    var preferredCheckTime: String?
    var notifyChannels: String = "push"
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
        preferredCheckTime: String? = nil,
        notifyChannels: String = "push",
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
        // Default preferredCheckTime to current time if not specified
        if let preferredCheckTime {
            self.preferredCheckTime = preferredCheckTime
        } else {
            let formatter = DateFormatter()
            formatter.dateFormat = "HH:mm"
            self.preferredCheckTime = formatter.string(from: Date())
        }
        self.notifyChannels = notifyChannels
        self.imageURL = imageURL
        self.lastCheckedAt = lastCheckedAt ?? Date() // Creation counts as first check
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

    /// The next check date based on last check + frequency interval, aligned to preferred time if set
    var nextCheckDate: Date? {
        guard let freq = CheckFrequency.from(string: checkFrequency) else { return nil }
        let baseDate = lastCheckedAt ?? createdAt
        let interval = freq.intervalSeconds

        // No preferred time — use simple interval
        guard let timeStr = preferredCheckTime,
              let (hour, minute) = Self.parseTimeString(timeStr) else {
            return baseDate.addingTimeInterval(interval)
        }

        let calendar = Calendar.current
        let now = Date()

        // For daily: next occurrence of HH:mm
        if interval >= 86400 {
            var nextCheck = calendar.nextDate(
                after: baseDate,
                matching: DateComponents(hour: hour, minute: minute),
                matchingPolicy: .nextTime
            ) ?? baseDate.addingTimeInterval(interval)
            while nextCheck <= now {
                nextCheck = nextCheck.addingTimeInterval(interval)
            }
            return nextCheck
        }

        // For sub-daily: find the next time slot aligned to preferredCheckTime
        var candidate = calendar.date(bySettingHour: hour, minute: minute, second: 0, of: baseDate) ?? baseDate
        while candidate <= now {
            candidate = candidate.addingTimeInterval(interval)
        }
        return candidate
    }

    private static func parseTimeString(_ str: String) -> (Int, Int)? {
        let parts = str.split(separator: ":")
        guard parts.count == 2,
              let h = Int(parts[0]), let m = Int(parts[1]),
              h >= 0, h < 24, m >= 0, m < 60 else { return nil }
        return (h, m)
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
