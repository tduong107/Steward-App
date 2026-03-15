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
        case .pro: return "$1.99/mo"
        case .premium: return "$3.99/mo"
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
        case .pro: return 10
        case .premium: return 25
        }
    }

    var hasPriceInsights: Bool {
        self != .free
    }

    var availableActionTypes: Set<ActionType> {
        switch self {
        case .free: return [.notify]
        case .pro, .premium: return [.notify, .cart, .book, .form, .price]
        }
    }

    /// Whether this tier supports auto-act (server-side action execution)
    var hasAutoAct: Bool {
        self == .premium
    }

    // MARK: - StoreKit Product IDs

    var monthlyProductId: String? {
        switch self {
        case .free: return nil
        case .pro: return "steward.pro.monthly"
        case .premium: return "steward.premium.monthly"
        }
    }

    var yearlyProductId: String? {
        switch self {
        case .free: return nil
        case .pro: return "steward.pro.yearly"
        case .premium: return "steward.premium.yearly"
        }
    }

    static let allProductIds: Set<String> = [
        "steward.pro.monthly",
        "steward.pro.yearly",
        "steward.premium.monthly",
        "steward.premium.yearly"
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
    case every1h = "Every hour"
    case every30m = "Every 30 min"
    case every15m = "Every 15 min"
    case every5m = "Every 5 min"

    var displayName: String { rawValue }

    /// Which tier is required for this frequency
    var requiredTier: SubscriptionTier {
        switch self {
        case .daily:
            return .free
        case .every12h, .every6h, .every1h:
            return .pro
        case .every30m, .every15m, .every5m:
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
        case .every1h: return 3600
        case .every30m: return 1800
        case .every15m: return 900
        case .every5m: return 300
        }
    }

    /// Create from the raw string stored on Watch
    static func from(string: String) -> CheckFrequency? {
        allCases.first { $0.rawValue == string }
    }

    /// Grouped by tier for display
    static var freeTier: [CheckFrequency] { [.daily] }
    static var proTier: [CheckFrequency] { [.every12h, .every6h, .every1h] }
    static var premiumTier: [CheckFrequency] { [.every30m, .every15m, .every5m] }
}
