import SwiftUI

enum TutorialStep {
    case firstWatch
    case notifications
    case phoneAdded
    case allComplete
}

struct TutorialChecklist: View {
    @Environment(NotificationManager.self) private var notificationManager
    @Environment(AuthManager.self) private var authManager

    @AppStorage("hasCompletedTutorialWatch") private var hasCompletedWatch = false
    @AppStorage("hasCompletedTutorialNotifs") private var hasCompletedNotifs = false
    @AppStorage("hasCompletedTutorialPhone") private var hasCompletedPhone = false
    @AppStorage("notifySMS") private var notifySMS = false

    var onOpenChat: () -> Void
    var onShowCongrats: (TutorialStep) -> Void
    var onDismiss: () -> Void

    // Brand colours
    private let deepForest = Color(hex: "0F2018")
    private let forestMid  = Color(hex: "1C3D2E")
    private let stewardGreen = Color(hex: "2A5C45")
    private let mint = Color(hex: "6EE7B7")
    private let cream = Color(hex: "F7F6F3")
    private let gold = Color(hex: "F59E0B")

    @State private var showDeniedHint = false
    @State private var showPhoneInput = false
    @State private var phoneInput = ""
    @State private var isSavingPhone = false

    private var hasPhone: Bool {
        if let p = authManager.effectivePhone, !p.isEmpty { return true }
        return false
    }

    private var totalSteps: Int { 4 }

    private var completedCount: Int {
        var count = 1 // Account created always done
        if hasCompletedWatch { count += 1 }
        if hasCompletedNotifs { count += 1 }
        if hasCompletedPhone || hasPhone { count += 1 }
        return count
    }

    private var allDone: Bool {
        hasCompletedWatch && hasCompletedNotifs && (hasCompletedPhone || hasPhone)
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
                Text("\(completedCount)/\(totalSteps)")
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
                // Step 1: Account created (always done)
                checklistRow(
                    done: true,
                    title: "Account created",
                    subtitle: "You're signed in and ready",
                    action: nil
                )

                // Step 2: Create first watch
                checklistRow(
                    done: hasCompletedWatch,
                    title: "Create your first watch",
                    subtitle: "Tell Steward what to monitor",
                    action: hasCompletedWatch ? nil : {
                        onOpenChat()
                    }
                )

                // Step 3: Enable notifications
                checklistRow(
                    done: hasCompletedNotifs,
                    title: "Enable notifications",
                    subtitle: hasCompletedNotifs ? "Push alerts are on" : (showDeniedHint ? "Tap to open Settings" : "Get alerted when things change"),
                    action: hasCompletedNotifs ? nil : {
                        Task {
                            let settings = await UNUserNotificationCenter.current().notificationSettings()
                            if settings.authorizationStatus == .denied {
                                if let url = URL(string: UIApplication.openSettingsURLString) {
                                    await UIApplication.shared.open(url)
                                }
                            } else {
                                await notificationManager.requestPermission()
                                if notificationManager.isPermissionGranted {
                                    hasCompletedNotifs = true
                                    if allDone {
                                        onShowCongrats(.allComplete)
                                    } else {
                                        onShowCongrats(.notifications)
                                    }
                                } else {
                                    withAnimation { showDeniedHint = true }
                                }
                            }
                        }
                    }
                )

                // Step 4: Add phone number (required, with "Recommended" badge)
                phoneNumberStep
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
        .onAppear {
            // Auto-complete phone step if user already has a phone number
            if hasPhone && !hasCompletedPhone {
                hasCompletedPhone = true
            }
        }
    }

    // MARK: - Phone Number Step

    private var phoneNumberStep: some View {
        let phoneDone = hasCompletedPhone || hasPhone

        return VStack(spacing: 0) {
            Button {
                if !phoneDone {
                    withAnimation(.spring(response: 0.3)) {
                        phoneInput = authManager.authPhone ?? ""
                        showPhoneInput = true
                    }
                }
            } label: {
                HStack(spacing: 14) {
                    // Circle indicator
                    ZStack {
                        Circle()
                            .stroke(mint.opacity(phoneDone ? 1.0 : 0.4), lineWidth: 2)
                            .frame(width: 24, height: 24)

                        if phoneDone {
                            Circle()
                                .fill(mint.opacity(0.15))
                                .frame(width: 24, height: 24)
                            Text("✓")
                                .font(.system(size: 11, weight: .bold))
                                .foregroundStyle(mint)
                        }
                    }
                    .animation(.spring(response: 0.3), value: phoneDone)

                    VStack(alignment: .leading, spacing: 2) {
                        HStack(spacing: 6) {
                            Text("Add your phone number")
                                .font(.system(size: 14))
                                .foregroundStyle(phoneDone ? cream.opacity(0.5) : cream)
                                .strikethrough(phoneDone, color: cream.opacity(0.3))

                            if !phoneDone {
                                Text("Recommended")
                                    .font(.system(size: 9, weight: .bold))
                                    .foregroundStyle(deepForest)
                                    .padding(.horizontal, 6)
                                    .padding(.vertical, 2)
                                    .background(gold)
                                    .clipShape(Capsule())
                            }
                        }

                        Text(phoneDone ? "SMS alerts enabled" : "SMS is the fastest way to get alerts")
                            .font(.system(size: 11.5, weight: .light))
                            .foregroundStyle(cream.opacity(phoneDone ? 0.3 : 0.6))
                    }

                    Spacer()

                    if !phoneDone {
                        Image(systemName: "chevron.right")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundStyle(mint.opacity(0.5))
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 14)
                .background(.white.opacity(phoneDone ? 0.01 : 0.03))
                .overlay(
                    RoundedRectangle(cornerRadius: 14)
                        .stroke(.white.opacity(0.06), lineWidth: 1)
                )
                .clipShape(RoundedRectangle(cornerRadius: 14))
            }
            .buttonStyle(.plain)
            .disabled(phoneDone)

            // Inline phone input
            if showPhoneInput && !phoneDone {
                VStack(spacing: 8) {
                    HStack(spacing: 8) {
                        // Country code
                        Text("+1")
                            .font(Theme.body(13, weight: .medium))
                            .foregroundStyle(cream.opacity(0.6))
                            .padding(.horizontal, 10)
                            .padding(.vertical, 10)
                            .background(forestMid)
                            .clipShape(RoundedRectangle(cornerRadius: 10))

                        TextField("Phone number", text: $phoneInput)
                            .font(Theme.body(13))
                            .foregroundStyle(cream)
                            .textContentType(.telephoneNumber)
                            .keyboardType(.phonePad)
                            .padding(10)
                            .background(forestMid)
                            .clipShape(RoundedRectangle(cornerRadius: 10))

                        Button {
                            guard !phoneInput.isEmpty else { return }
                            isSavingPhone = true
                            Task {
                                let fullPhone = phoneInput.hasPrefix("+") ? phoneInput : "+1\(phoneInput.filter { $0.isNumber })"
                                await authManager.savePhoneNumber(fullPhone)
                                notifySMS = true
                                hasCompletedPhone = true
                                withAnimation {
                                    showPhoneInput = false
                                    isSavingPhone = false
                                }
                                if allDone {
                                    onShowCongrats(.allComplete)
                                } else {
                                    onShowCongrats(.phoneAdded)
                                }
                            }
                        } label: {
                            if isSavingPhone {
                                ProgressView()
                                    .tint(deepForest)
                                    .frame(width: 32, height: 32)
                            } else {
                                Image(systemName: "checkmark")
                                    .font(.system(size: 13, weight: .bold))
                                    .foregroundStyle(deepForest)
                                    .frame(width: 32, height: 32)
                                    .background(mint)
                                    .clipShape(Circle())
                            }
                        }
                        .disabled(phoneInput.isEmpty || isSavingPhone)
                    }

                    // Why SMS hint
                    HStack(spacing: 4) {
                        Image(systemName: "bolt.fill")
                            .font(.system(size: 9))
                            .foregroundStyle(gold)
                        Text("SMS alerts reach you even when you're away from your phone's notifications")
                            .font(.system(size: 10.5, weight: .light))
                            .foregroundStyle(cream.opacity(0.4))
                    }
                    .padding(.horizontal, 4)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .transition(.opacity.combined(with: .move(edge: .top)))
            }
        }
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
