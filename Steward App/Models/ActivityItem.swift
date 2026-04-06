import Foundation
import SwiftData
import SwiftUI

@Model
final class ActivityItem {
    var id: UUID
    var watchId: UUID?
    var icon: String
    var iconColorName: String
    var label: String
    var subtitle: String
    var time: String
    var createdAt: Date

    var iconColor: Color {
        switch iconColorName {
        case "accent": return Theme.accent
        case "blue": return Theme.blue
        case "red": return Theme.red
        case "gold": return Theme.gold
        case "inkLight": return Theme.inkLight
        default: return Theme.inkLight
        }
    }

    init(
        icon: String,
        iconColorName: String,
        label: String,
        subtitle: String,
        time: String,
        watchId: UUID? = nil
    ) {
        self.id = UUID()
        self.watchId = watchId
        self.icon = icon
        self.iconColorName = iconColorName
        self.label = label
        self.subtitle = subtitle
        self.time = time
        self.createdAt = Date()
    }
}

#if DEBUG
// MARK: - Sample Data (for previews only)
extension ActivityItem {
    static func createSamples() -> [ActivityItem] {
        [
            ActivityItem(icon: "checkmark", iconColorName: "accent", label: "Test drive form submitted", subtitle: "Tesla Model Y · AI acted", time: "Just now"),
            ActivityItem(icon: "checkmark", iconColorName: "accent", label: "Cart updated with Air Jordan 1s", subtitle: "Nike · AI acted", time: "Yesterday"),
            ActivityItem(icon: "eye", iconColorName: "inkLight", label: "Malibu listing checked", subtitle: "No change", time: "12 min ago"),
            ActivityItem(icon: "checkmark", iconColorName: "accent", label: "Dentist appointment booked", subtitle: "Zocdoc · AI acted", time: "3 days ago"),
            ActivityItem(icon: "envelope", iconColorName: "blue", label: "Email sent to team", subtitle: "WWDC tickets available", time: "1 week ago"),
        ]
    }
}
#endif
