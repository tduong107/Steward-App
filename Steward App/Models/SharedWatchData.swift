import Foundation

/// Data returned by the get-shared-watch edge function
struct SharedWatchData: Codable {
    let shareId: String
    let emoji: String
    let name: String
    let url: String
    let condition: String
    let actionLabel: String
    let actionType: String
    let checkFrequency: String
    let imageUrl: String?
    let sharedByName: String

    enum CodingKeys: String, CodingKey {
        case shareId = "share_id"
        case emoji
        case name
        case url
        case condition
        case actionLabel = "action_label"
        case actionType = "action_type"
        case checkFrequency = "check_frequency"
        case imageUrl = "image_url"
        case sharedByName = "shared_by_name"
    }

    /// Convert to a Watch model for adding to the user's watches
    func toWatch() -> Watch {
        let type = ActionType(rawValue: actionType) ?? .notify
        return Watch(
            emoji: emoji,
            name: name,
            url: url,
            condition: condition,
            actionLabel: actionLabel,
            actionType: type,
            checkFrequency: checkFrequency,
            imageURL: imageUrl
        )
    }
}
