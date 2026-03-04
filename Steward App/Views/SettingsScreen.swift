import SwiftUI

struct SettingsScreen: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                // Header
                VStack(alignment: .leading, spacing: 4) {
                    Text("Settings")
                        .font(Theme.serif(22, weight: .bold))
                        .foregroundStyle(Theme.ink)

                    Text("Personalise how Steward serves you")
                        .font(Theme.body(13))
                        .foregroundStyle(Theme.inkLight)
                }
                .padding(.horizontal, 24)
                .padding(.top, 20)
                .padding(.bottom, 24)

                // Sections
                ForEach(sections, id: \.title) { section in
                    settingsSection(section)
                }
            }
        }
        .background(Theme.bg)
    }

    // MARK: - Section View

    private func settingsSection(_ section: SettingsSection) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(section.title.uppercased())
                .font(Theme.body(11, weight: .bold))
                .foregroundStyle(Theme.inkLight)
                .tracking(0.8)
                .padding(.horizontal, 24)

            VStack(spacing: 0) {
                ForEach(Array(section.items.enumerated()), id: \.element.label) { index, item in
                    Button(action: {}) {
                        HStack(spacing: 12) {
                            Image(systemName: item.icon)
                                .font(.system(size: 16))
                                .foregroundStyle(Theme.ink)
                                .frame(width: 24)

                            Text(item.label)
                                .font(Theme.body(13))
                                .foregroundStyle(Theme.ink)

                            Spacer()

                            if !item.value.isEmpty {
                                Text(item.value)
                                    .font(Theme.body(12, weight: item.highlight ? .semibold : .regular))
                                    .foregroundStyle(item.highlight ? Theme.accent : Theme.inkLight)
                            }

                            Image(systemName: "chevron.right")
                                .font(.system(size: 12, weight: .medium))
                                .foregroundStyle(Theme.borderMid)
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 14)
                    }
                    .buttonStyle(.plain)

                    if index < section.items.count - 1 {
                        Divider()
                            .foregroundStyle(Theme.border)
                            .padding(.leading, 52)
                    }
                }
            }
            .background(Theme.bgCard)
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(Theme.border, lineWidth: 1)
            )
            .shadow(color: .black.opacity(0.04), radius: 8, y: 4)
            .padding(.horizontal, 24)
        }
        .padding(.bottom, 22)
    }

    // MARK: - Data

    private var sections: [SettingsSection] {
        [
            SettingsSection(title: "AI Behaviour", items: [
                SettingsItem(icon: "sparkle", label: "Always confirm before acting", value: "On", highlight: true),
                SettingsItem(icon: "bolt", label: "AI confidence threshold", value: "High"),
                SettingsItem(icon: "brain", label: "Learning from my preferences", value: "On", highlight: true),
            ]),
            SettingsSection(title: "Notifications", items: [
                SettingsItem(icon: "bell", label: "Push notifications", value: "On"),
                SettingsItem(icon: "envelope", label: "Email digests", value: "Daily"),
                SettingsItem(icon: "moon", label: "Quiet hours", value: "11 pm – 7 am"),
            ]),
            SettingsSection(title: "Account", items: [
                SettingsItem(icon: "person", label: "Profile", value: "Alex Johnson"),
                SettingsItem(icon: "sparkle", label: "Plan", value: "Steward Pro", highlight: true),
                SettingsItem(icon: "lock", label: "Privacy & data", value: ""),
            ]),
        ]
    }
}

// MARK: - Supporting Types

private struct SettingsSection {
    let title: String
    let items: [SettingsItem]
}

private struct SettingsItem {
    let icon: String
    let label: String
    let value: String
    var highlight: Bool = false
}
