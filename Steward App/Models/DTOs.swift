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
    var lastChecked: Date?
    var triggered: Bool
    var changeNote: String?
    var imageURL: String?
    var createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case emoji, name, url, condition
        case actionLabel = "action_label"
        case actionType = "action_type"
        case status
        case checkFrequency = "check_frequency"
        case lastChecked = "last_checked"
        case triggered
        case changeNote = "change_note"
        case imageURL = "image_url"
        case createdAt = "created_at"
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

    enum CodingKeys: String, CodingKey {
        case id
        case displayName = "display_name"
        case deviceToken = "device_token"
    }
}
