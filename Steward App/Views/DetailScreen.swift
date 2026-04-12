import SwiftUI

struct DetailScreen: View {
    let watch: Watch
    @Environment(WatchViewModel.self) private var viewModel
    @Environment(SupabaseService.self) private var supabase
    @Environment(SubscriptionManager.self) private var subscriptionManager
    @Environment(\.dismiss) private var dismiss

    // Price history (real data from Supabase only)
    @State private var priceHistory: [PricePoint] = []
    @State private var dealInsight: DealInsight?
    @State private var isLoadingPrices = true
    @State private var showShareSheet = false
    @State private var showDeleteConfirm = false
    @State private var showBrowser = false

    // Real check results from Supabase
    @State private var checkResults: [CheckResultDTO] = []
    @State private var isLoadingChecks = true
    @State private var showFrequencyPicker = false
    @State private var showTimePicker = false
    @State private var showNotifyPicker = false
    @State private var showRenameAlert = false
    @State private var editedName = ""

    /// Show price chart for price-related watches
    private var showsPriceChart: Bool {
        watch.actionType == .price ||
        watch.condition.lowercased().contains("price") ||
        watch.actionLabel.lowercased().contains("price")
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                headerCard
                detailContent
            }
        }
        .background(Theme.bg)
        .navigationBarBackButtonHidden(true)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button {
                    dismiss()
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: "chevron.left")
                            .font(.system(size: 14, weight: .medium))
                        Text(L10n.t("detail.back"))
                            .font(Theme.body(13))
                    }
                    .foregroundStyle(Theme.inkMid)
                }
            }

            ToolbarItem(placement: .primaryAction) {
                HStack(spacing: 16) {
                    Button {
                        showShareSheet = true
                    } label: {
                        Image(systemName: "square.and.arrow.up")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundStyle(Theme.ink)
                    }
                    .accessibilityLabel("Share this watch")

                    Menu {
                        Button {
                            editedName = watch.name
                            showRenameAlert = true
                        } label: {
                            Label("Rename", systemImage: "pencil")
                        }

                        Button(role: .destructive) {
                            showDeleteConfirm = true
                        } label: {
                            Label("Delete Watch", systemImage: "trash")
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundStyle(Theme.ink)
                    }
                    .accessibilityLabel("More options")
                }
            }
        }
        .alert("Delete Watch", isPresented: $showDeleteConfirm) {
            Button("Cancel", role: .cancel) {}
            Button("Delete", role: .destructive) {
                viewModel.removeWatch(watch)
                dismiss()
            }
        } message: {
            Text("Are you sure you want to delete \"\(watch.name)\"? This action cannot be undone.")
        }
        .alert("Rename Watch", isPresented: $showRenameAlert) {
            TextField("Watch name", text: $editedName)
            Button("Cancel", role: .cancel) {}
            Button("Save") {
                let trimmed = editedName.trimmingCharacters(in: .whitespacesAndNewlines)
                if !trimmed.isEmpty {
                    watch.name = trimmed
                    try? viewModel.saveAndSync(watch)
                }
            }
        } message: {
            Text("Enter a new name for this watch.")
        }
        .sheet(isPresented: $showShareSheet) {
            ShareWatchSheet(watch: watch)
        }
        .sheet(isPresented: $showBrowser) {
            // Use affiliate URL if available, otherwise fall back to original URL
            if let url = watch.actionFullURL ?? watch.fullURL {
                InAppBrowser(initialURL: url) { capturedURL in
                    // If the watch needs attention, use captured URL to fix it
                    if watch.needsAttention {
                        viewModel.fixBrokenWatch(name: watch.name, newURL: capturedURL)
                    }
                }
            }
        }
        .sheet(isPresented: $showFrequencyPicker) {
            FrequencyPickerSheet(
                selectedFrequency: Binding(
                    get: { watch.checkFrequency },
                    set: { newValue in
                        watch.checkFrequency = newValue
                        try? viewModel.saveAndSync(watch)
                    }
                )
            )
            .presentationDetents([.medium, .large])
        }
        .sheet(isPresented: $showTimePicker) {
            StartTimePickerSheet(
                preferredTime: Binding(
                    get: { watch.preferredCheckTime },
                    set: { newValue in
                        watch.preferredCheckTime = newValue
                        try? viewModel.saveAndSync(watch)
                    }
                )
            )
            .presentationDetents([.medium])
        }
        .sheet(isPresented: $showNotifyPicker) {
            NotificationPickerSheet(
                notifyChannels: Binding(
                    get: { watch.notifyChannels },
                    set: { newValue in
                        watch.notifyChannels = newValue
                        try? viewModel.saveAndSync(watch)
                    }
                ),
                watch: watch,
                onSaveWatch: { try? viewModel.saveAndSync(watch) }
            )
            .presentationDetents([.medium])
        }
        .task {
            // Force sync to get latest needs_attention state from Supabase
            await viewModel.syncFromCloud(force: true)
            await loadCheckResults()
            if showsPriceChart {
                await loadPriceHistory()
            }
        }
    }

    // MARK: - Load Check Results

    private func loadCheckResults() async {
        do {
            checkResults = try await supabase.fetchCheckResults(forWatchId: watch.id)
        } catch {
            // Silently fail — empty state will show "No checks yet"
        }
        isLoadingChecks = false
    }

    /// Load real price history from Supabase (no mock data)
    private func loadPriceHistory() async {
        do {
            let results = try await supabase.fetchPriceHistory(forWatchId: watch.id)
            let realPoints = PricePoint.fromCheckResults(results)
            priceHistory = realPoints

            if realPoints.count >= 2 {
                dealInsight = DealAnalyzer.analyze(history: realPoints)
            }
        } catch {
            // On error, leave empty — chart will show empty state
            priceHistory = []
        }
        isLoadingPrices = false
    }

    // MARK: - Header Card

    private var headerCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 14) {
                Group {
                    if let imageURL = watch.imageURL, let url = URL(string: imageURL) {
                        AsyncImage(url: url) { phase in
                            switch phase {
                            case .success(let image):
                                image
                                    .resizable()
                                    .scaledToFill()
                            case .failure:
                                Text(watch.emoji)
                                    .font(.system(size: 26))
                            default:
                                ProgressView()
                                    .controlSize(.small)
                            }
                        }
                    } else {
                        Text(watch.emoji)
                            .font(.system(size: 26))
                    }
                }
                .frame(width: 56, height: 56)
                .background(Theme.bgDeep)
                .clipShape(RoundedRectangle(cornerRadius: 16))

                VStack(alignment: .leading, spacing: 2) {
                    Button {
                        editedName = watch.name
                        showRenameAlert = true
                    } label: {
                        HStack(spacing: 4) {
                            Text(watch.name)
                                .font(Theme.serif(18, weight: .bold))
                                .foregroundStyle(Theme.ink)

                            Image(systemName: "pencil")
                                .font(.system(size: 11, weight: .medium))
                                .foregroundStyle(Theme.inkLight)
                        }
                    }
                    .buttonStyle(.plain)

                    Button {
                        showBrowser = true
                    } label: {
                        HStack(spacing: 4) {
                            Text(watch.actionURL ?? watch.url)
                                .font(Theme.body(12))
                                .foregroundStyle(Theme.accent)
                                .lineLimit(1)
                                .truncationMode(.middle)

                            Image(systemName: "arrow.up.right")
                                .font(.system(size: 9, weight: .semibold))
                                .foregroundStyle(Theme.accentMid)
                        }
                    }
                    .buttonStyle(.plain)
                }
            }

            // Status pill
            HStack(spacing: 6) {
                Circle()
                    .fill(watch.triggered ? Theme.accent : watch.needsAttention ? Theme.gold : Theme.inkLight)
                    .frame(width: 6, height: 6)
                    .modifier(PulseModifier(enabled: watch.triggered))

                Text(watch.triggered
                     ? "Change detected · Ready to act"
                     : watch.needsAttention
                     ? "Needs attention · \(watch.consecutiveFailures) failures"
                     : "Watching · \(watch.lastSeen)")
                    .font(Theme.body(12, weight: .semibold))
                    .foregroundStyle(watch.triggered ? Theme.accent : watch.needsAttention ? Theme.gold : Theme.inkMid)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 6)
            .background(watch.triggered ? Theme.accentLight : watch.needsAttention ? Theme.goldLight : Theme.bgDeep)
            .clipShape(Capsule())
            .overlay(
                Capsule()
                    .stroke(watch.triggered ? Theme.accentMid : watch.needsAttention ? Theme.gold.opacity(0.4) : Theme.border, lineWidth: 1)
            )
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 24)
        .padding(.vertical, 20)
        .background(Theme.bgCard)
        .overlay(alignment: .bottom) {
            Divider().foregroundStyle(Theme.border)
        }
    }

    // MARK: - Detail Content

    private var detailContent: some View {
        VStack(spacing: 8) {
            // Error / needs attention banner
            if watch.needsAttention {
                warningBanner
            }

            // Alternative source suggestion
            if watch.altSourceUrl != nil && watch.altSourceDomain != nil {
                altSourceBanner
            }

            // Change banner
            if watch.triggered {
                changeBanner
            }

            // Action / trigger button (above chart for prominence)
            actionButton

            // Price History Chart (only for price-related watches)
            if showsPriceChart {
                if isLoadingPrices {
                    priceChartLoadingState
                        .padding(.bottom, 4)
                } else if priceHistory.isEmpty {
                    priceChartEmptyState
                        .padding(.bottom, 4)
                } else {
                    PriceHistoryChart(points: priceHistory, accentColor: Theme.accent)
                        .padding(.bottom, 4)
                }
            }

            // Price Source Indicator — computed from latest check result
            if showsPriceChart, let latestResult = checkResults.first {
                let sourceInfo = computePriceSource(from: latestResult)
                HStack(spacing: 8) {
                    Image(systemName: sourceInfo.icon)
                        .font(.system(size: 13))
                        .foregroundStyle(sourceInfo.color)
                    VStack(alignment: .leading, spacing: 1) {
                        Text(sourceInfo.label)
                            .font(Theme.body(12, weight: .semibold))
                            .foregroundStyle(Theme.ink)
                        Text(sourceInfo.detail)
                            .font(Theme.body(11))
                            .foregroundStyle(Theme.inkLight)
                    }
                    Spacer()
                    Text(sourceInfo.badge)
                        .font(Theme.body(10, weight: .bold))
                        .foregroundStyle(sourceInfo.color)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(sourceInfo.color.opacity(0.1))
                        .clipShape(Capsule())
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .background(Theme.bgCard)
                .clipShape(RoundedRectangle(cornerRadius: 12))
                .overlay(RoundedRectangle(cornerRadius: 12).stroke(sourceInfo.color.opacity(0.2), lineWidth: 1))
                .padding(.bottom, 4)
            }

            // Deal Quality Badge (only when we have real price analysis + paid tier)
            if let dealInsight = dealInsight, subscriptionManager.currentTier.hasPriceInsights {
                DealQualityBadge(insight: dealInsight)
                    .padding(.bottom, 4)
            }

            // Action URL row (when triggered and actionable)
            if watch.triggered, let actionURL = watch.actionURL {
                DetailRow(icon: "🔗", label: "Action link", value: URL(string: actionURL)?.host ?? actionURL, highlight: true)
            }

            DetailRow(icon: "🎯", label: "Watching for", value: watch.condition)
            DetailRow(icon: "⚡", label: "When found", value: {
                // Show accurate description based on action type
                switch watch.actionType {
                case .book: return L10n.t("detail.action.book")
                case .price: return L10n.t("detail.action.price")
                case .cart: return L10n.t("detail.action.cart")
                case .notify: return L10n.t("detail.action.notify")
                case .form: return L10n.t("detail.action.form")
                }
            }(), highlight: watch.triggered)
            Button { showFrequencyPicker = true } label: {
                DetailRow(icon: "⏱", label: "Watch frequency", value: watch.checkFrequency, showChevron: true)
            }
            .buttonStyle(.plain)
            Button { showTimePicker = true } label: {
                DetailRow(icon: "🕐", label: "Watch start time", value: formatPreferredTime(watch.preferredCheckTime), showChevron: true)
            }
            .buttonStyle(.plain)
            nextCheckRow
            Button { showNotifyPicker = true } label: {
                DetailRow(icon: "🔔", label: "Notify via", value: formatNotifyChannels(watch.notifyChannels), showChevron: true)
            }
            .buttonStyle(.plain)

            // Auto-Act preferences (Premium feature)
            autoActSection

            // Visit website button
            visitWebsiteCard

            // Share card
            shareCard

            recentChecks

            // Delete watch
            deleteWatchButton
        }
        .padding(.horizontal, 24)
        .padding(.top, 16)
        .padding(.bottom, 24)
    }

    // MARK: - Price Chart States

    private var priceChartLoadingState: some View {
        VStack(spacing: 12) {
            HStack {
                Text(L10n.t("detail.price_history"))
                    .font(Theme.serif(15, weight: .semibold))
                    .foregroundStyle(Theme.ink)

                Spacer()
            }

            ProgressView()
                .controlSize(.small)

            Text("Loading price data...")
                .font(Theme.body(12))
                .foregroundStyle(Theme.inkLight)
        }
        .frame(maxWidth: .infinity)
        .padding(16)
        .background(Theme.bgCard)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Theme.border, lineWidth: 1)
        )
        .shadow(color: .black.opacity(0.04), radius: 8, y: 4)
    }

    private var priceChartEmptyState: some View {
        VStack(spacing: 12) {
            HStack {
                Text(L10n.t("detail.price_history"))
                    .font(Theme.serif(15, weight: .semibold))
                    .foregroundStyle(Theme.ink)

                Spacer()
            }

            VStack(spacing: 8) {
                Image(systemName: "chart.line.downtrend.xyaxis")
                    .font(.system(size: 28))
                    .foregroundStyle(Theme.inkLight.opacity(0.5))

                Text("Waiting for price data")
                    .font(Theme.body(14, weight: .medium))
                    .foregroundStyle(Theme.inkMid)

                Text("Steward will start tracking prices on the next watch. Price history will appear here as data is collected.")
                    .font(Theme.body(12))
                    .foregroundStyle(Theme.inkLight)
                    .multilineTextAlignment(.center)
            }
            .padding(.vertical, 20)
        }
        .frame(maxWidth: .infinity)
        .padding(16)
        .background(Theme.bgCard)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Theme.border, lineWidth: 1)
        )
        .shadow(color: .black.opacity(0.04), radius: 8, y: 4)
    }

    // MARK: - Change Banner

    private var changeBanner: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(L10n.t("detail.change_detected"))
                .font(Theme.body(11, weight: .bold))
                .foregroundStyle(Theme.accent)
                .tracking(0.5)

            Text("📉 \(watch.changeNote ?? "")")
                .font(Theme.body(15, weight: .semibold))
                .foregroundStyle(Theme.ink)

            Text(watch.actionType.isActionable
                ? "Your condition was met · Tap to \(watch.actionType.actionButtonLabel.lowercased())"
                : "Your condition was met · Steward can act now")
                .font(Theme.body(12))
                .foregroundStyle(Theme.inkMid)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
        .background(Theme.accentLight)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(Theme.accentMid, lineWidth: 1)
        )
        .padding(.bottom, 6)
    }

    // MARK: - Warning Banner

    private var warningBanner: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: "exclamationmark.triangle.fill")
                    .font(.system(size: 12))
                    .foregroundStyle(Theme.gold)

                Text(L10n.t("detail.needs_attention"))
                    .font(Theme.body(11, weight: .bold))
                    .foregroundStyle(Theme.gold)
                    .tracking(0.5)
            }

            Text(watch.lastError ?? "This watch is having trouble checking the page.")
                .font(Theme.body(14, weight: .semibold))
                .foregroundStyle(Theme.ink)

            Text("Failed \(watch.consecutiveFailures) times in a row. The page may have changed or the URL may no longer work.")
                .font(Theme.body(12))
                .foregroundStyle(Theme.inkMid)

            HStack(spacing: 8) {
                Button {
                    viewModel.askAIToFix(watch)
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: "sparkles")
                            .font(.system(size: 12))
                        Text(L10n.t("detail.ask_ai_fix"))
                            .font(Theme.body(13, weight: .semibold))
                    }
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(Theme.gold)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                }
                .buttonStyle(.plain)

                Button {
                    showBrowser = true
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: "safari")
                            .font(.system(size: 12))
                        Text(L10n.t("detail.find_link"))
                            .font(Theme.body(13, weight: .semibold))
                    }
                    .foregroundStyle(Theme.gold)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(Theme.goldLight)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                    .overlay(
                        RoundedRectangle(cornerRadius: 10)
                            .stroke(Theme.gold.opacity(0.4), lineWidth: 1)
                    )
                }
                .buttonStyle(.plain)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
        .background(Theme.goldLight)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(Theme.gold.opacity(0.3), lineWidth: 1)
        )
        .padding(.bottom, 6)
    }

    // MARK: - Alternative Source Banner

    private var altSourceBanner: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: "arrow.triangle.2.circlepath")
                    .font(.system(size: 12))
                    .foregroundStyle(Theme.accent)

                Text(L10n.t("detail.alt_source"))
                    .font(Theme.body(11, weight: .bold))
                    .foregroundStyle(Theme.accent)
                    .tracking(0.5)
            }

            if let domain = watch.altSourceDomain, let price = watch.altSourcePrice {
                Text("\(watch.name) is available on \(domain) for $\(String(format: "%.2f", price))")
                    .font(Theme.body(14, weight: .semibold))
                    .foregroundStyle(Theme.ink)
            }

            Text("Would you like to switch to tracking this source instead?")
                .font(Theme.body(12))
                .foregroundStyle(Theme.inkMid)

            HStack(spacing: 8) {
                Button {
                    viewModel.switchToAltSource(watch)
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: "arrow.right.arrow.left")
                            .font(.system(size: 12))
                        Text(L10n.t("detail.switch"))
                            .font(Theme.body(13, weight: .semibold))
                    }
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(Theme.accent)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                }
                .buttonStyle(.plain)

                Button {
                    viewModel.dismissAltSource(watch)
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: "xmark")
                            .font(.system(size: 12))
                        Text(L10n.t("detail.keep_current"))
                            .font(Theme.body(13, weight: .semibold))
                    }
                    .foregroundStyle(Theme.accent)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(Theme.accentLight)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                    .overlay(
                        RoundedRectangle(cornerRadius: 10)
                            .stroke(Theme.accent.opacity(0.4), lineWidth: 1)
                    )
                }
                .buttonStyle(.plain)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
        .background(Theme.accentLight)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(Theme.accent.opacity(0.3), lineWidth: 1)
        )
        .padding(.bottom, 6)
    }

    // MARK: - Action Button

    private var actionButton: some View {
        Button {
            if watch.triggered {
                viewModel.presentAction(for: watch)
            }
        } label: {
            HStack {
                if watch.triggered {
                    Image(systemName: watch.actionType.isActionable ? watch.actionType.actionButtonIcon : "sparkle")
                        .font(.system(size: 14))
                }
                Text(watch.triggered
                    ? (watch.actionType.isActionable ? watch.actionType.actionButtonLabel : "Acknowledge")
                    : "⏳ Waiting for trigger…")
                    .font(Theme.body(15, weight: .bold))
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(watch.triggered ? Theme.accent : Theme.bgDeep)
            .foregroundStyle(watch.triggered ? .white : Theme.inkLight)
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(watch.triggered ? Color.clear : Theme.border, lineWidth: 1)
            )
            .shadow(color: watch.triggered ? Theme.accent.opacity(0.25) : .clear, radius: 12, y: 4)
        }
        .disabled(!watch.triggered)
        .padding(.top, 8)
        .accessibilityLabel(watch.triggered ? "Let Steward act now" : "Waiting for trigger")
    }

    // MARK: - Format Preferred Time

    // Static formatter to avoid creating DateFormatter on every render
    private static let displayTimeFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "h:mm a"
        return f
    }()

    private func formatPreferredTime(_ time: String?) -> String {
        guard let time else { return "Not set" }
        let parts = time.split(separator: ":")
        guard parts.count == 2,
              let h = Int(parts[0]), let m = Int(parts[1]) else { return time }
        var comps = DateComponents()
        comps.hour = h
        comps.minute = m
        if let date = Calendar.current.date(from: comps) {
            return Self.displayTimeFormatter.string(from: date)
        }
        return time
    }

    // MARK: - Format Notify Channels

    private func formatNotifyChannels(_ channels: String) -> String {
        let set = Set(channels.split(separator: ",").map { String($0).trimmingCharacters(in: .whitespaces) })
        var labels: [String] = []
        if set.contains("push") { labels.append("Push") }
        if set.contains("email") { labels.append("Email") }
        if labels.isEmpty { return "Push" }
        return labels.joined(separator: " · ")
    }

    // MARK: - Next Watch Countdown

    private var nextCheckRow: some View {
        HStack(spacing: 12) {
            Text("⏳")
                .font(.system(size: 16))
                .frame(width: 28, alignment: .center)

            VStack(alignment: .leading, spacing: 1) {
                Text(L10n.t("detail.next_watch"))
                    .font(Theme.body(12))
                    .foregroundStyle(Theme.inkLight)
                Text(watch.nextCheckCountdown)
                    .font(Theme.body(14, weight: .medium))
                    .foregroundStyle(Theme.ink)
            }

            Spacer()
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(Theme.bgCard)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(Theme.border, lineWidth: 1)
        )
    }

    // MARK: - Auto-Act Section

    @ViewBuilder
    private var autoActSection: some View {
        let isPremium = subscriptionManager.currentTier.hasAutoAct

        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 8) {
                Image(systemName: "bolt.fill")
                    .font(.system(size: 12))
                    .foregroundStyle(isPremium ? Theme.accent : Theme.inkLight)
                    .frame(width: 28, height: 28)
                    .background(isPremium ? Theme.accentLight : Theme.bgDeep)
                    .clipShape(RoundedRectangle(cornerRadius: 8))

                Text(L10n.t("detail.when_triggered"))
                    .font(Theme.body(14, weight: .semibold))
                    .foregroundStyle(Theme.ink)

                Spacer()

                if !isPremium {
                    Text(L10n.t("detail.premium"))
                        .font(Theme.body(10, weight: .bold))
                        .foregroundStyle(Theme.gold)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(Theme.gold.opacity(0.12))
                        .clipShape(Capsule())
                }
            }

            // Action options specific to this watch type
            VStack(spacing: 0) {
                // For Free users: show "Notify Me"
                // For Pro+ users: show "Notify + Quick Link" (replaces basic notify since it's strictly better)
                if subscriptionManager.currentTier.hasQuickLink && watch.actionType != .notify {
                    autoActOption(
                        icon: "link",
                        title: "Notify + Quick Link",
                        subtitle: "Notification with a direct link to take action",
                        isSelected: !watch.autoActEnabled,
                        isAvailable: true
                    ) {
                        watch.autoActEnabled = false
                        try? viewModel.saveAndSync(watch)
                    }
                } else {
                    autoActOption(
                        icon: "bell.fill",
                        title: "Notify Me",
                        subtitle: "Send a push notification",
                        isSelected: !watch.autoActEnabled,
                        isAvailable: true
                    ) {
                        watch.autoActEnabled = false
                        try? viewModel.saveAndSync(watch)
                    }

                    // Show Quick Link as locked option for Free users
                    if watch.actionType != .notify {
                        Divider().foregroundStyle(Theme.border).padding(.leading, 44)

                        autoActOption(
                            icon: "link",
                            title: "Notify + Quick Link",
                            subtitle: "Notification with a direct link to take action",
                            isSelected: false,
                            isAvailable: false,
                            tierBadge: "Pro"
                        ) {
                            subscriptionManager.presentPaywall(highlighting: .pro, reason: "Quick Link is a Pro feature")
                        }
                    }
                }

                if watch.actionType != .notify {
                    Divider().foregroundStyle(Theme.border).padding(.leading, 44)
                }

                // Auto-Act — only available on supported retailers
                switch watch.actionType {
                case .price, .cart:
                    let canAutoAct: Bool = autoActSupportedForURL(watch.url)
                    autoActOption(
                        icon: "cart.badge.plus",
                        title: "Auto Add to Cart",
                        subtitle: canAutoAct
                            ? "Steward adds to cart automatically"
                            : "Coming soon for this store",
                        isSelected: watch.autoActEnabled,
                        isAvailable: isPremium && canAutoAct,
                        tierBadge: "Premium"
                    ) {
                        if !canAutoAct { return }
                        if isPremium {
                            watch.autoActEnabled = true
                            try? viewModel.saveAndSync(watch)
                        } else {
                            subscriptionManager.presentPaywall(highlighting: .premium, reason: "Auto-Act is a Premium feature")
                        }
                    }
                case .book:
                    autoActOption(
                        icon: "calendar.badge.plus",
                        title: "Auto Book",
                        subtitle: "Coming soon for Premium",
                        isSelected: false,
                        isAvailable: false,
                        tierBadge: "Premium"
                    ) { subscriptionManager.presentPaywall(highlighting: .premium, reason: "Auto Book is coming soon for Premium users") }
                case .form:
                    autoActOption(
                        icon: "doc.badge.plus",
                        title: "Auto Fill & Submit",
                        subtitle: "Coming soon",
                        isSelected: false,
                        isAvailable: false
                    ) { }
                case .notify:
                    EmptyView()
                }
            }
            .background(Theme.bgDeep.opacity(0.5))
            .clipShape(RoundedRectangle(cornerRadius: 10))

        }
        .padding(16)
        .background(Theme.bgCard)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Theme.border, lineWidth: 1)
        )
    }

    private func autoActOption(icon: String, title: String, subtitle: String, isSelected: Bool, isAvailable: Bool, tierBadge: String? = nil, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 10) {
                Image(systemName: icon)
                    .font(.system(size: 14))
                    .foregroundStyle(isAvailable ? (isSelected ? Theme.accent : Theme.inkMid) : Theme.inkLight.opacity(0.5))
                    .frame(width: 28)

                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 6) {
                        Text(title)
                            .font(Theme.body(13, weight: .medium))
                            .foregroundStyle(isAvailable ? Theme.ink : Theme.inkLight.opacity(0.5))

                        if let badge = tierBadge, !isAvailable {
                            Text(badge)
                                .font(Theme.body(9, weight: .bold))
                                .foregroundStyle(badge == "Pro" ? Theme.accent.opacity(0.7) : Theme.gold.opacity(0.7))
                                .padding(.horizontal, 5)
                                .padding(.vertical, 2)
                                .background(badge == "Pro" ? Theme.accent.opacity(0.1) : Theme.gold.opacity(0.1))
                                .clipShape(Capsule())
                        }
                    }

                    Text(subtitle)
                        .font(Theme.body(11))
                        .foregroundStyle(isAvailable ? Theme.inkLight : Theme.inkLight.opacity(0.3))
                }

                Spacer()

                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                    .font(.system(size: 18))
                    .foregroundStyle(isSelected ? Theme.accent : (isAvailable ? Theme.borderMid : Theme.borderMid.opacity(0.3)))
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 12)
        }
        .buttonStyle(.plain)
    }

    /// Whether the watch's URL is on a retailer that supports server-side cart-add.
    // MARK: - Price Source Computation

    struct PriceSourceInfo {
        let icon: String
        let color: Color
        let label: String
        let detail: String
        let badge: String
    }

    private func computePriceSource(from result: CheckResultDTO) -> PriceSourceInfo {
        let text = result.resultText ?? ""

        // Flight API data
        if text.contains("→") && (text.contains("Airlines") || text.contains("Spirit") || text.contains("Delta") || text.contains("United") || text.contains("American") || text.contains("JetBlue") || text.contains("Alaska") || text.contains("Southwest") || text.contains("Frontier")) {
            return PriceSourceInfo(icon: "airplane", color: .blue, label: "Live flight data", detail: "Real-time from airline APIs", badge: "Live")
        }

        // Restaurant availability
        if text.contains("tables available") || text.contains("reservation") {
            return PriceSourceInfo(icon: "fork.knife", color: .green, label: "Live availability", detail: "Real-time from Resy / OpenTable", badge: "Live")
        }

        // Campsite availability
        if text.contains("Campground") || text.contains("campsite") || text.contains("Recreation.gov") {
            return PriceSourceInfo(icon: "tent", color: .green, label: "Live availability", detail: "Real-time from Recreation.gov", badge: "Live")
        }

        // AI search estimate
        if text.contains("(via AI search)") {
            return PriceSourceInfo(icon: "sparkles", color: .orange, label: "AI price estimate", detail: "Price from search results — may differ from retailer", badge: "Estimated")
        }

        // Claude direct estimate
        if text.contains("(estimated") {
            return PriceSourceInfo(icon: "sparkles", color: .orange, label: "AI price estimate", detail: "Approximate price from AI analysis", badge: "Estimated")
        }

        // Cross-store search result
        if text.contains("Best:") && text.contains(" at ") {
            return PriceSourceInfo(icon: "magnifyingglass", color: .blue, label: "Best price found", detail: "Compared across multiple stores", badge: "Compared")
        }

        // Via specific source
        if text.contains("(via ") {
            return PriceSourceInfo(icon: "globe", color: .cyan, label: "Cross-checked price", detail: "Verified from alternative source", badge: "Checked")
        }

        // Could not reach
        if text.contains("Could not reach") {
            return PriceSourceInfo(icon: "wifi.slash", color: .red, label: "Page unreachable", detail: "Couldn't connect to the retailer", badge: "Error")
        }

        // Price not found
        if text.contains("Price not found") {
            return PriceSourceInfo(icon: "questionmark.circle", color: .gray, label: "Price not found", detail: "Page loaded but no price detected", badge: "Unknown")
        }

        // Direct fetch success (no change / price dropped)
        if text.contains("— no change") || text.contains("Price dropped") || text.contains("Current price:") {
            return PriceSourceInfo(icon: "checkmark.seal.fill", color: .green, label: "Verified from retailer", detail: "Price fetched directly from the product page", badge: "Verified")
        }

        // Default
        return PriceSourceInfo(icon: "circle", color: .gray, label: "Price data", detail: "Steward is monitoring this product", badge: "Tracked")
    }

    private func autoActSupportedForURL(_ url: String) -> Bool {
        let lower = url.lowercased()
        let supportedDomains = [
            "amazon.com", "target.com", "walmart.com", "bestbuy.com",
            "nike.com", "adidas.com", "costco.com",
            "myshopify.com", "shopify.com",
        ]
        return supportedDomains.contains { lower.contains($0) }
    }

    // MARK: - Price Drop Notify Section

    @ViewBuilder
    private var priceDropNotifySection: some View {
        if watch.actionType == .price {
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 8) {
                    Image(systemName: "arrow.down.circle.fill")
                        .font(.system(size: 12))
                        .foregroundStyle(Theme.accent)
                        .frame(width: 28, height: 28)
                        .background(Theme.accentLight)
                        .clipShape(RoundedRectangle(cornerRadius: 8))

                    Text("Price Alerts")
                        .font(Theme.body(14, weight: .semibold))
                        .foregroundStyle(Theme.ink)

                    Spacer()
                }

                Toggle(isOn: Binding(
                    get: { watch.notifyAnyPriceDrop },
                    set: { newValue in
                        watch.notifyAnyPriceDrop = newValue
                        try? viewModel.saveAndSync(watch)
                    }
                )) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Notify on any price drop")
                            .font(Theme.body(13, weight: .medium))
                            .foregroundStyle(Theme.ink)
                        Text("Alert me whenever the price decreases, even by a small amount")
                            .font(Theme.body(11))
                            .foregroundStyle(Theme.inkLight)
                    }
                }
                .tint(Theme.accent)
            }
            .padding(16)
            .background(Theme.bgCard)
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(Theme.border, lineWidth: 1)
            )
        }
    }

    // MARK: - Visit Website

    @State private var urlCopied = false

    private var visitWebsiteCard: some View {
        HStack(spacing: 8) {
            Button {
                showBrowser = true
            } label: {
                HStack(spacing: 12) {
                    Image(systemName: "globe")
                        .font(.system(size: 16))
                        .foregroundStyle(Theme.accent)
                        .frame(width: 36, height: 36)
                        .background(Theme.accentLight)
                        .clipShape(RoundedRectangle(cornerRadius: 10))

                    VStack(alignment: .leading, spacing: 2) {
                        Text(L10n.t("detail.visit_website"))
                            .font(Theme.body(13, weight: .semibold))
                            .foregroundStyle(Theme.ink)

                        Text(watch.actionURL ?? watch.url)
                            .font(Theme.body(11))
                            .foregroundStyle(Theme.inkLight)
                            .lineLimit(1)
                            .truncationMode(.middle)
                    }

                    Spacer()

                    Image(systemName: "arrow.up.right")
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
            }
            .buttonStyle(.plain)

            // Copy URL button
            Button {
                UIPasteboard.general.string = watch.actionURL ?? watch.url
                withAnimation(.spring(response: 0.3)) { urlCopied = true }
                DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                    withAnimation { urlCopied = false }
                }
            } label: {
                Image(systemName: urlCopied ? "checkmark" : "doc.on.doc")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(urlCopied ? Theme.accent : Theme.inkMid)
                    .frame(width: 44, height: 44)
                    .background(Theme.bgCard)
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                    .overlay(
                        RoundedRectangle(cornerRadius: 14)
                            .stroke(Theme.border, lineWidth: 1)
                    )
            }
            .buttonStyle(.plain)
        }
        .padding(.top, 4)
    }

    // MARK: - Delete Watch Button

    private var deleteWatchButton: some View {
        Button {
            showDeleteConfirm = true
        } label: {
            HStack(spacing: 8) {
                Image(systemName: "trash")
                    .font(.system(size: 14))
                Text(L10n.t("detail.delete_watch"))
                    .font(Theme.body(14, weight: .medium))
            }
            .foregroundStyle(Theme.red)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(Theme.redLight)
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .stroke(Theme.red.opacity(0.3), lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
        .padding(.top, 16)
    }

    // MARK: - Share Card (Feature 3)

    private var shareCard: some View {
        Button {
            showShareSheet = true
        } label: {
            HStack(spacing: 12) {
                Image(systemName: "person.2")
                    .font(.system(size: 16))
                    .foregroundStyle(Theme.accent)
                    .frame(width: 36, height: 36)
                    .background(Theme.accentLight)
                    .clipShape(RoundedRectangle(cornerRadius: 10))

                VStack(alignment: .leading, spacing: 2) {
                    Text(L10n.t("detail.share_watch"))
                        .font(Theme.body(13, weight: .semibold))
                        .foregroundStyle(Theme.ink)

                    Text("Invite a friend to watch this too")
                        .font(Theme.body(11))
                        .foregroundStyle(Theme.inkLight)
                }

                Spacer()

                Image(systemName: "arrow.up.forward")
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
        }
        .buttonStyle(.plain)
        .padding(.top, 4)
    }

    // MARK: - Watch History (Real Data from Supabase)

    private var recentChecks: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(L10n.t("detail.watch_history"))
                    .font(Theme.serif(15, weight: .semibold))
                    .foregroundStyle(Theme.ink)

                Spacer()

                if isLoadingChecks {
                    ProgressView()
                        .controlSize(.small)
                }
            }
            .padding(.top, 8)

            if checkResults.isEmpty && !isLoadingChecks {
                // Empty state
                HStack {
                    Image(systemName: "clock")
                        .font(.system(size: 14))
                        .foregroundStyle(Theme.inkLight)

                    Text("No results yet — Steward will start monitoring soon")
                        .font(Theme.body(12))
                        .foregroundStyle(Theme.inkLight)
                }
                .padding(.vertical, 16)
            } else {
                VStack(spacing: 0) {
                    ForEach(Array(checkResults.enumerated()), id: \.element.id) { index, result in
                        HStack(spacing: 8) {
                            // Timestamp
                            Text(result.checkedAt.formatted(.relative(presentation: .named)))
                                .font(Theme.body(11))
                                .foregroundStyle(Theme.inkMid)
                                .frame(width: 80, alignment: .leading)

                            // Price badge (if available)
                            if let price = result.price, price > 0 {
                                Text(Theme.formatPrice(price))
                                    .font(Theme.body(12, weight: .semibold))
                                    .foregroundStyle(result.changed ? Theme.accent : Theme.ink)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 3)
                                    .background(result.changed ? Theme.accentLight : Theme.bgDeep)
                                    .clipShape(Capsule())
                            }

                            Spacer()

                            // Status text
                            let isError = result.resultText.contains("not found") ||
                                result.resultText.contains("Could not reach") ||
                                result.resultText.hasPrefix("Error:") ||
                                result.resultText.hasPrefix("HTTP")

                            Text(result.resultText)
                                .font(Theme.body(11, weight: result.changed ? .semibold : .regular))
                                .foregroundStyle(result.changed ? Theme.accent : isError ? Theme.gold : Theme.inkLight)
                                .lineLimit(2)
                                .multilineTextAlignment(.trailing)
                        }
                        .padding(.vertical, 10)

                        if index < checkResults.count - 1 {
                            Divider().foregroundStyle(Theme.border)
                        }
                    }
                }
            }
        }
    }
}
