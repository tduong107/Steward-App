import SwiftUI

struct SettingsScreen: View {
    @AppStorage("isDarkMode") private var isDarkMode = true
    @Environment(AuthManager.self) private var authManager
    @Environment(NotificationManager.self) private var notificationManager
    @Environment(SubscriptionManager.self) private var subscriptionManager

    private var currentTier: SubscriptionTier {
        subscriptionManager.currentTier
    }

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

                // Appearance
                sectionHeader("Appearance")
                settingsCard {
                    toggleRow(icon: "moon.fill", label: "Dark mode", isOn: $isDarkMode)
                }

                // Notifications
                sectionHeader("Notifications")
                settingsCard {
                    notificationToggle
                }

                // Account
                sectionHeader("Account")
                settingsCard {
                    accountRow
                    Divider().foregroundStyle(Theme.border).padding(.leading, 52)
                    planRow
                    Divider().foregroundStyle(Theme.border).padding(.leading, 52)
                    restorePurchasesRow
                    Divider().foregroundStyle(Theme.border).padding(.leading, 52)
                    privacyPolicyRow
                    Divider().foregroundStyle(Theme.border).padding(.leading, 52)
                    termsOfServiceRow
                }

                // Sign Out
                signOutButton
            }
        }
        .background(Theme.bg)
    }

    // MARK: - Notification Toggle (real permission request)

    private var notificationToggle: some View {
        HStack(spacing: 12) {
            Image(systemName: "bell")
                .font(.system(size: 16))
                .foregroundStyle(Theme.ink)
                .frame(width: 24)

            Text("Push notifications")
                .font(Theme.body(13))
                .foregroundStyle(Theme.ink)

            Spacer()

            Toggle("", isOn: Binding(
                get: { notificationManager.isPermissionGranted },
                set: { newValue in
                    if newValue {
                        Task {
                            await notificationManager.requestPermission()
                        }
                    } else {
                        // Can't programmatically disable — guide user to Settings
                        openAppSettings()
                    }
                }
            ))
            .labelsHidden()
            .tint(Theme.accent)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
    }

    private func openAppSettings() {
        if let settingsURL = URL(string: UIApplication.openSettingsURLString) {
            UIApplication.shared.open(settingsURL)
        }
    }

    // MARK: - Plan Row

    private var planRow: some View {
        Button {
            subscriptionManager.presentPaywall()
        } label: {
            HStack(spacing: 12) {
                Image(systemName: "sparkle")
                    .font(.system(size: 16))
                    .foregroundStyle(Theme.ink)
                    .frame(width: 24)

                Text("Plan")
                    .font(Theme.body(13))
                    .foregroundStyle(Theme.ink)

                Spacer()

                Text("Steward \(currentTier.displayName) · \(currentTier.price)")
                    .font(Theme.body(12, weight: .semibold))
                    .foregroundStyle(Theme.accent)

                Image(systemName: "chevron.right")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(Theme.borderMid)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
        }
        .buttonStyle(.plain)
    }

    // MARK: - Restore Purchases Row

    private var restorePurchasesRow: some View {
        Button {
            Task {
                await subscriptionManager.restorePurchases()
            }
        } label: {
            HStack(spacing: 12) {
                Image(systemName: "arrow.clockwise")
                    .font(.system(size: 16))
                    .foregroundStyle(Theme.ink)
                    .frame(width: 24)

                Text("Restore purchases")
                    .font(Theme.body(13))
                    .foregroundStyle(Theme.ink)

                Spacer()

                if subscriptionManager.isPurchasing {
                    ProgressView()
                        .controlSize(.small)
                } else {
                    Image(systemName: "chevron.right")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(Theme.borderMid)
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
        }
        .buttonStyle(.plain)
        .disabled(subscriptionManager.isPurchasing)
    }

    // MARK: - Privacy Policy Row

    private var privacyPolicyRow: some View {
        Link(destination: URL(string: "https://steward.app/privacy")!) {
            HStack(spacing: 12) {
                Image(systemName: "lock")
                    .font(.system(size: 16))
                    .foregroundStyle(Theme.ink)
                    .frame(width: 24)

                Text("Privacy Policy")
                    .font(Theme.body(13))
                    .foregroundStyle(Theme.ink)

                Spacer()

                Image(systemName: "arrow.up.right")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(Theme.borderMid)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
        }
    }

    // MARK: - Terms of Service Row

    private var termsOfServiceRow: some View {
        Link(destination: URL(string: "https://steward.app/terms")!) {
            HStack(spacing: 12) {
                Image(systemName: "doc.text")
                    .font(.system(size: 16))
                    .foregroundStyle(Theme.ink)
                    .frame(width: 24)

                Text("Terms of Service")
                    .font(Theme.body(13))
                    .foregroundStyle(Theme.ink)

                Spacer()

                Image(systemName: "arrow.up.right")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(Theme.borderMid)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
        }
    }

    // MARK: - Account Row

    private var accountRow: some View {
        HStack(spacing: 12) {
            Image(systemName: "person.crop.circle.fill")
                .font(.system(size: 16))
                .foregroundStyle(Theme.accent)
                .frame(width: 24)

            VStack(alignment: .leading, spacing: 2) {
                Text(authManager.displayName ?? "Steward User")
                    .font(Theme.body(13, weight: .medium))
                    .foregroundStyle(Theme.ink)

                Text("Apple ID account")
                    .font(Theme.body(11))
                    .foregroundStyle(Theme.inkLight)
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(Theme.borderMid)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
    }

    // MARK: - Sign Out Button

    private var signOutButton: some View {
        Button {
            Task {
                await authManager.signOut()
            }
        } label: {
            HStack(spacing: 12) {
                Image(systemName: "rectangle.portrait.and.arrow.right")
                    .font(.system(size: 16))
                    .foregroundStyle(Theme.red)
                    .frame(width: 24)

                Text("Sign Out")
                    .font(Theme.body(13, weight: .medium))
                    .foregroundStyle(Theme.red)

                Spacer()
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
            .background(Theme.bgCard)
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(Theme.border, lineWidth: 1)
            )
            .shadow(color: .black.opacity(0.04), radius: 8, y: 4)
        }
        .buttonStyle(.plain)
        .padding(.horizontal, 24)
        .padding(.bottom, 40)
    }

    // MARK: - Components

    private func sectionHeader(_ title: String) -> some View {
        Text(title.uppercased())
            .font(Theme.body(11, weight: .bold))
            .foregroundStyle(Theme.inkLight)
            .tracking(0.8)
            .padding(.horizontal, 24)
            .padding(.bottom, 8)
    }

    private func settingsCard<Content: View>(@ViewBuilder content: () -> Content) -> some View {
        VStack(spacing: 0) {
            content()
        }
        .background(Theme.bgCard)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Theme.border, lineWidth: 1)
        )
        .shadow(color: .black.opacity(0.04), radius: 8, y: 4)
        .padding(.horizontal, 24)
        .padding(.bottom, 22)
    }

    private func toggleRow(icon: String, label: String, isOn: Binding<Bool>) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 16))
                .foregroundStyle(Theme.ink)
                .frame(width: 24)

            Text(label)
                .font(Theme.body(13))
                .foregroundStyle(Theme.ink)

            Spacer()

            Toggle("", isOn: isOn)
                .labelsHidden()
                .tint(Theme.accent)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
    }

    private func valueRow(icon: String, label: String, value: String, highlight: Bool = false) -> some View {
        Button(action: {}) {
            HStack(spacing: 12) {
                Image(systemName: icon)
                    .font(.system(size: 16))
                    .foregroundStyle(Theme.ink)
                    .frame(width: 24)

                Text(label)
                    .font(Theme.body(13))
                    .foregroundStyle(Theme.ink)

                Spacer()

                if !value.isEmpty {
                    Text(value)
                        .font(Theme.body(12, weight: highlight ? .semibold : .regular))
                        .foregroundStyle(highlight ? Theme.accent : Theme.inkLight)
                }

                Image(systemName: "chevron.right")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(Theme.borderMid)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
        }
        .buttonStyle(.plain)
    }
}
