import SwiftUI

struct HomeScreen: View {
    @Environment(WatchViewModel.self) private var viewModel
    @Environment(SubscriptionManager.self) private var subscriptionManager

    // Default frequency
    @AppStorage("defaultCheckFrequency") private var defaultCheckFrequency = "Daily"
    @State private var showFrequencyPicker = false

    // Category filter
    @State private var selectedCategory: ActionType? = nil

    // Bulk delete
    @State private var isEditMode = false
    @State private var selectedWatchIds: Set<UUID> = []
    @State private var showBulkDeleteConfirm = false

    // Savings milestone celebration
    @AppStorage("achievedMilestoneAmount") private var achievedMilestoneAmount: Double = 0
    @State private var showCelebration = false
    @State private var celebrationMilestone: SavingsMilestone?

    var body: some View {
        ZStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    headerSection
                    chatPromptBar
                    triggeredAlerts
                    priceInsightsCard
                    savingsMilestoneSection
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

    // MARK: - Header

    private var headerSection: some View {
        HStack(spacing: 10) {
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 8) {
                    StewardLogo(size: 30)

                    Text("Steward")
                        .font(Theme.serif(22, weight: .bold))
                        .foregroundStyle(Theme.ink)
                }

                Text("Your personal AI concierge")
                    .font(Theme.body(12))
                    .foregroundStyle(Theme.inkLight)
            }

            Spacer()

            // Compact frequency pill
            Button { showFrequencyPicker = true } label: {
                HStack(spacing: 4) {
                    Image(systemName: "clock.arrow.circlepath")
                        .font(.system(size: 10))

                    Text(compactFrequencyLabel)
                        .font(Theme.body(11, weight: .semibold))

                    if let freq = CheckFrequency.from(string: defaultCheckFrequency),
                       freq.requiredTier != .free {
                        Text(freq.requiredTier.displayName.uppercased())
                            .font(Theme.body(8, weight: .bold))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 4)
                            .padding(.vertical, 1)
                            .background(freq.requiredTier == .premium ? Theme.gold : Theme.accent)
                            .clipShape(Capsule())
                    }
                }
                .foregroundStyle(Theme.accent)
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(Theme.accentLight)
                .clipShape(Capsule())
            }
            .buttonStyle(.plain)

            Button(action: { viewModel.selectedTab = .activity }) {
                ZStack(alignment: .topTrailing) {
                    Image(systemName: "bell")
                        .font(.system(size: 16))
                        .foregroundStyle(Theme.ink)
                        .frame(width: 38, height: 38)
                        .background(Theme.bgCard)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Theme.border, lineWidth: 1)
                        )
                        .shadow(color: .black.opacity(0.04), radius: 8, y: 4)

                    // Badge for triggered watches
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

                Text("Ask Steward to watch something…")
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

    // MARK: - Triggered Alerts

    @ViewBuilder
    private var triggeredAlerts: some View {
        if !viewModel.triggeredWatches.isEmpty {
            VStack(spacing: 10) {
                ForEach(viewModel.triggeredWatches) { watch in
                    TriggeredAlertCard(watch: watch) {
                        viewModel.openDetail(for: watch)
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
                    viewModel.showPriceInsights = true
                } label: {
                    HStack(spacing: 12) {
                        Image(systemName: "chart.line.downtrend.xyaxis")
                            .font(.system(size: 16))
                            .foregroundStyle(Theme.accent)
                            .frame(width: 36, height: 36)
                            .background(Theme.accentLight)
                            .clipShape(RoundedRectangle(cornerRadius: 10))

                        VStack(alignment: .leading, spacing: 2) {
                            Text("Price Insights")
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
                                Text("Price Insights")
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

    // MARK: - Savings Milestone Section

    @ViewBuilder
    private var savingsMilestoneSection: some View {
        if viewModel.savingsCalculation.totalSavings > 0 {
            SavingsMilestoneCard(calculation: viewModel.savingsCalculation)
                .padding(.horizontal, 24)
                .padding(.bottom, 16)
                .transition(.move(edge: .top).combined(with: .opacity))
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

    private var availableCategories: [ActionType] {
        let types = Set(viewModel.watches.map { $0.actionType })
        return ActionType.allCases.filter { types.contains($0) }
    }

    private var filteredWatches: [Watch] {
        guard let category = selectedCategory else { return viewModel.watches }
        return viewModel.watches.filter { $0.actionType == category }
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
                        filterPill(label: category.displayName, icon: category.iconName, isSelected: selectedCategory == category) {
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
                Text("No watches yet")
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
                Text("Active Watches")
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

                    Text("STEWARD READY TO ACT")
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

                    Text("Review →")
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
