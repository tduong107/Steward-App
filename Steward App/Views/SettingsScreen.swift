import SwiftUI

struct SettingsScreen: View {
    @AppStorage("isDarkMode") private var isDarkMode = false
    @AppStorage("hasSeenOnboardingB") private var hasSeenOnboardingB = true
    @Environment(AuthManager.self) private var authManager
    @Environment(NotificationManager.self) private var notificationManager
    @Environment(SubscriptionManager.self) private var subscriptionManager
    @State private var showDeleteConfirmation = false
    @State private var isDeleting = false
    @AppStorage("notifyEmail") private var notifyEmail = false
    @AppStorage("notifySMS") private var notifySMS = false
    @AppStorage("notifyAnyPriceDrop") private var notifyAnyPriceDrop = false
    @AppStorage("currencyCode") private var currencyCode = "USD"
    @AppStorage("appLanguage") private var appLanguage = "en"
    @State private var showEmailEntry = false
    @State private var showPhoneEntry = false
    @State private var emailInput = ""
    @State private var phoneInput = ""

    private var hasEmail: Bool {
        if let email = authManager.notificationEmail, !email.isEmpty { return true }
        return false
    }

    private var hasPhone: Bool {
        if let phone = authManager.phoneNumber, !phone.isEmpty { return true }
        return false
    }

    private var currentTier: SubscriptionTier {
        subscriptionManager.currentTier
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                // Header
                VStack(alignment: .leading, spacing: 4) {
                    Text(L10n.t("settings.title"))
                        .font(Theme.serif(22, weight: .bold))
                        .foregroundStyle(Theme.ink)

                    Text(L10n.t("settings.subtitle"))
                        .font(Theme.body(13))
                        .foregroundStyle(Theme.inkLight)
                }
                .padding(.horizontal, 24)
                .padding(.top, 20)
                .padding(.bottom, 24)

                // Appearance
                sectionHeader(L10n.t("settings.appearance"))
                settingsCard {
                    toggleRow(icon: "moon.fill", label: "Dark mode", isOn: $isDarkMode)
                    Divider().foregroundStyle(Theme.border).padding(.leading, 52)
                    languageRow
                }

                // Notifications
                sectionHeader(L10n.t("settings.notifications"))
                settingsCard {
                    notificationToggle
                    Divider().foregroundStyle(Theme.border).padding(.leading, 52)
                    emailToggle
                    Divider().foregroundStyle(Theme.border).padding(.leading, 52)
                    smsToggle
                    Divider().foregroundStyle(Theme.border).padding(.leading, 52)
                    priceDropToggle
                }

                // Account
                sectionHeader(L10n.t("settings.account"))
                settingsCard {
                    accountRow
                    Divider().foregroundStyle(Theme.border).padding(.leading, 52)
                    planRow
                    Divider().foregroundStyle(Theme.border).padding(.leading, 52)
                    restorePurchasesRow
                    Divider().foregroundStyle(Theme.border).padding(.leading, 52)
                    replayTourRow
                    Divider().foregroundStyle(Theme.border).padding(.leading, 52)
                    privacyPolicyRow
                    Divider().foregroundStyle(Theme.border).padding(.leading, 52)
                    termsOfServiceRow
                }

                // Support
                sectionHeader(L10n.t("settings.support"))
                settingsCard {
                    sendFeedbackRow
                    Divider().foregroundStyle(Theme.border).padding(.leading, 52)
                    getHelpRow
                }

                // Sign Out & Delete
                signOutButton
                deleteAccountButton
            }
        }
        .background(Theme.bg)
        .onAppear {
            // Fix: disable email/SMS toggles if user hasn't actually provided contact info
            if !hasEmail { notifyEmail = false }
            if !hasPhone { notifySMS = false }
        }
    }

    // MARK: - Notification Toggle (real permission request)

    private var notificationToggle: some View {
        HStack(spacing: 12) {
            Image(systemName: "bell")
                .font(.system(size: 16))
                .foregroundStyle(Theme.ink)
                .frame(width: 24)

            Text(L10n.t("settings.push"))
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

    // MARK: - Email Toggle

    private var emailToggle: some View {
        VStack(spacing: 0) {
            HStack(spacing: 12) {
                Image(systemName: "envelope")
                    .font(.system(size: 16))
                    .foregroundStyle(Theme.ink)
                    .frame(width: 24)

                VStack(alignment: .leading, spacing: 2) {
                    Text(L10n.t("settings.email"))
                        .font(Theme.body(13))
                        .foregroundStyle(Theme.ink)

                    if notifyEmail, hasEmail {
                        Text(authManager.notificationEmail ?? "")
                            .font(Theme.body(11))
                            .foregroundStyle(Theme.inkLight)
                    }
                }

                Spacer()

                Toggle("", isOn: Binding(
                    get: { notifyEmail },
                    set: { newValue in
                        if newValue {
                            if hasEmail {
                                notifyEmail = true
                            } else {
                                showEmailEntry = true
                            }
                        } else {
                            notifyEmail = false
                        }
                    }
                ))
                .labelsHidden()
                .tint(Theme.accent)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
        }
        .sheet(isPresented: $showEmailEntry) {
            emailEntrySheet
                .presentationDetents([.height(340)])
                .presentationDragIndicator(.visible)
        }
    }

    // MARK: - SMS Toggle

    private var smsToggle: some View {
        VStack(spacing: 0) {
            HStack(spacing: 12) {
                Image(systemName: "message")
                    .font(.system(size: 16))
                    .foregroundStyle(Theme.ink)
                    .frame(width: 24)

                VStack(alignment: .leading, spacing: 2) {
                    Text(L10n.t("settings.sms"))
                        .font(Theme.body(13))
                        .foregroundStyle(Theme.ink)

                    if notifySMS, hasPhone {
                        Text(authManager.phoneNumber ?? "")
                            .font(Theme.body(11))
                            .foregroundStyle(Theme.inkLight)
                    }
                }

                Spacer()

                Toggle("", isOn: Binding(
                    get: { notifySMS },
                    set: { newValue in
                        if newValue {
                            if hasPhone {
                                notifySMS = true
                            } else {
                                showPhoneEntry = true
                            }
                        } else {
                            notifySMS = false
                        }
                    }
                ))
                .labelsHidden()
                .tint(Theme.accent)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
        }
        .sheet(isPresented: $showPhoneEntry) {
            phoneEntrySheet
                .presentationDetents([.height(400)])
                .presentationDragIndicator(.visible)
        }
    }

    // MARK: - Price Drop Toggle

    private var priceDropToggle: some View {
        HStack(spacing: 12) {
            Image(systemName: "arrow.down.circle")
                .font(.system(size: 16))
                .foregroundStyle(Theme.ink)
                .frame(width: 24)

            VStack(alignment: .leading, spacing: 2) {
                Text("Notify on any price drop")
                    .font(Theme.body(13))
                    .foregroundStyle(Theme.ink)

                Text("Alert when any price watch decreases, not just your target")
                    .font(Theme.body(11))
                    .foregroundStyle(Theme.inkLight)
            }

            Spacer()

            Toggle("", isOn: $notifyAnyPriceDrop)
                .labelsHidden()
                .tint(Theme.accent)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
    }

    // MARK: - Language Row

    private var languageRow: some View {
        let currentLang = AppLanguage(rawValue: appLanguage) ?? .english

        return Menu {
            ForEach(AppLanguage.allCases) { lang in
                Button {
                    appLanguage = lang.rawValue
                } label: {
                    HStack {
                        Text(lang.displayName)
                        if lang == currentLang {
                            Image(systemName: "checkmark")
                        }
                    }
                }
            }
        } label: {
            HStack(spacing: 12) {
                Image(systemName: "globe")
                    .font(.system(size: 16))
                    .foregroundStyle(Theme.ink)
                    .frame(width: 24)

                Text(L10n.t("settings.language"))
                    .font(Theme.body(13))
                    .foregroundStyle(Theme.ink)

                Spacer()

                Text(currentLang.displayName)
                    .font(Theme.body(12, weight: .semibold))
                    .foregroundStyle(Theme.accent)

                Image(systemName: "chevron.up.chevron.down")
                    .font(.system(size: 10, weight: .medium))
                    .foregroundStyle(Theme.borderMid)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
        }
        .buttonStyle(.plain)
    }

    // MARK: - Currency Row

    private var currencyRow: some View {
        Menu {
            ForEach(SupportedCurrency.allCases) { currency in
                Button {
                    currencyCode = currency.code
                } label: {
                    HStack {
                        Text("\(currency.code) — \(currency.name)")
                        if currency.code == currencyCode {
                            Image(systemName: "checkmark")
                        }
                    }
                }
            }
        } label: {
            HStack(spacing: 12) {
                Image(systemName: "dollarsign.circle")
                    .font(.system(size: 16))
                    .foregroundStyle(Theme.ink)
                    .frame(width: 24)

                Text("Currency")
                    .font(Theme.body(13))
                    .foregroundStyle(Theme.ink)

                Spacer()

                Text(currencyCode)
                    .font(Theme.body(12, weight: .semibold))
                    .foregroundStyle(Theme.accent)

                Image(systemName: "chevron.up.chevron.down")
                    .font(.system(size: 10, weight: .medium))
                    .foregroundStyle(Theme.borderMid)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
        }
        .buttonStyle(.plain)
    }

    // MARK: - Email Entry Sheet

    private var emailEntrySheet: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 16) {
                Text("Add your email")
                    .font(Theme.serif(20, weight: .bold))
                    .foregroundStyle(Theme.ink)

                Text("We'll send watch alerts to this email address.")
                    .font(Theme.body(13))
                    .foregroundStyle(Theme.inkLight)

                TextField("you@example.com", text: $emailInput)
                    .font(Theme.body(15))
                    .keyboardType(.emailAddress)
                    .textContentType(.emailAddress)
                    .autocorrectionDisabled()
                    .textInputAutocapitalization(.never)
                    .padding(14)
                    .background(Theme.bgDeep)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Theme.border, lineWidth: 1)
                    )

                Button {
                    let trimmed = emailInput.trimmingCharacters(in: .whitespacesAndNewlines)
                    Task {
                        await authManager.saveNotificationEmail(trimmed)
                        notifyEmail = true
                        showEmailEntry = false
                        emailInput = ""
                    }
                } label: {
                    Text("Save & enable email alerts")
                        .font(Theme.body(14, weight: .semibold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(isValidEmail(emailInput) ? Theme.accent : Theme.accent.opacity(0.3))
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                }
                .disabled(!isValidEmail(emailInput))

                Text("By saving, you agree to receive watch alert emails from Steward. You can turn this off anytime in Settings.")
                    .font(Theme.body(11))
                    .foregroundStyle(Theme.inkLight)
                    .lineSpacing(2)

                Spacer()
            }
            .padding(24)
            .background(Theme.bg)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { showEmailEntry = false }
                        .font(Theme.body(14))
                        .foregroundStyle(Theme.inkMid)
                }
            }
        }
    }

    // MARK: - Phone Entry Sheet

    private var phoneEntrySheet: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 16) {
                Text("Add your phone number")
                    .font(Theme.serif(20, weight: .bold))
                    .foregroundStyle(Theme.ink)

                Text("We'll send text alerts to this number.")
                    .font(Theme.body(13))
                    .foregroundStyle(Theme.inkLight)

                TextField("(555) 123-4567", text: $phoneInput)
                    .font(Theme.body(15))
                    .keyboardType(.phonePad)
                    .textContentType(.telephoneNumber)
                    .padding(14)
                    .background(Theme.bgDeep)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Theme.border, lineWidth: 1)
                    )

                Button {
                    let trimmed = phoneInput.trimmingCharacters(in: .whitespacesAndNewlines)
                    Task {
                        await authManager.savePhoneNumber(trimmed)
                        notifySMS = true
                        showPhoneEntry = false
                        phoneInput = ""
                    }
                } label: {
                    Text("Agree & enable SMS alerts")
                        .font(Theme.body(14, weight: .semibold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(isValidPhone(phoneInput) ? Theme.accent : Theme.accent.opacity(0.3))
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                }
                .disabled(!isValidPhone(phoneInput))

                Text("By enabling, you consent to receive automated SMS watch alerts from Steward at this number. Msg frequency varies. Msg & data rates may apply. Reply STOP to opt out. See our [Privacy Policy](https://www.joinsteward.app/privacy) and [Terms](https://www.apple.com/legal/internet-services/itunes/dev/stdeula/).")
                    .font(Theme.body(11))
                    .foregroundStyle(Theme.inkLight)
                    .tint(Theme.accent)
                    .lineSpacing(2)

                Spacer()
            }
            .padding(24)
            .background(Theme.bg)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { showPhoneEntry = false }
                        .font(Theme.body(14))
                        .foregroundStyle(Theme.inkMid)
                }
            }
        }
    }

    // MARK: - Validation Helpers

    private func isValidEmail(_ email: String) -> Bool {
        let trimmed = email.trimmingCharacters(in: .whitespacesAndNewlines)
        let regex = #"^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$"#
        return trimmed.range(of: regex, options: .regularExpression) != nil
    }

    private func isValidPhone(_ phone: String) -> Bool {
        let digits = phone.filter { $0.isNumber }
        return digits.count >= 10
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

                VStack(alignment: .leading, spacing: 2) {
                    Text(L10n.t("settings.plan"))
                        .font(Theme.body(13))
                        .foregroundStyle(Theme.ink)

                    // Show pending downgrade notice
                    if let pendingTier = subscriptionManager.pendingDowngradeTier,
                       let pendingDate = subscriptionManager.pendingDowngradeDate {
                        let dateStr = pendingDate.formatted(.dateTime.month(.abbreviated).day())
                        if pendingTier == .free {
                            Text("Cancels on \(dateStr)")
                                .font(Theme.body(10))
                                .foregroundStyle(.orange)
                        } else {
                            Text("Changing to \(pendingTier.displayName) on \(dateStr)")
                                .font(Theme.body(10))
                                .foregroundStyle(.orange)
                        }
                    }
                }

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

                Text(L10n.t("settings.restore"))
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

    // MARK: - Replay Tour Row

    private var replayTourRow: some View {
        Button {
            hasSeenOnboardingB = false
        } label: {
            HStack(spacing: 12) {
                Image(systemName: "arrow.counterclockwise.circle")
                    .font(.system(size: 16))
                    .foregroundStyle(Theme.ink)
                    .frame(width: 24)

                Text(L10n.t("settings.replay_tour"))
                    .font(Theme.body(13))
                    .foregroundStyle(Theme.ink)

                Spacer()

                Image(systemName: "chevron.right")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(Theme.borderMid)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
        }
        .buttonStyle(.plain)
    }

    // MARK: - Privacy Policy Row

    private var privacyPolicyRow: some View {
        Link(destination: URL(string: "https://www.joinsteward.app/privacy")!) {
            HStack(spacing: 12) {
                Image(systemName: "lock")
                    .font(.system(size: 16))
                    .foregroundStyle(Theme.ink)
                    .frame(width: 24)

                Text(L10n.t("settings.privacy"))
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
        Link(destination: URL(string: "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/")!) {
            HStack(spacing: 12) {
                Image(systemName: "doc.text")
                    .font(.system(size: 16))
                    .foregroundStyle(Theme.ink)
                    .frame(width: 24)

                Text(L10n.t("settings.terms"))
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

    // MARK: - Support Rows

    private var sendFeedbackRow: some View {
        Link(destination: URL(string: "mailto:hello@joinsteward.app?subject=Steward%20Feedback")!) {
            HStack(spacing: 12) {
                Image(systemName: "bubble.left.and.text.bubble.right")
                    .font(.system(size: 16))
                    .foregroundStyle(Theme.ink)
                    .frame(width: 24)

                VStack(alignment: .leading, spacing: 2) {
                    Text(L10n.t("settings.feedback"))
                        .font(Theme.body(13))
                        .foregroundStyle(Theme.ink)
                    Text("Tell us what you think or suggest a feature")
                        .font(Theme.body(11))
                        .foregroundStyle(Theme.inkLight)
                }

                Spacer()

                Image(systemName: "arrow.up.right")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(Theme.borderMid)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
        }
    }

    private var getHelpRow: some View {
        Link(destination: URL(string: "mailto:hello@joinsteward.app?subject=Steward%20Help%20Request")!) {
            HStack(spacing: 12) {
                Image(systemName: "questionmark.circle")
                    .font(.system(size: 16))
                    .foregroundStyle(Theme.ink)
                    .frame(width: 24)

                VStack(alignment: .leading, spacing: 2) {
                    Text(L10n.t("settings.help"))
                        .font(Theme.body(13))
                        .foregroundStyle(Theme.ink)
                    Text("Contact us for support")
                        .font(Theme.body(11))
                        .foregroundStyle(Theme.inkLight)
                }

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

    @State private var showAccountDetail = false

    private var accountRow: some View {
        Button {
            showAccountDetail = true
        } label: {
            HStack(spacing: 12) {
                Image(systemName: "person.crop.circle.fill")
                    .font(.system(size: 16))
                    .foregroundStyle(Theme.accent)
                    .frame(width: 24)

                VStack(alignment: .leading, spacing: 2) {
                    Text(authManager.displayName ?? "Steward User")
                        .font(Theme.body(13, weight: .medium))
                        .foregroundStyle(Theme.ink)

                    if let email = authManager.effectiveEmail, !email.isEmpty {
                        Text(email)
                            .font(Theme.body(11))
                            .foregroundStyle(Theme.inkLight)
                    } else if let phone = authManager.effectivePhone, !phone.isEmpty {
                        Text(phone)
                            .font(Theme.body(11))
                            .foregroundStyle(Theme.inkLight)
                    } else {
                        Text(L10n.t("settings.apple_id"))
                            .font(Theme.body(11))
                            .foregroundStyle(Theme.inkLight)
                    }
                }

                Spacer()

                Image(systemName: "chevron.right")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(Theme.borderMid)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
        }
        .buttonStyle(.plain)
        .sheet(isPresented: $showAccountDetail) {
            AccountDetailSheet()
                .environment(authManager)
                .environment(subscriptionManager)
        }
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

                Text(L10n.t("settings.sign_out"))
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
        .padding(.bottom, 12)
    }

    // MARK: - Delete Account

    private var deleteAccountButton: some View {
        Button {
            showDeleteConfirmation = true
        } label: {
            HStack(spacing: 12) {
                Image(systemName: "trash")
                    .font(.system(size: 16))
                    .foregroundStyle(Theme.red.opacity(0.6))
                    .frame(width: 24)

                Text(L10n.t("settings.delete_account"))
                    .font(Theme.body(13))
                    .foregroundStyle(Theme.red.opacity(0.6))

                Spacer()

                if isDeleting {
                    ProgressView()
                        .controlSize(.small)
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
        }
        .buttonStyle(.plain)
        .padding(.horizontal, 24)
        .padding(.bottom, 40)
        .alert("Delete Account", isPresented: $showDeleteConfirmation) {
            Button("Cancel", role: .cancel) {}
            Button("Delete", role: .destructive) {
                isDeleting = true
                Task {
                    try? await authManager.deleteAccount()
                    isDeleting = false
                }
            }
        } message: {
            Text("This will permanently delete your account, all watches, and activity history. This action cannot be undone.")
        }
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

// MARK: - Supported Currencies

enum SupportedCurrency: String, CaseIterable, Identifiable {
    case usd, eur, krw, cny, vnd, irr

    var id: String { code }

    var code: String {
        switch self {
        case .usd: return "USD"
        case .eur: return "EUR"
        case .krw: return "KRW"
        case .cny: return "CNY"
        case .vnd: return "VND"
        case .irr: return "IRR"
        }
    }

    var name: String {
        switch self {
        case .usd: return "US Dollar"
        case .eur: return "Euro"
        case .krw: return "Korean Won"
        case .cny: return "Chinese Yuan"
        case .vnd: return "Vietnamese Dong"
        case .irr: return "Iranian Rial"
        }
    }

    var flag: String {
        switch self {
        case .usd: return "🇺🇸"
        case .eur: return "🇪🇺"
        case .krw: return "🇰🇷"
        case .cny: return "🇨🇳"
        case .vnd: return "🇻🇳"
        case .irr: return "🇮🇷"
        }
    }
}
