import Foundation

// MARK: - Subscription Tier

enum SubscriptionTier: String, Codable, CaseIterable {
    case free = "Free"
    case pro = "Pro"
    case premium = "Premium"

    var displayName: String { rawValue }

    var price: String {
        switch self {
        case .free: return "Free"
        case .pro: return "$4.99/mo"
        case .premium: return "$9.99/mo"
        }
    }

    var color: String {
        switch self {
        case .free: return "inkLight"
        case .pro: return "accent"
        case .premium: return "gold"
        }
    }

    // MARK: - Tier Ranking & Comparison

    var rank: Int {
        switch self {
        case .free: return 0
        case .pro: return 1
        case .premium: return 2
        }
    }

    /// Returns true if this tier includes all features of `other`
    func includes(_ other: SubscriptionTier) -> Bool {
        rank >= other.rank
    }

    // MARK: - Feature Gates

    var maxWatches: Int {
        switch self {
        case .free: return 3
        case .pro: return 7
        case .premium: return 15
        }
    }

    var hasPriceInsights: Bool {
        self != .free
    }

    /// Whether this tier supports quick link response mode (Pro+)
    var hasQuickLink: Bool {
        self != .free
    }

    /// Whether this tier supports email & SMS notifications (Pro+)
    var hasEmailSMS: Bool {
        self != .free
    }

    var availableActionTypes: Set<ActionType> {
        switch self {
        case .free: return [.notify]
        case .pro, .premium: return [.notify, .cart, .book, .form, .price]
        }
    }

    /// Whether this tier supports Steward Acts / auto-act (Premium only)
    var hasAutoAct: Bool {
        self == .premium
    }

    /// Whether this tier supports fake deal detection (Premium only)
    var hasFakeDealDetection: Bool {
        self == .premium
    }

    // MARK: - StoreKit Product IDs

    var monthlyProductId: String? {
        switch self {
        case .free: return nil
        case .pro: return "steward.pro.month"
        case .premium: return "steward.premium.month"
        }
    }

    var yearlyProductId: String? {
        switch self {
        case .free: return nil
        case .pro: return "steward.pro.year"
        case .premium: return "steward.premium.year"
        }
    }

    static let allProductIds: Set<String> = [
        "steward.pro.month",
        "steward.pro.year",
        "steward.premium.month",
        "steward.premium.year"
    ]

    /// Determine tier from a product ID
    static func tier(for productId: String) -> SubscriptionTier {
        if productId.contains("premium") { return .premium }
        if productId.contains("pro") { return .pro }
        return .free
    }
}

// MARK: - Check Frequency

enum CheckFrequency: String, CaseIterable {
    case daily = "Daily"
    case every12h = "Every 12 hours"
    case every6h = "Every 6 hours"
    case every4h = "Every 4 hours"
    case every2h = "Every 2 hours"

    var displayName: String { rawValue }

    /// Which tier is required for this frequency
    var requiredTier: SubscriptionTier {
        switch self {
        case .daily:
            return .free
        case .every12h:
            return .pro
        case .every6h, .every4h, .every2h:
            return .premium
        }
    }

    /// Subtitle for display
    var tierLabel: String? {
        switch requiredTier {
        case .free: return nil
        case .pro: return "Pro"
        case .premium: return "Premium"
        }
    }

    /// Interval in seconds between checks
    var intervalSeconds: TimeInterval {
        switch self {
        case .daily: return 86400
        case .every12h: return 43200
        case .every6h: return 21600
        case .every4h: return 14400
        case .every2h: return 7200
        }
    }

    /// Create from the raw string stored on Watch
    static func from(string: String) -> CheckFrequency? {
        // Support legacy frequency strings from older watches
        switch string {
        case "Every hour", "Every 1 hour":
            return .every2h
        case "Every 30 min", "Every 15 min", "Every 5 min":
            return .every2h
        default:
            return allCases.first { $0.rawValue == string }
        }
    }

    /// Grouped by tier for display
    static var freeTier: [CheckFrequency] { [.daily] }
    static var proTier: [CheckFrequency] { [.every12h] }
    static var premiumTier: [CheckFrequency] { [.every6h, .every4h, .every2h] }
}
