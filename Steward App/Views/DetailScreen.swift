import SwiftUI
import Supabase

struct DetailScreen: View {
    let watch: Watch
    @Environment(WatchViewModel.self) private var viewModel
    @Environment(SupabaseService.self) private var supabase
    @Environment(SubscriptionManager.self) private var subscriptionManager
    @Environment(\.dismiss) private var dismiss
    @Environment(\.openURL) private var openURL

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

    // Auto-cart session probe — result of tapping "Test Session" on the
    // Auto-Cart Status section. Nil = never run in this view session.
    @State private var sessionProbeResult: (loggedIn: Bool, detail: String)?
    @State private var isProbingSession = false

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
            await viewModel.syncFromCloud() // Don't force — uses 3-second throttle to avoid redundant API calls
            // Load check results and price history concurrently (they're independent)
            async let checksTask: () = loadCheckResults()
            async let pricesTask: () = showsPriceChart ? loadPriceHistory() : ()
            _ = await (checksTask, pricesTask)
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
                // Search-mode watches track the best-of-multiple-retailers price, so
                // "fake deal" heuristics (which assume a single seller) don't apply.
                dealInsight = DealAnalyzer.analyze(
                    history: realPoints,
                    isSearchMode: watch.watchMode == "search"
                )
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
                        CachedAsyncImage(url: url) { image in
                            image
                                .resizable()
                                .scaledToFill()
                        } placeholder: {
                            Text(watch.emoji)
                                .font(.system(size: 26))
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
            // Error / needs attention / paused banner.
            // Show for any of:
            //  - watch.needsAttention (existing behavior)
            //  - watch.status == .paused (so the user knows checks have stopped)
            // BUT skip if the expired-date banner will show instead (covers its own UX).
            if (watch.needsAttention || watch.status == .paused) && watch.expiredDateString == nil {
                warningBanner
            }

            // Expired date warning (uses shared Watch.expiredDateString)
            if let expiredDate = watch.expiredDateString {
                VStack(alignment: .leading, spacing: 12) {
                    HStack(spacing: 6) {
                        Image(systemName: watch.status == .paused ? "pause.circle.fill" : "calendar.badge.exclamationmark")
                            .font(.system(size: 14))
                            .foregroundStyle(.orange)
                        Text(watch.status == .paused ? "PAUSED • Date has passed" : "Date has passed")
                            .font(Theme.body(13, weight: .bold))
                            .foregroundStyle(.orange)
                    }

                    Text(watch.status == .paused
                        ? "This watch was for \(expiredDate) and has been paused because the date passed. Update the date to resume checking, or remove it to free up a slot."
                        : "This watch was for \(expiredDate) which has already passed. Update the date or remove this watch to free up a slot.")
                        .font(Theme.body(13))
                        .foregroundStyle(Theme.inkMid)

                    HStack(spacing: 10) {
                        Button {
                            viewModel.openChatWithContext("I need to update my \"\(watch.name)\" watch. The date has passed. Can you help me set a new date?")
                        } label: {
                            Text("Update")
                                .font(Theme.body(13, weight: .semibold))
                                .foregroundStyle(.orange)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 10)
                                .background(Color.orange.opacity(0.12))
                                .clipShape(RoundedRectangle(cornerRadius: 10))
                        }
                        .buttonStyle(.plain)

                        Button {
                            viewModel.removeWatch(watch)
                            dismiss()
                        } label: {
                            Text("Remove")
                                .font(Theme.body(13, weight: .semibold))
                                .foregroundStyle(.red)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 10)
                                .background(Color.red.opacity(0.12))
                                .clipShape(RoundedRectangle(cornerRadius: 10))
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(16)
                .background(Color.orange.opacity(0.08))
                .clipShape(RoundedRectangle(cornerRadius: 14))
                .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.orange.opacity(0.2), lineWidth: 1))
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

            // Top Prices list (search-mode watches) — shown directly under the
            // chart so the actionable comparison is the first thing the user
            // sees, not buried below the details/settings rows.
            if watch.watchMode == "search" && !watch.topOffers.isEmpty {
                topPricesSection
            }

            // Excluded sources (search-mode watches only, shown only if user has excluded any)
            if watch.watchMode == "search" && !watch.excludedSources.isEmpty {
                excludedSourcesSection
            }

            // Price Source Indicator — computed from latest check result.
            // Skipped for search-mode watches since the Top Prices section
            // above already conveys "compared across multiple stores" with
            // real data.
            if showsPriceChart, watch.watchMode != "search", let latestResult = checkResults.first {
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

            // Auto-Cart Status — visible only when the user opted into
            // Auto Add to Cart. Shows session validity + last attempt
            // outcome + a "Test Session" button.
            if watch.autoActEnabled {
                autoCartStatusSection
            }

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
    //
    // Shown when a watch is paused or flagged needs_attention. The server
    // auto-fixes watches on a 24h cooldown by itself, so this banner only
    // appears when Steward has genuinely run out of automatic options and
    // needs the user to intervene. Actions are contextual to the specific
    // problem (listing ended → replace URL, blocked domain → remove, etc.).

    private enum WarningReason {
        case endedListing       // eBay listing sold/ended, replace with a new listing
        case unreachable        // Repeatedly can't fetch — URL may have moved
        case blockedDomain      // Internal/restricted URL — can't be monitored
        case other              // Generic failure

        init(lastError: String?, changeNote: String?) {
            let text = (changeNote ?? lastError ?? "").lowercased()
            if text.contains("listing has ended") || text.contains("listing was ended") || text.contains("no longer available") {
                self = .endedListing
            } else if text.contains("restricted") || text.contains("blocked") || text.contains("internal") {
                self = .blockedDomain
            } else if text.contains("unable to reach") || text.contains("could not reach") || text.contains("after 2 days") {
                self = .unreachable
            } else {
                self = .other
            }
        }
    }

    private var warningBanner: some View {
        let isPaused = watch.status == .paused
        let reason = WarningReason(lastError: watch.lastError, changeNote: watch.changeNote)
        // Prefer change_note (server-set explanation like "listing ended") over lastError;
        // fall back to a generic message if neither is set.
        let primaryText = watch.changeNote ?? watch.lastError
            ?? (isPaused ? "This watch was paused and has stopped checking." : "This watch is having trouble checking the page.")

        return VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 6) {
                Image(systemName: isPaused ? "pause.circle.fill" : "exclamationmark.triangle.fill")
                    .font(.system(size: 12))
                    .foregroundStyle(Theme.gold)

                Text(isPaused ? "PAUSED • NEEDS YOUR HELP" : "NEEDS YOUR HELP")
                    .font(Theme.body(11, weight: .bold))
                    .foregroundStyle(Theme.gold)
                    .tracking(0.5)
            }

            Text(primaryText)
                .font(Theme.body(14, weight: .semibold))
                .foregroundStyle(Theme.ink)

            // Explanatory subtitle — sets the right expectation that Steward
            // already tried to auto-fix. No more "click Ask AI" busywork.
            Text(subtitleText(for: reason))
                .font(Theme.body(12))
                .foregroundStyle(Theme.inkMid)

            // Contextual actions. For every reason, the user can Remove.
            // For recoverable cases, they can also update the URL.
            HStack(spacing: 8) {
                if reason != .blockedDomain {
                    Button {
                        viewModel.askAIToFix(watch)
                    } label: {
                        HStack(spacing: 6) {
                            Image(systemName: "pencil")
                                .font(.system(size: 12))
                            Text(reason == .endedListing ? "Replace URL" : "Update URL")
                                .font(Theme.body(13, weight: .semibold))
                        }
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(Theme.gold)
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                    }
                    .buttonStyle(.plain)
                }

                Button {
                    viewModel.removeWatch(watch)
                    dismiss()
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: "trash")
                            .font(.system(size: 12))
                        Text("Remove")
                            .font(Theme.body(13, weight: .semibold))
                    }
                    .foregroundStyle(.red)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(Color.red.opacity(0.12))
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                    .overlay(
                        RoundedRectangle(cornerRadius: 10)
                            .stroke(Color.red.opacity(0.3), lineWidth: 1)
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

    /// Explanatory subtitle that frames the issue in terms of what Steward
    /// already tried — so the user knows they're being asked to help, not
    /// to trigger something that's redundant with the auto-fix.
    private func subtitleText(for reason: WarningReason) -> String {
        switch reason {
        case .endedListing:
            return "Steward can't revive a sold listing — please point this watch at a new listing for the same item, or remove it."
        case .blockedDomain:
            return "This URL can't be monitored. Remove this watch to free up a slot."
        case .unreachable:
            return "Steward tried to auto-fix this watch but couldn't find a working URL. Please update it with a working product page or remove the watch."
        case .other:
            return "Steward tried to auto-recover this watch but needs your help. Update the URL or remove the watch."
        }
    }

    // MARK: - Top Prices (search-mode watches)

    private var topPricesSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 6) {
                Image(systemName: "list.bullet.rectangle")
                    .font(.system(size: 12))
                    .foregroundStyle(Theme.accent)
                Text("TOP PRICES ACROSS STORES")
                    .font(Theme.body(11, weight: .bold))
                    .foregroundStyle(Theme.accent)
                    .tracking(0.5)
                Spacer()
                Text("\(watch.topOffers.count) stores")
                    .font(Theme.body(11))
                    .foregroundStyle(Theme.inkLight)
            }

            VStack(spacing: 0) {
                ForEach(Array(watch.topOffers.enumerated()), id: \.element.id) { index, offer in
                    topOfferRow(offer: offer, isBest: index == 0)
                    if index < watch.topOffers.count - 1 {
                        Divider()
                            .background(Theme.border)
                    }
                }
            }
            .background(Theme.bgCard)
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .stroke(Theme.border, lineWidth: 1)
            )

            Text("Tap a store to visit. Swipe-exclude removes a store from best-price tracking.")
                .font(Theme.body(11))
                .foregroundStyle(Theme.inkLight)
                .padding(.horizontal, 4)
        }
        .padding(.bottom, 4)
    }

    @ViewBuilder
    private func topOfferRow(offer: TopOffer, isBest: Bool) -> some View {
        HStack(spacing: 12) {
            // Price pill
            VStack(alignment: .leading, spacing: 2) {
                Text(String(format: "$%.2f", offer.price))
                    .font(Theme.body(15, weight: .bold))
                    .foregroundStyle(isBest ? Theme.accent : Theme.ink)

                HStack(spacing: 4) {
                    if isBest {
                        Image(systemName: "star.fill")
                            .font(.system(size: 8))
                            .foregroundStyle(Theme.accent)
                    }
                    Text(offer.source)
                        .font(Theme.body(12, weight: .medium))
                        .foregroundStyle(Theme.inkMid)
                        .lineLimit(1)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            // Visit button
            if let urlString = offer.url, let url = URL(string: urlString) {
                Button {
                    openURL(url)
                } label: {
                    Image(systemName: "arrow.up.right.square")
                        .font(.system(size: 16))
                        .foregroundStyle(Theme.accent)
                        .frame(width: 36, height: 36)
                        .background(Theme.accentLight)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                }
                .buttonStyle(.plain)
            }

            // Exclude button — confirms before removing so users don't drop a store by accident
            Button {
                viewModel.excludeSource(watch, source: offer.source)
            } label: {
                Image(systemName: "eye.slash")
                    .font(.system(size: 14))
                    .foregroundStyle(Theme.inkMid)
                    .frame(width: 36, height: 36)
                    .background(Theme.bgDeep)
                    .clipShape(RoundedRectangle(cornerRadius: 8))
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Exclude \(offer.source) from best-price tracking")
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .contentShape(Rectangle())
    }

    // MARK: - Excluded Sources

    private var excludedSourcesSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: "eye.slash.fill")
                    .font(.system(size: 11))
                    .foregroundStyle(Theme.inkMid)
                Text("EXCLUDED STORES")
                    .font(Theme.body(11, weight: .bold))
                    .foregroundStyle(Theme.inkMid)
                    .tracking(0.5)
            }
            Text("These stores are hidden from best-price tracking. Tap any to re-include.")
                .font(Theme.body(11))
                .foregroundStyle(Theme.inkLight)
                .fixedSize(horizontal: false, vertical: true)

            // Simple vertical list of excluded-store chips. For most watches
            // the list is short (1-3 items), so a grid isn't needed.
            VStack(alignment: .leading, spacing: 6) {
                ForEach(watch.excludedSources, id: \.self) { source in
                    Button {
                        viewModel.reincludeSource(watch, source: source)
                    } label: {
                        HStack(spacing: 6) {
                            Text(source)
                                .font(Theme.body(12, weight: .medium))
                                .foregroundStyle(Theme.inkMid)
                            Spacer()
                            Text("Re-include")
                                .font(Theme.body(11))
                                .foregroundStyle(Theme.accent)
                            Image(systemName: "arrow.uturn.backward.circle.fill")
                                .font(.system(size: 12))
                                .foregroundStyle(Theme.accent)
                        }
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(Theme.bgDeep)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Theme.bgCard)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(Theme.border, lineWidth: 1)
        )
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

            if let domain = watch.altSourceDomain {
                if let price = watch.altSourcePrice {
                    Text("\(watch.name) is also on \(domain) for $\(String(format: "%.2f", price))")
                        .font(Theme.body(14, weight: .semibold))
                        .foregroundStyle(Theme.ink)
                } else {
                    Text("\(watch.name) is also on \(domain)")
                        .font(Theme.body(14, weight: .semibold))
                        .foregroundStyle(Theme.ink)
                }
            }

            Text(altSourceExplanation)
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
                // For Pro+ users: show "Smart Cart Link" (replaces basic notify since it's strictly better)
                // "Smart Cart Link" was previously called "Notify + Quick Link" — renamed
                // across iOS + web for consistency with the Tier 6 honesty reframe.
                if subscriptionManager.currentTier.hasQuickLink && watch.actionType != .notify {
                    autoActOption(
                        icon: "link",
                        title: "Smart Cart Link",
                        subtitle: "One-tap notification that opens your cart pre-filled on the retailer's site or app.",
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
                        subtitle: "Push notification when your condition is met. You decide what to do next.",
                        isSelected: !watch.autoActEnabled,
                        isAvailable: true
                    ) {
                        watch.autoActEnabled = false
                        try? viewModel.saveAndSync(watch)
                    }

                    // Show Smart Cart Link as locked option for Free users
                    if watch.actionType != .notify {
                        Divider().foregroundStyle(Theme.border).padding(.leading, 44)

                        autoActOption(
                            icon: "link",
                            title: "Smart Cart Link",
                            subtitle: "One-tap notification that opens your cart pre-filled on the retailer.",
                            isSelected: false,
                            isAvailable: false,
                            tierBadge: "Pro"
                        ) {
                            subscriptionManager.presentPaywall(highlighting: .pro, reason: "Smart Cart Link is a Pro feature")
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
                            ? "Steward tries to add to cart automatically. If the retailer declines or your session expires, you'll get a Smart Cart Link instead."
                            : "Not wired up for this retailer yet — you'll get a Smart Cart Link notification on trigger.",
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
                        subtitle: "Coming soon for Premium. For now, triggers send a notification with a one-tap booking link.",
                        isSelected: false,
                        isAvailable: false,
                        tierBadge: "Premium"
                    ) { subscriptionManager.presentPaywall(highlighting: .premium, reason: "Auto Book is coming soon for Premium users") }
                case .form:
                    autoActOption(
                        icon: "doc.badge.plus",
                        title: "Auto Fill & Submit",
                        subtitle: "Coming soon. For now, triggers send a notification with a link to the form.",
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

    /// Detects if the watch has a date in the condition/URL that has already passed
    private var watchExpiredDate: String? {
        let text = "\(watch.condition) \(watch.url)"
        let today = Calendar.current.startOfDay(for: Date())

        // Try date=YYYY-MM-DD pattern
        if let range = text.range(of: #"date=(\d{4}-\d{2}-\d{2})"#, options: .regularExpression),
           let dateStr = text[range].split(separator: "=").last {
            let formatter = DateFormatter()
            formatter.dateFormat = "yyyy-MM-dd"
            if let date = formatter.date(from: String(dateStr)), date < today {
                let display = DateFormatter()
                display.dateFormat = "MMM d, yyyy"
                return display.string(from: date)
            }
        }

        // Try "Apr 6, 2026" or "May 3" pattern
        let months: [String: Int] = ["jan":1,"feb":2,"mar":3,"apr":4,"may":5,"jun":6,"jul":7,"aug":8,"sep":9,"oct":10,"nov":11,"dec":12]
        let pattern = #"(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{1,2})(?:,?\s*(\d{4}))?"#
        if let regex = try? NSRegularExpression(pattern: pattern, options: .caseInsensitive),
           let match = regex.firstMatch(in: text, range: NSRange(text.startIndex..., in: text)) {
            let monthStr = String(text[Range(match.range(at: 1), in: text)!]).lowercased().prefix(3)
            let day = Int(text[Range(match.range(at: 2), in: text)!]) ?? 0
            let year: Int
            if match.range(at: 3).location != NSNotFound, let y = Int(text[Range(match.range(at: 3), in: text)!]) {
                year = y
            } else {
                year = Calendar.current.component(.year, from: Date())
            }
            if let month = months[String(monthStr)], day >= 1, day <= 31 {
                var components = DateComponents()
                components.year = year
                components.month = month
                components.day = day
                if let date = Calendar.current.date(from: components), date < today {
                    let display = DateFormatter()
                    display.dateFormat = "MMM d, yyyy"
                    return display.string(from: date)
                }
            }
        }

        return nil
    }

    private var altSourceExplanation: String {
        guard let domain = watch.altSourceDomain else { return "This source may provide more accurate information." }
        switch domain.lowercased() {
        case "resy.com":
            return "Resy shows real-time cancellations and last-minute openings. Steward can monitor Resy directly for faster, more accurate availability alerts."
        case "opentable.com":
            return "OpenTable shows live reservation slots. Switching may give more accurate availability data."
        default:
            if let altPrice = watch.altSourcePrice {
                return "This source has the product for $\(String(format: "%.2f", altPrice)). Switching could save you money."
            }
            return "This source may provide more accurate or up-to-date information."
        }
    }

    /// Retailer domains where `execute-action` has a working backend
    /// handler today. Keep in sync with web `AUTO_ACT_SUPPORTED_DOMAINS`
    /// in `web/src/lib/auto-act.ts`.
    ///
    /// `nike.com`, `adidas.com`, and `costco.com` were removed — modern
    /// Nike/Adidas are custom storefronts with Queue-it anti-bot, and
    /// Costco's cart-add needs a CSRF form-post we don't handle. All
    /// three fell through to the "Unsupported retailer" branch and
    /// silently failed. Leaving them off the list means the user sees
    /// "Not wired up for this retailer yet" — which is honest.
    private func autoActSupportedForURL(_ url: String) -> Bool {
        let lower = url.lowercased()
        let supportedDomains = [
            "amazon.com", "target.com", "walmart.com", "bestbuy.com",
            "myshopify.com", "shopify.com",
        ]
        return supportedDomains.contains { lower.contains($0) }
    }

    // MARK: - Auto-Cart Status Section
    //
    // Mirrors the web watch detail's Auto-Cart Status card. Shown only when
    // `watch.autoActEnabled` is true. Reports session validity (derived
    // from stored cookies' expiry) and the outcome of the last auto-cart
    // attempt. Includes a "Test Session" button that calls the
    // `probe-session` edge fn to ping the retailer with stored cookies.

    /// Inspects the watch's stored cookies and returns a simple status.
    /// Mirrors `inspectSession` in web `auto-act.ts`.
    private var sessionStatus: (label: String, hint: String, kind: SessionStatusKind) {
        // No cookies stored at all.
        guard let raw = watch.siteCookies, !raw.isEmpty else {
            return (
                "No session stored",
                "Sign in via the share sheet on a supported retailer to enable auto-cart. Until then, triggers fall back to a Smart Cart Link notification.",
                .missing
            )
        }

        // Explicitly marked inactive on a prior run.
        if let status = watch.cookieStatus, status != "active" {
            return (
                "Session expired",
                "Re-sign in via the share sheet. Until then, triggers fall back to a Smart Cart Link notification.",
                .expired
            )
        }

        // Parse cookie array to find earliest non-expired expiry.
        guard let data = raw.data(using: .utf8),
              let cookies = try? JSONDecoder().decode([SerializedCookieRef].self, from: data) else {
            return ("Session status unknown", "Steward couldn't parse the stored cookies. Re-sign in via the share sheet.", .missing)
        }

        let now = Date().timeIntervalSince1970
        let datedCookies = cookies.compactMap { $0.expiresDate }.filter { $0 > 0 }
        let validDated = datedCookies.filter { $0 > now }

        if !datedCookies.isEmpty && validDated.isEmpty {
            return ("Session expired", "All stored cookies have expired. Re-sign in via the share sheet.", .expired)
        }

        // Earliest upcoming expiry → human label.
        if let earliest = validDated.min() {
            let secondsRemaining = earliest - now
            let days = Int(secondsRemaining / 86400)
            let hours = Int(secondsRemaining / 3600)
            let expiryText = days >= 1 ? "\(days) day\(days == 1 ? "" : "s")" : "\(hours) hour\(hours == 1 ? "" : "s")"
            return (
                "Session active · expires in \(expiryText)",
                watch.cookieDomain.map { "Signed into \($0)." } ?? "Auto-cart is armed for this watch.",
                .active
            )
        }

        return ("Session active", "Auto-cart is armed for this watch.", .active)
    }

    /// Shape for decoding the `site_cookies` JSON column. Only fields we
    /// inspect locally are typed — everything else is ignored.
    private struct SerializedCookieRef: Decodable {
        let expiresDate: Double?
    }

    /// Three states we render for a watch's captured session. `.missing`
    /// used to be named `.none` which clashed with `Optional.none` during
    /// tuple-return type inference and broke the build under Xcode; keep
    /// it as `.missing` to preserve that unambiguity.
    private enum SessionStatusKind {
        case active, expired, missing
    }

    private var autoCartStatusSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 8) {
                Image(systemName: "bolt.circle.fill")
                    .font(.system(size: 12))
                    .foregroundStyle(Theme.accent)
                    .frame(width: 28, height: 28)
                    .background(Theme.accentLight)
                    .clipShape(RoundedRectangle(cornerRadius: 8))

                Text("Auto-Cart Status")
                    .font(Theme.body(14, weight: .semibold))
                    .foregroundStyle(Theme.ink)

                Spacer()

                Text("PREMIUM")
                    .font(Theme.body(10, weight: .bold))
                    .foregroundStyle(Theme.gold)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(Theme.gold.opacity(0.12))
                    .clipShape(Capsule())
            }

            // Session row
            let session = sessionStatus
            HStack(alignment: .top, spacing: 10) {
                Image(systemName: session.kind == .active
                      ? "checkmark.shield.fill"
                      : session.kind == .expired
                        ? "exclamationmark.shield.fill"
                        : "circle.slash")
                    .font(.system(size: 16))
                    .foregroundStyle(session.kind == .active
                                     ? Color.green
                                     : session.kind == .expired
                                       ? Color.orange
                                       : Theme.inkLight)
                    .frame(width: 24)
                VStack(alignment: .leading, spacing: 2) {
                    Text(session.label)
                        .font(Theme.body(13, weight: .semibold))
                        .foregroundStyle(Theme.ink)
                    Text(session.hint)
                        .font(Theme.body(11))
                        .foregroundStyle(Theme.inkMid)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Spacer(minLength: 0)
            }
            .padding(10)
            .background(
                session.kind == .active ? Color.green.opacity(0.08)
                : session.kind == .expired ? Color.orange.opacity(0.08)
                : Theme.bgDeep
            )
            .clipShape(RoundedRectangle(cornerRadius: 10))

            // Last-attempt row
            HStack(alignment: .top, spacing: 10) {
                Image(systemName: watch.actionExecuted ? "cart.fill" : "clock")
                    .font(.system(size: 16))
                    .foregroundStyle(watch.actionExecuted ? Color.green : Theme.inkLight)
                    .frame(width: 24)
                VStack(alignment: .leading, spacing: 2) {
                    if watch.actionExecuted, let at = watch.actionExecutedAt {
                        Text("Added to cart · \(at.formatted(.relative(presentation: .named)))")
                            .font(Theme.body(13, weight: .semibold))
                            .foregroundStyle(Theme.ink)
                        Text(watch.changeNote ?? "Auto-cart fired successfully on the last trigger.")
                            .font(Theme.body(11))
                            .foregroundStyle(Theme.inkMid)
                            .lineLimit(2)
                    } else {
                        Text("No auto-cart attempts yet")
                            .font(Theme.body(13, weight: .semibold))
                            .foregroundStyle(Theme.ink)
                        Text(autoActSupportedForURL(watch.url)
                             ? "This watch will attempt auto-cart the next time it triggers."
                             : "Auto-cart isn't wired up for this retailer yet — triggers fall back to a Smart Cart Link.")
                            .font(Theme.body(11))
                            .foregroundStyle(Theme.inkMid)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
                Spacer(minLength: 0)
            }
            .padding(10)
            .background(watch.actionExecuted ? Color.green.opacity(0.08) : Theme.bgDeep)
            .clipShape(RoundedRectangle(cornerRadius: 10))

            // Test Session button — only when we have cookies AND the
            // retailer is on the supported list (otherwise probe-session
            // returns a trivial local-only result and wastes a round-trip).
            if session.kind != .missing && autoActSupportedForURL(watch.url) {
                HStack(spacing: 10) {
                    Button {
                        Task { await probeSessionNow() }
                    } label: {
                        HStack(spacing: 6) {
                            if isProbingSession {
                                ProgressView().controlSize(.small)
                            } else {
                                Image(systemName: "antenna.radiowaves.left.and.right")
                                    .font(.system(size: 11, weight: .semibold))
                            }
                            Text(isProbingSession ? "Testing…" : "Test Session")
                                .font(Theme.body(12, weight: .semibold))
                        }
                        .foregroundStyle(Theme.accent)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(Theme.accentLight)
                        .clipShape(Capsule())
                    }
                    .disabled(isProbingSession)

                    if let result = sessionProbeResult {
                        HStack(alignment: .top, spacing: 6) {
                            Image(systemName: result.loggedIn ? "checkmark.circle.fill" : "exclamationmark.triangle.fill")
                                .font(.system(size: 11))
                                .foregroundStyle(result.loggedIn ? Color.green : Color.orange)
                            Text(result.detail)
                                .font(Theme.body(11))
                                .foregroundStyle(Theme.inkMid)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }

                    Spacer(minLength: 0)
                }
            }
        }
        .padding(16)
        .background(Theme.bgCard)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Theme.border, lineWidth: 1)
        )
    }

    /// Triggers a call to the probe-session edge function and updates
    /// `sessionProbeResult` with the outcome. Called from the Test Session
    /// button. Safe to call repeatedly — the button disables itself while
    /// a probe is in flight.
    @MainActor
    private func probeSessionNow() async {
        isProbingSession = true
        defer { isProbingSession = false }
        do {
            let userId = try await SupabaseConfig.client.auth.session.user.id
            let result = try await supabase.probeSession(watchId: watch.id, userId: userId)
            sessionProbeResult = (loggedIn: result.logged_in, detail: result.detail)
        } catch {
            sessionProbeResult = (loggedIn: false, detail: "Couldn't reach the probe service. Try again shortly.")
        }
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
