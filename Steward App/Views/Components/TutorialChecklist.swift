import SwiftUI

enum TutorialStep {
    case firstWatch
    case notifications
    case allComplete
}

struct TutorialChecklist: View {
    @Environment(NotificationManager.self) private var notificationManager

    @AppStorage("hasCompletedTutorialWatch") private var hasCompletedWatch = false
    @AppStorage("hasCompletedTutorialNotifs") private var hasCompletedNotifs = false

    var onOpenChat: () -> Void
    var onShowCongrats: (TutorialStep) -> Void
    var onDismiss: () -> Void

    // Brand colours (matching OnboardingFlowB)
    private let deepForest = Color(hex: "0F2018")
    private let forestMid  = Color(hex: "1C3D2E")
    private let stewardGreen = Color(hex: "2A5C45")
    private let mint = Color(hex: "6EE7B7")
    private let cream = Color(hex: "F7F6F3")

    @State private var showDeniedHint = false

    private var completedCount: Int {
        var count = 1 // Account created always done
        if hasCompletedWatch { count += 1 }
        if hasCompletedNotifs { count += 1 }
        return count
    }

    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Text("Getting Started")
                    .font(Theme.serif(16, weight: .bold))
                    .foregroundStyle(cream)

                Spacer()

                // Progress pill
                Text("\(completedCount)/3")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(mint)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(mint.opacity(0.12))
                    .clipShape(Capsule())

                Button {
                    onDismiss()
                } label: {
                    Text("Skip")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(cream.opacity(0.4))
                }
                .padding(.leading, 8)
            }
            .padding(.horizontal, 18)
            .padding(.top, 18)
            .padding(.bottom, 14)

            // Checklist items
            VStack(spacing: 6) {
                checklistRow(
                    done: true,
                    title: "Account created",
                    subtitle: "You're signed in and ready",
                    action: nil
                )

                checklistRow(
                    done: hasCompletedWatch,
                    title: "Create your first watch",
                    subtitle: "Tell Steward what to monitor",
                    action: hasCompletedWatch ? nil : {
                        onOpenChat()
                    }
                )

                checklistRow(
                    done: hasCompletedNotifs,
                    title: "Enable notifications",
                    subtitle: hasCompletedNotifs ? "Get alerted when things change" : (showDeniedHint ? "Tap to open Settings" : "Get alerted when things change"),
                    action: hasCompletedNotifs ? nil : {
                        Task {
                            let settings = await UNUserNotificationCenter.current().notificationSettings()
                            if settings.authorizationStatus == .denied {
                                // Already denied — open Settings
                                if let url = URL(string: UIApplication.openSettingsURLString) {
                                    await UIApplication.shared.open(url)
                                }
                            } else {
                                await notificationManager.requestPermission()
                                if notificationManager.isPermissionGranted {
                                    hasCompletedNotifs = true
                                    onShowCongrats(hasCompletedWatch ? .allComplete : .notifications)
                                } else {
                                    withAnimation { showDeniedHint = true }
                                }
                            }
                        }
                    }
                )
            }
            .padding(.horizontal, 12)
            .padding(.bottom, 16)
        }
        .background(
            ZStack {
                deepForest
                RadialGradient(
                    colors: [stewardGreen.opacity(0.3), .clear],
                    center: .init(x: 0.8, y: 0.0),
                    startRadius: 0,
                    endRadius: 200
                )
            }
        )
        .clipShape(RoundedRectangle(cornerRadius: 20))
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(mint.opacity(0.15), lineWidth: 1)
        )
        .shadow(color: .black.opacity(0.15), radius: 16, y: 8)
    }

    // MARK: - Checklist Row

    private func checklistRow(done: Bool, title: String, subtitle: String, action: (() -> Void)?) -> some View {
        Button {
            action?()
        } label: {
            HStack(spacing: 14) {
                // Circle indicator
                ZStack {
                    Circle()
                        .stroke(mint.opacity(done ? 1.0 : 0.4), lineWidth: 2)
                        .frame(width: 24, height: 24)

                    if done {
                        Circle()
                            .fill(mint.opacity(0.15))
                            .frame(width: 24, height: 24)
                        Text("✓")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(mint)
                    }
                }
                .animation(.spring(response: 0.3), value: done)

                // Labels
                VStack(alignment: .leading, spacing: 1) {
                    Text(title)
                        .font(.system(size: 14))
                        .foregroundStyle(done ? cream.opacity(0.5) : cream)
                        .strikethrough(done, color: cream.opacity(0.3))

                    Text(subtitle)
                        .font(.system(size: 11.5, weight: .light))
                        .foregroundStyle(cream.opacity(done ? 0.3 : 0.6))
                }

                Spacer()

                // Chevron for actionable items
                if !done && action != nil {
                    Image(systemName: "chevron.right")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(mint.opacity(0.5))
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
            .background(.white.opacity(done ? 0.01 : 0.03))
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .stroke(.white.opacity(0.06), lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
        .buttonStyle(.plain)
        .disabled(done || action == nil)
    }
}
