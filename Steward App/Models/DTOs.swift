import Foundation

// MARK: - Supabase Codable DTOs
// These map directly to Postgres table columns (snake_case via CodingKeys).

struct WatchDTO: Codable, Identifiable, Sendable {
    let id: UUID
    let userId: UUID
    var emoji: String
    var name: String
    var url: String
    var condition: String
    var actionLabel: String
    var actionType: String
    var status: String
    var checkFrequency: String
    var preferredCheckTime: String?
    var notifyChannels: String?
    var lastChecked: Date?
    var triggered: Bool
    var changeNote: String?
    var imageURL: String?
    var actionURL: String?
    var createdAt: Date

    // Cookie fields for auth-walled sites
    var siteCookies: String?
    var cookieDomain: String?
    var cookieStatus: String?

    // Multi-source search watch fields
    var watchMode: String
    var searchQuery: String?

    // Error tracking fields
    var consecutiveFailures: Int
    var lastError: String?
    var needsAttention: Bool

    // Alternative source suggestion
    var altSourceUrl: String?
    var altSourceDomain: String?
    var altSourcePrice: Double?
    var altSourceFoundAt: Date?

    // Action enhancement fields
    var couponCode: String?
    var autoAct: Bool
    var spendingLimit: Double?
    var notifyAnyPriceDrop: Bool

    // Affiliate tracking
    var affiliateNetwork: String?
    var affiliateUrl: String?
    var isAffiliated: Bool

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case emoji, name, url, condition
        case actionLabel = "action_label"
        case actionType = "action_type"
        case status
        case checkFrequency = "check_frequency"
        case preferredCheckTime = "preferred_check_time"
        case notifyChannels = "notify_channels"
        case lastChecked = "last_checked"
        case triggered
        case changeNote = "change_note"
        case imageURL = "image_url"
        case actionURL = "action_url"
        case createdAt = "created_at"
        case siteCookies = "site_cookies"
        case cookieDomain = "cookie_domain"
        case cookieStatus = "cookie_status"
        case watchMode = "watch_mode"
        case searchQuery = "search_query"
        case consecutiveFailures = "consecutive_failures"
        case lastError = "last_error"
        case needsAttention = "needs_attention"
        case altSourceUrl = "alt_source_url"
        case altSourceDomain = "alt_source_domain"
        case altSourcePrice = "alt_source_price"
        case altSourceFoundAt = "alt_source_found_at"
        case couponCode = "coupon_code"
        case autoAct = "auto_act"
        case spendingLimit = "spending_limit"
        case notifyAnyPriceDrop = "notify_any_price_drop"
        case affiliateNetwork = "affiliate_network"
        case affiliateUrl = "affiliate_url"
        case isAffiliated = "is_affiliated"
    }

    // Explicit memberwise init (required because we provide a custom Decodable init)
    init(id: UUID, userId: UUID, emoji: String, name: String, url: String,
         condition: String, actionLabel: String, actionType: String, status: String,
         checkFrequency: String, preferredCheckTime: String? = nil, notifyChannels: String? = nil,
         lastChecked: Date? = nil, triggered: Bool, changeNote: String? = nil,
         imageURL: String? = nil, actionURL: String? = nil, createdAt: Date,
         siteCookies: String? = nil, cookieDomain: String? = nil, cookieStatus: String? = nil,
         watchMode: String = "url", searchQuery: String? = nil,
         consecutiveFailures: Int = 0, lastError: String? = nil, needsAttention: Bool = false,
         altSourceUrl: String? = nil, altSourceDomain: String? = nil,
         altSourcePrice: Double? = nil, altSourceFoundAt: Date? = nil,
         couponCode: String? = nil, autoAct: Bool = false, spendingLimit: Double? = nil,
         notifyAnyPriceDrop: Bool = false,
         affiliateNetwork: String? = nil, affiliateUrl: String? = nil, isAffiliated: Bool = false) {
        self.id = id; self.userId = userId; self.emoji = emoji; self.name = name
        self.url = url; self.condition = condition; self.actionLabel = actionLabel
        self.actionType = actionType; self.status = status; self.checkFrequency = checkFrequency
        self.preferredCheckTime = preferredCheckTime; self.notifyChannels = notifyChannels
        self.lastChecked = lastChecked; self.triggered = triggered; self.changeNote = changeNote
        self.imageURL = imageURL; self.actionURL = actionURL; self.createdAt = createdAt
        self.siteCookies = siteCookies; self.cookieDomain = cookieDomain
        self.cookieStatus = cookieStatus; self.watchMode = watchMode
        self.searchQuery = searchQuery; self.consecutiveFailures = consecutiveFailures
        self.lastError = lastError; self.needsAttention = needsAttention
        self.altSourceUrl = altSourceUrl; self.altSourceDomain = altSourceDomain
        self.altSourcePrice = altSourcePrice; self.altSourceFoundAt = altSourceFoundAt
        self.couponCode = couponCode; self.autoAct = autoAct
        self.spendingLimit = spendingLimit; self.notifyAnyPriceDrop = notifyAnyPriceDrop
        self.affiliateNetwork = affiliateNetwork; self.affiliateUrl = affiliateUrl
        self.isAffiliated = isAffiliated
    }

    // Custom decoder: use decodeIfPresent with defaults for new columns
    // so the app doesn't crash if the DB migration hasn't been deployed yet.
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(UUID.self, forKey: .id)
        userId = try c.decode(UUID.self, forKey: .userId)
        emoji = try c.decode(String.self, forKey: .emoji)
        name = try c.decode(String.self, forKey: .name)
        url = try c.decode(String.self, forKey: .url)
        condition = try c.decode(String.self, forKey: .condition)
        actionLabel = try c.decode(String.self, forKey: .actionLabel)
        actionType = try c.decode(String.self, forKey: .actionType)
        status = try c.decode(String.self, forKey: .status)
        checkFrequency = try c.decode(String.self, forKey: .checkFrequency)
        preferredCheckTime = try c.decodeIfPresent(String.self, forKey: .preferredCheckTime)
        notifyChannels = try c.decodeIfPresent(String.self, forKey: .notifyChannels)
        lastChecked = try c.decodeIfPresent(Date.self, forKey: .lastChecked)
        triggered = try c.decode(Bool.self, forKey: .triggered)
        changeNote = try c.decodeIfPresent(String.self, forKey: .changeNote)
        imageURL = try c.decodeIfPresent(String.self, forKey: .imageURL)
        actionURL = try c.decodeIfPresent(String.self, forKey: .actionURL)
        createdAt = try c.decode(Date.self, forKey: .createdAt)
        siteCookies = try c.decodeIfPresent(String.self, forKey: .siteCookies)
        cookieDomain = try c.decodeIfPresent(String.self, forKey: .cookieDomain)
        cookieStatus = try c.decodeIfPresent(String.self, forKey: .cookieStatus)
        watchMode = try c.decodeIfPresent(String.self, forKey: .watchMode) ?? "url"
        searchQuery = try c.decodeIfPresent(String.self, forKey: .searchQuery)
        consecutiveFailures = try c.decodeIfPresent(Int.self, forKey: .consecutiveFailures) ?? 0
        lastError = try c.decodeIfPresent(String.self, forKey: .lastError)
        needsAttention = try c.decodeIfPresent(Bool.self, forKey: .needsAttention) ?? false
        altSourceUrl = try c.decodeIfPresent(String.self, forKey: .altSourceUrl)
        altSourceDomain = try c.decodeIfPresent(String.self, forKey: .altSourceDomain)
        altSourcePrice = try c.decodeIfPresent(Double.self, forKey: .altSourcePrice)
        altSourceFoundAt = try c.decodeIfPresent(Date.self, forKey: .altSourceFoundAt)
        couponCode = try c.decodeIfPresent(String.self, forKey: .couponCode)
        autoAct = try c.decodeIfPresent(Bool.self, forKey: .autoAct) ?? false
        spendingLimit = try c.decodeIfPresent(Double.self, forKey: .spendingLimit)
        notifyAnyPriceDrop = try c.decodeIfPresent(Bool.self, forKey: .notifyAnyPriceDrop) ?? false
        affiliateNetwork = try c.decodeIfPresent(String.self, forKey: .affiliateNetwork)
        affiliateUrl = try c.decodeIfPresent(String.self, forKey: .affiliateUrl)
        isAffiliated = try c.decodeIfPresent(Bool.self, forKey: .isAffiliated) ?? false
    }
}

struct ActivityDTO: Codable, Identifiable, Sendable {
    let id: UUID
    let userId: UUID
    var watchId: UUID?
    var icon: String
    var iconColorName: String
    var label: String
    var subtitle: String
    var createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case watchId = "watch_id"
        case icon
        case iconColorName = "icon_color_name"
        case label, subtitle
        case createdAt = "created_at"
    }
}

struct CheckResultDTO: Codable, Identifiable, Sendable {
    let id: UUID
    let watchId: UUID
    var resultData: ResultData?
    var changed: Bool
    var price: Double?
    var checkedAt: Date

    /// Convenience accessor for the text inside result_data
    var resultText: String { resultData?.text ?? "" }

    struct ResultData: Codable, Sendable {
        var text: String?
        var sources: [SourcePrice]?   // Multi-source price data for search watches
        var priceConfidence: String?  // "high", "medium", "low", or "none"
        var couponCodes: [String]?    // Detected promo/coupon codes on the page
        var holdAvailable: Bool?      // Whether fare/hotel hold is available
        var holdNote: String?         // Human-readable hold info (e.g., "Delta offers 24hr fare holds")

        enum CodingKeys: String, CodingKey {
            case text, sources
            case priceConfidence = "price_confidence"
            case couponCodes = "coupon_codes"
            case holdAvailable = "hold_available"
            case holdNote = "hold_note"
        }
    }

    /// A single store's price from a multi-source search result
    struct SourcePrice: Codable, Sendable {
        let title: String
        let url: String
        let source: String
        let price: Double
        let imageURL: String?
    }

    enum CodingKeys: String, CodingKey {
        case id
        case watchId = "watch_id"
        case resultData = "result_data"
        case changed
        case price
        case checkedAt = "checked_at"
    }
}

struct ProfileDTO: Codable, Sendable {
    let id: UUID
    var displayName: String?
    var deviceToken: String?
    var phoneNumber: String?
    var notificationEmail: String?
    var spendingLimit: Double?
    var autoActDefault: Bool?

    enum CodingKeys: String, CodingKey {
        case id
        case displayName = "display_name"
        case deviceToken = "device_token"
        case phoneNumber = "phone_number"
        case notificationEmail = "notification_email"
        case spendingLimit = "spending_limit"
        case autoActDefault = "auto_act_default"
    }
}
