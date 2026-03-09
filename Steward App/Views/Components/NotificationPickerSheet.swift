import SwiftUI

struct NotificationPickerSheet: View {
    @Binding var notifyChannels: String
    @Environment(\.dismiss) private var dismiss

    // Parse channels from comma-separated string
    private var selectedChannels: Set<String> {
        Set(notifyChannels.split(separator: ",").map { String($0) })
    }

    private func toggle(_ channel: String) {
        var channels = selectedChannels
        if channels.contains(channel) {
            channels.remove(channel)
            // Ensure at least one channel remains
            if channels.isEmpty { return }
        } else {
            channels.insert(channel)
        }
        notifyChannels = channels.sorted().joined(separator: ",")
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Notification Channels")
                            .font(Theme.serif(20, weight: .bold))
                            .foregroundStyle(Theme.ink)

                        Text("Choose how you'd like to be notified when this watch triggers.")
                            .font(Theme.body(13))
                            .foregroundStyle(Theme.inkLight)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .padding(.horizontal, 24)
                    .padding(.top, 16)
                    .padding(.bottom, 20)

                    // Channel options
                    VStack(spacing: 0) {
                        channelRow(
                            channel: "push",
                            icon: "bell.fill",
                            title: "Push Notification",
                            subtitle: "Get notified instantly on your device"
                        )

                        Divider()
                            .padding(.leading, 56)

                        channelRow(
                            channel: "email",
                            icon: "envelope.fill",
                            title: "Email",
                            subtitle: "Receive a detailed email alert"
                        )
                    }
                    .padding(.horizontal, 24)

                    // Info
                    HStack(spacing: 8) {
                        Image(systemName: "info.circle")
                            .font(.system(size: 13))
                            .foregroundStyle(Theme.inkLight)

                        Text("At least one notification channel must be selected.")
                            .font(Theme.body(11))
                            .foregroundStyle(Theme.inkLight)
                    }
                    .padding(.horizontal, 24)
                    .padding(.top, 16)
                }
                .padding(.bottom, 24)
            }
            .background(Theme.bg)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                        .font(Theme.body(14, weight: .medium))
                        .foregroundStyle(Theme.accent)
                }
            }
        }
    }

    private func channelRow(channel: String, icon: String, title: String, subtitle: String) -> some View {
        let isSelected = selectedChannels.contains(channel)

        return Button {
            withAnimation(.spring(response: 0.2)) {
                toggle(channel)
            }
        } label: {
            HStack(spacing: 12) {
                Image(systemName: icon)
                    .font(.system(size: 16))
                    .foregroundStyle(isSelected ? Theme.accent : Theme.inkLight)
                    .frame(width: 32, height: 32)
                    .background(isSelected ? Theme.accentLight : Theme.bgDeep)
                    .clipShape(RoundedRectangle(cornerRadius: 8))

                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(Theme.body(14, weight: .medium))
                        .foregroundStyle(Theme.ink)

                    Text(subtitle)
                        .font(Theme.body(11))
                        .foregroundStyle(Theme.inkLight)
                }

                Spacer()

                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                    .font(.system(size: 20))
                    .foregroundStyle(isSelected ? Theme.accent : Theme.borderMid)
            }
            .padding(.vertical, 14)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
}
