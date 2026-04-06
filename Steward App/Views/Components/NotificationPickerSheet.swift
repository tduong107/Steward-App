import SwiftUI

struct NotificationPickerSheet: View {
    @Binding var notifyChannels: String
    var watch: Watch? = nil
    var onSaveWatch: (() -> Void)? = nil
    @Environment(\.dismiss) private var dismiss
    @Environment(AuthManager.self) private var authManager

    // Parse channels from comma-separated string
    private var selectedChannels: Set<String> {
        Set(notifyChannels.split(separator: ",").map { String($0) })
    }

    private var hasEmail: Bool {
        authManager.effectiveEmail != nil
    }

    private var hasPhone: Bool {
        authManager.effectivePhone != nil
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

                        if hasEmail {
                            Divider()
                                .padding(.leading, 56)

                            channelRow(
                                channel: "email",
                                icon: "envelope.fill",
                                title: "Email",
                                subtitle: authManager.effectiveEmail ?? "Receive a detailed email alert"
                            )
                        }

                        if hasPhone {
                            Divider()
                                .padding(.leading, 56)

                            channelRow(
                                channel: "sms",
                                icon: "message.fill",
                                title: "SMS",
                                subtitle: authManager.effectivePhone ?? "Get a text message when triggered"
                            )
                        }
                    }
                    .padding(.horizontal, 24)

                    // Price drop notification toggle (only for price watches)
                    if let watch, watch.actionType == .price {
                        VStack(spacing: 0) {
                            Divider().padding(.horizontal, 24).padding(.vertical, 8)

                            Toggle(isOn: Binding(
                                get: { watch.notifyAnyPriceDrop },
                                set: { newValue in
                                    watch.notifyAnyPriceDrop = newValue
                                    onSaveWatch?()
                                }
                            )) {
                                HStack(spacing: 12) {
                                    Image(systemName: "arrow.down.circle.fill")
                                        .font(.system(size: 16))
                                        .foregroundStyle(Theme.accent)
                                        .frame(width: 32, height: 32)
                                        .background(Theme.accentLight)
                                        .clipShape(RoundedRectangle(cornerRadius: 8))

                                    VStack(alignment: .leading, spacing: 2) {
                                        Text("Notify on any price drop")
                                            .font(Theme.body(14, weight: .medium))
                                            .foregroundStyle(Theme.ink)

                                        Text("Alert even for small decreases")
                                            .font(Theme.body(11))
                                            .foregroundStyle(Theme.inkLight)
                                    }
                                }
                            }
                            .tint(Theme.accent)
                            .padding(.horizontal, 24)
                        }
                    }

                    if !hasEmail || !hasPhone {
                        HStack(spacing: 8) {
                            Image(systemName: "info.circle")
                                .font(.system(size: 13))
                                .foregroundStyle(Theme.inkLight)

                            Text("Add your \(!hasEmail && !hasPhone ? "email and phone number" : !hasEmail ? "email" : "phone number") in Settings to unlock more notification channels.")
                                .font(Theme.body(11))
                                .foregroundStyle(Theme.inkLight)
                        }
                        .padding(.horizontal, 24)
                        .padding(.top, 16)
                    }

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
                    .padding(.top, hasEmail || hasPhone ? 16 : 8)
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
