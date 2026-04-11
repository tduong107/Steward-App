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
        case .book:  return "Availability"
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

    var isActionable: Bool {
        switch self {
        case .notify: return false
        case .cart, .form, .book, .price: return true
        }
    }

    var actionButtonLabel: String {
        switch self {
        case .price: return "Open & Buy"
        case .cart:  return "Add to Cart"
        case .book:  return "Open & Reserve"
        case .form:  return "Open & Fill"
        case .notify: return "View Page"
        }
    }

    var actionButtonIcon: String {
        switch self {
        case .price: return "safari"
        case .cart:  return "cart.badge.plus"
        case .book:  return "calendar.badge.plus"
        case .form:  return "doc.badge.plus"
        case .notify: return "bell.fill"
        }
    }
}

/// What Steward does when a watch triggers.
enum ResponseMode: String, Codable, CaseIterable, Identifiable {
    case notify     = "notify"
    case quickLink  = "quickLink"
    case stewardActs = "stewardActs"

    var id: String { rawValue }

    var requiredTier: SubscriptionTier {
        switch self {
        case .notify:      return .free
        case .quickLink:   return .pro
        case .stewardActs: return .premium
        }
    }

    var title: String {
        switch self {
        case .notify:      return "Notify Me"
        case .quickLink:   return "Notify + Quick Link"
        case .stewardActs: return "Steward Acts"
        }
    }
}

@Model
final class Watch {
    // Static formatters (DateFormatter is expensive to create — reuse across instances)
    private static let timeFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "HH:mm"
        return f
    }()

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
    var actionURL: String?
    var lastCheckedAt: Date?
    var createdAt: Date
    var watchMode: String = "url"          // "url" (single-URL) or "search" (multi-source)
    var searchQuery: String?               // Product search query for search-mode watches

    // Error tracking — populated by check-watch when checks fail
    var consecutiveFailures: Int = 0
    var lastError: String?
    var needsAttention: Bool = false

    // Alternative source suggestion (when original site is unreachable but found elsewhere)
    var altSourceUrl: String?
    var altSourceDomain: String?
    var altSourcePrice: Double?
    var altSourceFoundAt: Date?

    // Action enhancement — coupon code detected on the page when triggered
    var couponCode: String?

    // Affiliate link tracking
    var affiliateNetwork: String?
    var affiliateUrl: String?
    var isAffiliated: Bool = false

    // Auto-act: execute action server-side when condition is met (Premium feature)
    var autoActEnabled: Bool = false
    var spendingLimit: Double?

    // Notify on any price decrease (not just when target/threshold met)
    var notifyAnyPriceDrop: Bool = false

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
        actionURL: String? = nil,
        lastCheckedAt: Date? = nil,
        watchMode: String = "url",
        searchQuery: String? = nil,
        consecutiveFailures: Int = 0,
        lastError: String? = nil,
        needsAttention: Bool = false
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
            self.preferredCheckTime = Self.timeFormatter.string(from: Date())
        }
        self.notifyChannels = notifyChannels
        self.imageURL = imageURL
        self.actionURL = actionURL
        self.lastCheckedAt = lastCheckedAt
        self.createdAt = Date()
        self.watchMode = watchMode
        self.searchQuery = searchQuery
        self.consecutiveFailures = consecutiveFailures
        self.lastError = lastError
        self.needsAttention = needsAttention
    }
}

// MARK: - Computed Helpers

extension Watch {
    /// Whether this watch has an error that needs user attention
    var hasError: Bool { needsAttention && lastError != nil }

    /// The full URL with https:// prepended if missing
    var fullURL: URL? {
        var urlString = url
        if !urlString.lowercased().hasPrefix("http") {
            urlString = "https://\(urlString)"
        }
        return URL(string: urlString)
    }

    /// The action URL to open when the user taps "Act" — uses actionURL if set, otherwise falls back to the watched URL for actionable types
    var actionFullURL: URL? {
        let urlStr = actionURL ?? (actionType.isActionable ? url : nil)
        guard let urlStr else { return nil }
        var s = urlStr
        if !s.lowercased().hasPrefix("http") { s = "https://\(s)" }
        return URL(string: s)
    }

    /// The next watch date based on last check + frequency interval, aligned to preferred time if set
    var nextCheckDate: Date? {
        guard let freq = CheckFrequency.from(string: checkFrequency) else { return nil }
        let baseDate = lastCheckedAt ?? createdAt
        let interval = freq.intervalSeconds
        guard interval > 0 else { return nil } // Prevent infinite loop from zero interval
        let now = Date()

        // For frequent watches (< 6 hours), just use simple interval from last check.
        // preferredCheckTime alignment only makes sense for daily/12h frequencies.
        if interval < 21600 {
            var next = baseDate.addingTimeInterval(interval)
            while next <= now {
                next = next.addingTimeInterval(interval)
            }
            return next
        }

        // No preferred time — use simple interval
        guard let timeStr = preferredCheckTime,
              let (hour, minute) = Self.parseTimeString(timeStr) else {
            return baseDate.addingTimeInterval(interval)
        }

        let calendar = Calendar.current

        // For daily+: next occurrence of HH:mm
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

        // For 6h/12h: find the next time slot aligned to preferredCheckTime
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

    /// Formatted countdown string to next watch (e.g. "in 4h 23m", "in 12m")
    var nextCheckCountdown: String {
        guard let nextDate = nextCheckDate else { return checkFrequency }

        let now = Date()
        if nextDate <= now {
            return "Any moment now…"
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
