import Foundation
import SwiftUI

struct ActivityItem: Identifiable {
    let id: UUID
    let icon: String
    let iconColor: Color
    let label: String
    let subtitle: String
    let time: String

    init(
        id: UUID = UUID(),
        icon: String,
        iconColor: Color,
        label: String,
        subtitle: String,
        time: String
    ) {
        self.id = id
        self.icon = icon
        self.iconColor = iconColor
        self.label = label
        self.subtitle = subtitle
        self.time = time
    }
}

extension ActivityItem {
    static let samples: [ActivityItem] = [
        ActivityItem(icon: "checkmark", iconColor: Theme.accent, label: "Test drive form submitted", subtitle: "Tesla Model Y · AI acted", time: "Just now"),
        ActivityItem(icon: "checkmark", iconColor: Theme.accent, label: "Cart updated with Air Jordan 1s", subtitle: "Nike · AI acted", time: "Yesterday"),
        ActivityItem(icon: "eye", iconColor: Theme.inkLight, label: "Malibu listing checked", subtitle: "No change", time: "12 min ago"),
        ActivityItem(icon: "checkmark", iconColor: Theme.accent, label: "Dentist appointment booked", subtitle: "Zocdoc · AI acted", time: "3 days ago"),
        ActivityItem(icon: "envelope", iconColor: Theme.blue, label: "Email sent to team", subtitle: "WWDC tickets available", time: "1 week ago"),
    ]
}
