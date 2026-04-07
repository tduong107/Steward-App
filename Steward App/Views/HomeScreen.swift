import SwiftUI

struct HomeScreen: View {
    @Environment(WatchViewModel.self) private var viewModel
    @Environment(SubscriptionManager.self) private var subscriptionManager
    @Environment(NotificationManager.self) private var notificationManager
    @Environment(AuthManager.self) private var authManager

    // Default frequency
    @AppStorage("defaultCheckFrequency") private var defaultCheckFrequency = "Daily"
    @AppStorage("isDarkMode") private var isDarkMode = false
    @AppStorage("appLanguage") private var appLanguage = "en"
    @State private var showFrequencyPicker = false

    // Category filter
    @State private var selectedCategory: WatchCategory? = nil

    // Bulk delete
    @State private var isEditMode = false
    @State private var selectedWatchIds: Set<UUID> = []
    @State private var showBulkDeleteConfirm = false

    // Savings milestone celebration
    @AppStorage("achievedMilestoneAmount") private var achievedMilestoneAmount: Double = 0
    @State private var showCelebration = false
    @State private var celebrationMilestone: SavingsMilestone?

    // Tutorial checklist
    @AppStorage("hasCompletedTutorialWatch") private var hasCompletedWatch = false
    @AppStorage("hasCompletedTutorialNotifs") private var hasCompletedNotifs = false
    @AppStorage("hasCompletedTutorialPhone") private var hasCompletedPhone = false
    @AppStorage("hasDismissedTutorial") private var hasDismissedTutorial = false
    @State private var showTutorialCongrats = false
    @State private var congratsStep: TutorialStep = .firstWatch

    var body: some View {
        ZStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    headerSection
                    chatPromptBar

                    // Tutorial checklist for new users
                    if shouldShowTutorial {
                        TutorialChecklist(
                            onOpenChat: {
                                withAnimation(.spring(response: 0.35, dampingFraction: 0.85)) {
                                    viewModel.isChatOpen = true
                                }
                            },
                            onShowCongrats: { step in
                                congratsStep = step
                                withAnimation { showTutorialCongrats = true }
                            },
                            onDismiss: {
                                withAnimation { hasDismissedTutorial = true }
                            }
                        )
                        .padding(.horizontal, 20)
                        .padding(.bottom, 16)
                        .transition(.opacity.combined(with: .move(edge: .top)))
                    }

                    // Over-limit banner (downgrade enforcement)
                    if viewModel.overLimitCount > 0 {
                        overLimitBanner
                    }

                    stewardSummaryCard
                    triggeredAlerts
                    priceInsightsCard
                    categoryFilterBar

                    if viewModel.watches.isEmpty {
                        emptyState
                    } else {
                        watchList
                    }

                    addWatchCard
                }
                .padding(.bottom, 24)
            }
            .refreshable {
                await viewModel.syncFromCloud(force: true)
            }
            .background(Theme.bg)

            // Celebration overlay
            if showCelebration, let milestone = celebrationMilestone {
                CelebrationOverlay(
                    milestone: milestone,
                    totalSavings: viewModel.savingsCalculation.totalSavings,
                    onDismiss: {
                        withAnimation {
                            showCelebration = false
                            celebrationMilestone = nil
                        }
                    }
                )
                .transition(.opacity)
                .zIndex(999)
            }

            // Tutorial congrats overlay
            if showTutorialCongrats {
                TutorialCongratsOverlay(
                    step: congratsStep,
                    isFinalStep: congratsStep == .allComplete,
                    onDismiss: {
                        withAnimation { showTutorialCongrats = false }
                        // Auto-dismiss checklist after "all complete"
                        if congratsStep == .allComplete {
                            withAnimation(.easeOut(duration: 0.4).delay(0.3)) {
                                hasDismissedTutorial = true
                            }
                        }
                    }
                )
                .transition(.opacity)
                .zIndex(998)
            }
        }
        .onAppear {
            autoCompleteTutorialSteps()
        }
        .onChange(of: viewModel.watches.count) { _, _ in
            autoCompleteTutorialSteps()
        }
        .onChange(of: viewModel.savingsCalculation.totalSavings) { _, _ in
            checkForNewMilestone()
        }
        .sheet(isPresented: $showFrequencyPicker) {
            FrequencyPickerSheet(selectedFrequency: $defaultCheckFrequency)
        }
        .alert("Delete \(selectedWatchIds.count) watches?", isPresented: $showBulkDeleteConfirm) {
            Button("Delete", role: .destructive) {
                let idsToDelete = selectedWatchIds
                withAnimation(.spring(response: 0.3)) {
                    viewModel.removeWatches(ids: idsToDelete)
                }
                selectedWatchIds.removeAll()
                isEditMode = false
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("This action cannot be undone.")
        }
    }

    // MARK: - Tutorial

    private var shouldShowTutorial: Bool {
        !hasDismissedTutorial
    }

    private var allTutorialDone: Bool {
        hasCompletedWatch && hasCompletedNotifs && (hasCompletedPhone || hasUserPhone)
    }

    private var hasUserPhone: Bool {
        if let p = authManager.effectivePhone, !p.isEmpty { return true }
        return false
    }

    /// Auto-complete tutorial steps based on actual app state and show congrats
    private func autoCompleteTutorialSteps() {
        let wasWatchDone = hasCompletedWatch
        let wasNotifsDone = hasCompletedNotifs

        if !hasCompletedWatch && !viewModel.watches.isEmpty {
            hasCompletedWatch = true
        }
        if !hasCompletedNotifs && notificationManager.isPermissionGranted {
            hasCompletedNotifs = true
        }
        if !hasCompletedPhone && hasUserPhone {
            hasCompletedPhone = true
        }

        // Show congrats if a step just completed
        if !wasWatchDone && hasCompletedWatch {
            let step: TutorialStep = allTutorialDone ? .allComplete : .firstWatch
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                congratsStep = step
                withAnimation { showTutorialCongrats = true }
            }
        } else if !wasNotifsDone && hasCompletedNotifs {
            let step: TutorialStep = allTutorialDone ? .allComplete : .notifications
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                congratsStep = step
                withAnimation { showTutorialCongrats = true }
            }
        }
    }

    // MARK: - Milestone Detection

    private func checkForNewMilestone() {
        guard let current = viewModel.savingsCalculation.currentMilestone else { return }
        if current.amount > achievedMilestoneAmount {
            achievedMilestoneAmount = current.amount
            celebrationMilestone = current
            withAnimation(.spring(response: 0.4)) {
                showCelebration = true
            }
        }
    }

    // MARK: - Over-Limit Banner

    private var overLimitBanner: some View {
        let currentTier = subscriptionManager.currentTier
        let maxWatches = currentTier.maxWatches
        let excess = viewModel.overLimitCount

        return VStack(spacing: 10) {
            HStack(spacing: 12) {
                Image(systemName: "exclamationmark.triangle.fill")
                    .font(.system(size: 18))
                    .foregroundStyle(.white)

                VStack(alignment: .leading, spacing: 2) {
                    Text("You have \(excess) extra watch\(excess == 1 ? "" : "es")")
                        .font(Theme.body(13, weight: .semibold))
                        .foregroundStyle(.white)

                    Text("Your \(currentTier.displayName) plan allows \(maxWatches) watches. Remove \(excess) to stay within your plan, or upgrade.")
                        .font(Theme.body(11))
                        .foregroundStyle(.white.opacity(0.8))
                        .lineLimit(3)
                }

                Spacer()
            }
            .padding(14)
            .background(
                RoundedRectangle(cornerRadius: 14)
                    .fill(Color.red.opacity(0.85))
            )

            HStack(spacing: 10) {
                Button {
                    // Scroll to watches so user can delete
                    isEditMode = true
                } label: {
                    Text("Select watches to remove")
                        .font(Theme.body(12, weight: .semibold))
                        .foregroundStyle(Color.red)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(Color.red.opacity(0.1))
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                        .overlay(
                            RoundedRectangle(cornerRadius: 10)
                                .stroke(Color.red.opacity(0.3), lineWidth: 1)
                        )
                }

                Button {
                    let highlightTier: SubscriptionTier = currentTier == .free ? .pro : .premium
                    subscriptionManager.presentPaywall(
                        highlighting: highlightTier,
                        reason: "Upgrade to keep all your watches."
                    )
                } label: {
                    Text("Upgrade")
                        .font(Theme.body(12, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(Theme.accent)
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                }
            }
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 12)
        .transition(.opacity.combined(with: .move(edge: .top)))
    }

    // MARK: - Header

    private var headerSection: some View {
        HStack(spacing: 10) {
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 8) {
                    StewardLogo(size: 30)

                    Text(L10n.t("home.app_title"))
                        .font(Theme.serif(22, weight: .bold))
                        .foregroundStyle(Theme.ink)
                }

                Text(L10n.t("home.app_subtitle"))
                    .font(Theme.body(12))
                    .foregroundStyle(Theme.inkLight)
            }

            Spacer()

            // Dark/light mode toggle
            Button {
                withAnimation(.spring(response: 0.3)) { isDarkMode.toggle() }
            } label: {
                Image(systemName: isDarkMode ? "moon.fill" : "sun.max.fill")
                    .font(.system(size: 14))
                    .foregroundStyle(Theme.ink)
                    .frame(width: 34, height: 34)
                    .background(Theme.bgCard)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                    .overlay(
                        RoundedRectangle(cornerRadius: 10)
                            .stroke(Theme.border, lineWidth: 1)
                    )
            }
            .accessibilityLabel(isDarkMode ? "Switch to light mode" : "Switch to dark mode")

            // Language picker
            Menu {
                ForEach(AppLanguage.allCases) { lang in
                    Button {
                        appLanguage = lang.rawValue
                    } label: {
                        HStack {
                            Text(lang.displayName)
                            if lang.rawValue == appLanguage {
                                Image(systemName: "checkmark")
                            }
                        }
                    }
                }
            } label: {
                Image(systemName: "globe")
                    .font(.system(size: 14))
                    .foregroundStyle(Theme.ink)
                    .frame(width: 34, height: 34)
                    .background(Theme.bgCard)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                    .overlay(
                        RoundedRectangle(cornerRadius: 10)
                            .stroke(Theme.border, lineWidth: 1)
                    )
            }
            .accessibilityLabel("Change language")

            // Notifications bell
            Button(action: { viewModel.selectedTab = .activity }) {
                ZStack(alignment: .topTrailing) {
                    Image(systemName: "bell")
                        .font(.system(size: 14))
                        .foregroundStyle(Theme.ink)
                        .frame(width: 34, height: 34)
                        .background(Theme.bgCard)
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                        .overlay(
                            RoundedRectangle(cornerRadius: 10)
                                .stroke(Theme.border, lineWidth: 1)
                        )

                    if !viewModel.triggeredWatches.isEmpty {
                        Text("\(viewModel.triggeredWatches.count)")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundStyle(.white)
                            .frame(width: 18, height: 18)
                            .background(Theme.red)
                            .clipShape(Circle())
                            .offset(x: 4, y: -4)
                    }
                }
            }
            .accessibilityLabel("Notifications")
        }
        .padding(.horizontal, 24)
        .padding(.top, 20)
    }

    // MARK: - Chat Prompt Bar

    private var chatPromptBar: some View {
        Button {
            viewModel.isChatOpen = true
        } label: {
            HStack(spacing: 10) {
                StewardLogo(size: 30)

                Text(L10n.t("home.chat_prompt"))
                    .font(Theme.body(13))
                    .foregroundStyle(Theme.inkMid)

                Spacer()

                Image(systemName: "arrow.up.right")
                    .font(.system(size: 14))
                    .foregroundStyle(Theme.accentMid)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(Theme.bgCard)
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(Theme.accentMid, lineWidth: 1.5)
            )
            .shadow(color: .black.opacity(0.04), radius: 8, y: 4)
        }
        .buttonStyle(.plain)
        .padding(.horizontal, 24)
        .padding(.top, 16)
        .padding(.bottom, 20)
    }

    // MARK: - Steward Summary Card

    /// Formats minutes into a readable time string
    private func formatTimeSaved(_ minutes: Int) -> String {
        if minutes < 60 {
            return "\(minutes) min"
        } else {
            let hours = minutes / 60
            let mins = minutes % 60
            return mins > 0 ? "\(hours)h \(mins)m" : "\(hours)h"
        }
    }

    @ViewBuilder
    private var stewardSummaryCard: some View {
        let potentialSavings = viewModel.savingsCalculation.totalSavings
        let checks = viewModel.weeklyCheckCount
        let triggers = viewModel.weeklyTriggerCount
        let activeCount = viewModel.watches.filter { $0.status == .watching }.count
        // Each automated check replaces ~1 min of manual work:
        // opening the site (~15s), waiting to load (~10s), finding info (~20s), noting it (~15s)
        let minutesSaved = checks

        if activeCount > 0 || checks > 0 {
            Button {
                viewModel.selectedTab = .activity
            } label: {
            VStack(spacing: 12) {
                // Headline
                HStack(spacing: 8) {
                    Image(systemName: "sparkles")
                        .font(.system(size: 14))
                        .foregroundStyle(Theme.accent)

                    Text(L10n.t("home.steward_working"))
                        .font(Theme.body(14, weight: .bold))
                        .foregroundStyle(Theme.ink)

                    Spacer()
                }

                // Stats row
                HStack(spacing: 0) {
                    VStack(spacing: 2) {
                        Text("\(checks)")
                            .font(Theme.body(16, weight: .bold))
                            .foregroundStyle(Theme.accent)
                        Text(L10n.t("home.checks") + "\nlast 7 days")
                            .font(Theme.body(9))
                            .foregroundStyle(Theme.inkLight)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity)

                    if minutesSaved > 0 {
                        Rectangle().fill(Theme.border).frame(width: 1, height: 28)

                        VStack(spacing: 2) {
                            Text("~\(formatTimeSaved(minutesSaved))")
                                .font(Theme.body(16, weight: .bold))
                                .foregroundStyle(Theme.accent)
                            Text("Time\nsaved")
                                .font(Theme.body(9))
                                .foregroundStyle(Theme.inkLight)
                                .multilineTextAlignment(.center)
                        }
                        .frame(maxWidth: .infinity)
                    }

                    Rectangle().fill(Theme.border).frame(width: 1, height: 28)

                    VStack(spacing: 2) {
                        Text("\(triggers)")
                            .font(Theme.body(16, weight: .bold))
                            .foregroundStyle(Theme.gold)
                        Text("Triggers\nlast 7 days")
                            .font(Theme.body(9))
                            .foregroundStyle(Theme.inkLight)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity)

                    if potentialSavings > 0 {
                        Rectangle().fill(Theme.border).frame(width: 1, height: 28)

                        VStack(spacing: 2) {
                            Text(Theme.formatPrice(potentialSavings))
                                .font(Theme.body(14, weight: .bold))
                                .foregroundStyle(Theme.green)
                            Text("Potential\nsavings")
                                .font(Theme.body(9))
                                .foregroundStyle(Theme.inkLight)
                                .multilineTextAlignment(.center)
                        }
                        .frame(maxWidth: .infinity)
                    }
                }

                // Context line
                if checks > 0 {
                    Text("\(checks) automated checks in the last 7 days — that's ~\(formatTimeSaved(minutesSaved)) you didn't spend manually browsing")
                        .font(Theme.body(11))
                        .foregroundStyle(Theme.inkLight)
                }
            }
            .padding(16)
            .background(Theme.bgCard)
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(Theme.border, lineWidth: 1)
            )
            .shadow(color: .black.opacity(0.04), radius: 8, y: 4)
            .padding(.horizontal, 24)
            .padding(.bottom, 16)
            }
            .buttonStyle(.plain)
        }
    }

    // MARK: - Triggered Alerts

    @ViewBuilder
    private var triggeredAlerts: some View {
        if !viewModel.triggeredWatches.isEmpty {
            VStack(spacing: 10) {
                ForEach(viewModel.triggeredWatches) { watch in
                    TriggeredAlertCard(watch: watch) {
                        viewModel.presentAction(for: watch)
                    }
                }
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 16)
        }
    }

    // MARK: - Price Insights Card

    /// Price-related watches for the insights card
    private var priceWatches: [Watch] {
        viewModel.watches.filter { watch in
            watch.actionType == .price ||
            watch.condition.lowercased().contains("price") ||
            watch.actionLabel.lowercased().contains("price")
        }
    }

    @ViewBuilder
    private var priceInsightsCard: some View {
        if !priceWatches.isEmpty {
            if subscriptionManager.currentTier.hasPriceInsights {
                // Unlocked — full access
                Button {
                    viewModel.selectedTab = .savings
                } label: {
                    HStack(spacing: 12) {
                        Image(systemName: "chart.line.downtrend.xyaxis")
                            .font(.system(size: 16))
                            .foregroundStyle(Theme.accent)
                            .frame(width: 36, height: 36)
                            .background(Theme.accentLight)
                            .clipShape(RoundedRectangle(cornerRadius: 10))

                        VStack(alignment: .leading, spacing: 2) {
                            Text(L10n.t("home.price_insights"))
                                .font(Theme.body(13, weight: .semibold))
                                .foregroundStyle(Theme.ink)

                            Text("Tracking \(priceWatches.count) price\(priceWatches.count == 1 ? "" : "s") · Tap to see deals")
                                .font(Theme.body(11))
                                .foregroundStyle(Theme.inkLight)
                        }

                        Spacer()

                        Image(systemName: "chevron.right")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(Theme.accentMid)
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                    .background(Theme.bgCard)
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                    .overlay(
                        RoundedRectangle(cornerRadius: 14)
                            .stroke(Theme.accentMid, lineWidth: 1)
                    )
                    .shadow(color: .black.opacity(0.04), radius: 8, y: 4)
                }
                .buttonStyle(.plain)
                .padding(.horizontal, 24)
                .padding(.bottom, 16)
            } else {
                // Locked — teaser card
                Button {
                    subscriptionManager.presentPaywall(highlighting: .pro)
                } label: {
                    HStack(spacing: 12) {
                        Image(systemName: "chart.line.downtrend.xyaxis")
                            .font(.system(size: 16))
                            .foregroundStyle(Theme.inkLight)
                            .frame(width: 36, height: 36)
                            .background(Theme.bgDeep)
                            .clipShape(RoundedRectangle(cornerRadius: 10))

                        VStack(alignment: .leading, spacing: 2) {
                            HStack(spacing: 6) {
                                Text(L10n.t("home.price_insights"))
                                    .font(Theme.body(13, weight: .semibold))
                                    .foregroundStyle(Theme.inkMid)

                                Image(systemName: "lock.fill")
                                    .font(.system(size: 10))
                                    .foregroundStyle(Theme.inkLight)
                            }

                            Text("Upgrade to Pro to see deals & price trends")
                                .font(Theme.body(11))
                                .foregroundStyle(Theme.inkLight)
                        }

                        Spacer()

                        Text("PRO")
                            .font(Theme.body(10, weight: .bold))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 3)
                            .background(Theme.accent)
                            .clipShape(Capsule())
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                    .background(Theme.bgCard)
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                    .overlay(
                        RoundedRectangle(cornerRadius: 14)
                            .stroke(Theme.border, lineWidth: 1)
                    )
                    .shadow(color: .black.opacity(0.04), radius: 8, y: 4)
                }
                .buttonStyle(.plain)
                .padding(.horizontal, 24)
                .padding(.bottom, 16)
            }
        }
    }

    // MARK: - Compact Frequency Label

    private var compactFrequencyLabel: String {
        switch defaultCheckFrequency {
        case "Every 5 minutes": return "5m"
        case "Every 15 minutes": return "15m"
        case "Every 30 minutes": return "30m"
        case "Every hour": return "1h"
        case "Every 6 hours": return "6h"
        case "Every 12 hours": return "12h"
        default: return defaultCheckFrequency // "Daily" stays as-is
        }
    }

    // MARK: - Bulk Delete

    private func toggleSelection(_ id: UUID) {
        if selectedWatchIds.contains(id) {
            selectedWatchIds.remove(id)
        } else {
            selectedWatchIds.insert(id)
        }
    }

    private var bulkDeleteBar: some View {
        HStack {
            Button {
                if selectedWatchIds.count == filteredWatches.count {
                    selectedWatchIds.removeAll()
                } else {
                    selectedWatchIds = Set(filteredWatches.map(\.id))
                }
            } label: {
                Text(selectedWatchIds.count == filteredWatches.count ? "Deselect All" : "Select All")
                    .font(Theme.body(13, weight: .medium))
                    .foregroundStyle(Theme.accent)
            }
            .buttonStyle(.plain)

            Spacer()

            Button(role: .destructive) {
                showBulkDeleteConfirm = true
            } label: {
                Label("Delete (\(selectedWatchIds.count))", systemImage: "trash")
                    .font(Theme.body(13, weight: .semibold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    .background(Color.red)
                    .clipShape(Capsule())
            }
            .buttonStyle(.plain)
        }
        .padding(.vertical, 8)
    }

    // MARK: - Category Filter Bar

    private var availableCategories: [WatchCategory] {
        let categories = Set(viewModel.watches.map { WatchCategory.from(watch: $0) })
        return WatchCategory.allCases.filter { categories.contains($0) }
    }

    private var filteredWatches: [Watch] {
        guard let category = selectedCategory else { return viewModel.watches }
        return viewModel.watches.filter { WatchCategory.from(watch: $0) == category }
    }

    @ViewBuilder
    private var categoryFilterBar: some View {
        if availableCategories.count >= 2 {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    // "All" pill
                    filterPill(label: "All", icon: "square.grid.2x2", isSelected: selectedCategory == nil) {
                        withAnimation(.spring(response: 0.3)) {
                            selectedCategory = nil
                        }
                    }

                    // Category pills
                    ForEach(availableCategories, id: \.self) { category in
                        filterPill(label: category.rawValue, icon: category.icon, isSelected: selectedCategory == category) {
                            withAnimation(.spring(response: 0.3)) {
                                selectedCategory = category
                            }
                        }
                    }
                }
                .padding(.horizontal, 24)
            }
            .padding(.bottom, 12)
        }
    }

    private func filterPill(label: String, icon: String, isSelected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 5) {
                Image(systemName: icon)
                    .font(.system(size: 10))

                Text(label)
                    .font(Theme.body(11, weight: .semibold))
            }
            .foregroundStyle(isSelected ? .white : Theme.inkMid)
            .padding(.horizontal, 12)
            .padding(.vertical, 7)
            .background(isSelected ? Theme.accent : Theme.bgDeep)
            .clipShape(Capsule())
        }
        .buttonStyle(.plain)
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "eye.slash")
                .font(.system(size: 36))
                .foregroundStyle(Theme.inkLight)

            VStack(spacing: 6) {
                Text(L10n.t("home.empty.title"))
                    .font(Theme.serif(17, weight: .semibold))
                    .foregroundStyle(Theme.ink)

                Text("Tell Steward what to monitor and it'll\nwatch the web for you around the clock.")
                    .font(Theme.body(13))
                    .foregroundStyle(Theme.inkLight)
                    .multilineTextAlignment(.center)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 40)
        .padding(.horizontal, 24)
    }

    // MARK: - Watch List

    private var watchList: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                Text(L10n.t("home.active_watches"))
                    .font(Theme.serif(16, weight: .semibold))
                    .foregroundStyle(Theme.ink)

                Spacer()

                if !isEditMode {
                    if selectedCategory != nil {
                        Text("\(filteredWatches.count) of \(viewModel.watches.count)")
                            .font(Theme.body(12))
                            .foregroundStyle(Theme.inkLight)
                    } else if subscriptionManager.currentTier.maxWatches < Int.max {
                        Text("\(viewModel.watches.count)/\(subscriptionManager.currentTier.maxWatches) watches")
                            .font(Theme.body(12))
                            .foregroundStyle(Theme.inkLight)
                    } else {
                        Text("\(viewModel.watches.count) watching")
                            .font(Theme.body(12))
                            .foregroundStyle(Theme.inkLight)
                    }
                }

                if viewModel.watches.count > 1 {
                    Button {
                        withAnimation(.spring(response: 0.3)) {
                            isEditMode.toggle()
                            if !isEditMode { selectedWatchIds.removeAll() }
                        }
                    } label: {
                        Text(isEditMode ? "Done" : "Edit")
                            .font(Theme.body(13, weight: .medium))
                            .foregroundStyle(Theme.accent)
                    }
                    .buttonStyle(.plain)
                }
            }

            VStack(spacing: 10) {
                ForEach(filteredWatches) { watch in
                    HStack(spacing: 12) {
                        if isEditMode {
                            Image(systemName: selectedWatchIds.contains(watch.id) ? "checkmark.circle.fill" : "circle")
                                .font(.system(size: 22))
                                .foregroundStyle(selectedWatchIds.contains(watch.id) ? Theme.accent : Theme.inkLight)
                                .onTapGesture { toggleSelection(watch.id) }
                        }

                        WatchCard(watch: watch) {
                            if isEditMode {
                                toggleSelection(watch.id)
                            } else if watch.triggered {
                                // Triggered watches go straight to action modal
                                viewModel.presentAction(for: watch)
                            } else {
                                viewModel.openDetail(for: watch)
                            }
                        }
                    }
                    .contextMenu {
                        if !isEditMode {
                            Button(role: .destructive) {
                                withAnimation(.spring(response: 0.3)) {
                                    viewModel.removeWatch(watch)
                                }
                            } label: {
                                Label("Delete Watch", systemImage: "trash")
                            }
                        }
                    }
                    .transition(.asymmetric(
                        insertion: .move(edge: .bottom).combined(with: .opacity),
                        removal: .opacity
                    ))
                }
            }

            // Bulk delete bar
            if isEditMode && !selectedWatchIds.isEmpty {
                bulkDeleteBar
            }
        }
        .padding(.horizontal, 24)
    }

    // MARK: - Add Watch Card

    private var addWatchCard: some View {
        Button {
            viewModel.isChatOpen = true
        } label: {
            HStack(spacing: 12) {
                Image(systemName: "plus")
                    .font(.system(size: 18))
                    .foregroundStyle(Theme.inkLight)
                    .frame(width: 40, height: 40)
                    .background(Theme.bgDeep)
                    .clipShape(RoundedRectangle(cornerRadius: 12))

                Text("Add a new watch via Steward AI")
                    .font(Theme.body(13))
                    .foregroundStyle(Theme.inkLight)

                Spacer()
            }
            .padding(16)
            .overlay(
                RoundedRectangle(cornerRadius: Theme.radiusLg)
                    .strokeBorder(style: StrokeStyle(lineWidth: 1.5, dash: [8, 6]))
                    .foregroundStyle(Theme.borderMid)
            )
        }
        .buttonStyle(.plain)
        .padding(.horizontal, 24)
        .padding(.top, 10)
        .accessibilityLabel("Add a new watch")
    }
}

// MARK: - Triggered Alert Card

private struct TriggeredAlertCard: View {
    let watch: Watch
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 10) {
                // Badge
                HStack(spacing: 6) {
                    Circle()
                        .fill(.white)
                        .frame(width: 5, height: 5)
                        .modifier(PulseModifier())

                    Text({
                        switch watch.actionType {
                        case .cart:  return L10n.t("home.triggered.cart")
                        case .book:  return L10n.t("home.triggered.book")
                        case .price: return L10n.t("home.triggered.price")
                        case .form:  return L10n.t("home.triggered.form")
                        case .notify: return L10n.t("home.triggered.notify")
                        }
                    }())
                        .font(Theme.body(11, weight: .semibold))
                        .foregroundStyle(.white)
                        .tracking(0.3)
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 3)
                .background(Theme.accent)
                .clipShape(RoundedRectangle(cornerRadius: 6))

                // Content row
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("\(watch.emoji) \(watch.name)")
                            .font(Theme.body(14, weight: .semibold))
                            .foregroundStyle(Theme.ink)

                        Text(watch.changeNote ?? "")
                            .font(Theme.body(12))
                            .foregroundStyle(Theme.accent)
                    }

                    Spacer()

                    Text(watch.actionType.isActionable
                        ? "\(watch.actionType.actionButtonLabel) →"
                        : "Review →")
                        .font(Theme.body(12, weight: .bold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 8)
                        .background(Theme.accent)
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
            .background(Theme.accentLight)
            .clipShape(RoundedRectangle(cornerRadius: Theme.radiusLg))
            .overlay(
                RoundedRectangle(cornerRadius: Theme.radiusLg)
                    .stroke(Theme.accentMid, lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
        .accessibilityLabel("Review triggered watch: \(watch.name)")
    }
}

// MARK: - Watch Category (user-facing filter)

enum WatchCategory: String, CaseIterable, Hashable {
    case product = "Product"
    case travel = "Travel"
    case reservation = "Reservation"
    case tickets = "Tickets"
    case camping = "Camping"
    case general = "General"

    var icon: String {
        switch self {
        case .product: return "bag.fill"
        case .travel: return "airplane"
        case .reservation: return "calendar"
        case .tickets: return "ticket.fill"
        case .camping: return "tent.fill"
        case .general: return "eye.fill"
        }
    }

    /// Determine category from a watch's properties.
    /// Priority: Product (by action type) > Camping > Travel > Reservation > Tickets > Product (by URL) > General
    static func from(watch: Watch) -> WatchCategory {
        let urlLower = watch.url.lowercased()
        let condLower = watch.condition.lowercased()

        // Product — check action type FIRST (most reliable signal)
        // A price/cart watch is always a product, regardless of URL or condition text
        if watch.actionType == .price || watch.actionType == .cart || watch.watchMode == "search" {
            return .product
        }

        // Camping (URL-based)
        if urlLower.contains("recreation.gov") || urlLower.contains("reservecalifornia") ||
           condLower.contains("campsite") || condLower.contains("campground") {
            return .camping
        }

        // Travel (URL-based)
        if urlLower.contains("kayak.com") || urlLower.contains("google.com/travel") ||
           urlLower.contains("skyscanner") || urlLower.contains("airbnb") ||
           urlLower.contains("booking.com") || urlLower.contains("expedia") ||
           condLower.contains("flight") || condLower.contains("hotel") {
            return .travel
        }

        // Reservation (URL-based only — don't match condition text to avoid false positives)
        if urlLower.contains("resy.com") || urlLower.contains("opentable") ||
           urlLower.contains("yelp.com/reservations") || urlLower.contains("tock.com") {
            return .reservation
        }

        // Tickets (URL-based)
        if urlLower.contains("ticketmaster") || urlLower.contains("stubhub") ||
           urlLower.contains("seatgeek") || urlLower.contains("eventbrite") ||
           urlLower.contains("vividseats") || urlLower.contains("tickpick") ||
           urlLower.contains("gametime") || urlLower.contains("livenation") ||
           condLower.contains("ticket") {
            return .tickets
        }

        // Product by URL (shopping domains)
        if urlLower.contains("amazon.com") || urlLower.contains("walmart.com") ||
           urlLower.contains("target.com") || urlLower.contains("bestbuy.com") ||
           urlLower.contains("ebay.com") || urlLower.contains("shopify") ||
           urlLower.contains("nike.com") || urlLower.contains("birkenstock") ||
           urlLower.contains("rei.com") || urlLower.contains("nordstrom") {
            return .product
        }

        // Booking by condition (fallback)
        if watch.actionType == .book {
            if condLower.contains("campsite") || condLower.contains("campground") { return .camping }
            if condLower.contains("table for") || condLower.contains("reservation") { return .reservation }
            return .reservation
        }

        return .general
    }
}
