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
                        Text("Back")
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
        .sheet(isPresented: $showShareSheet) {
            ShareWatchSheet(watch: watch)
        }
        .sheet(isPresented: $showBrowser) {
            if let url = watch.fullURL {
                InAppBrowser(initialURL: url) { _ in }
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
                )
            )
            .presentationDetents([.medium])
        }
        .task {
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
                    Text(watch.name)
                        .font(Theme.serif(18, weight: .bold))
                        .foregroundStyle(Theme.ink)

                    Button {
                        showBrowser = true
                    } label: {
                        HStack(spacing: 4) {
                            Text(watch.url)
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
                    .fill(watch.triggered ? Theme.accent : Theme.inkLight)
                    .frame(width: 6, height: 6)
                    .modifier(PulseModifier(enabled: watch.triggered))

                Text(watch.triggered ? "Change detected · Ready to act" : "Watching · \(watch.lastSeen)")
                    .font(Theme.body(12, weight: .semibold))
                    .foregroundStyle(watch.triggered ? Theme.accent : Theme.inkMid)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 6)
            .background(watch.triggered ? Theme.accentLight : Theme.bgDeep)
            .clipShape(Capsule())
            .overlay(
                Capsule()
                    .stroke(watch.triggered ? Theme.accentMid : Theme.border, lineWidth: 1)
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
            // Change banner
            if watch.triggered {
                changeBanner
            }

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
            DetailRow(icon: "⚡", label: "AI will", value: watch.actionLabel, highlight: watch.triggered)
            Button { showFrequencyPicker = true } label: {
                DetailRow(icon: "⏱", label: "Check frequency", value: watch.checkFrequency, showChevron: true)
            }
            .buttonStyle(.plain)
            Button { showTimePicker = true } label: {
                DetailRow(icon: "🕐", label: "Check start time", value: formatPreferredTime(watch.preferredCheckTime), showChevron: true)
            }
            .buttonStyle(.plain)
            nextCheckRow
            Button { showNotifyPicker = true } label: {
                DetailRow(icon: "🔔", label: "Notify via", value: formatNotifyChannels(watch.notifyChannels), showChevron: true)
            }
            .buttonStyle(.plain)

            // Visit website button
            visitWebsiteCard

            actionButton

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
                Text("Price History")
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
                Text("Price History")
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

                Text("Steward will start tracking prices on the next check. Price history will appear here as data is collected.")
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
            Text("DETECTED CHANGE")
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

    private func formatPreferredTime(_ time: String?) -> String {
        guard let time else { return "Not set" }
        let parts = time.split(separator: ":")
        guard parts.count == 2,
              let h = Int(parts[0]), let m = Int(parts[1]) else { return time }
        var comps = DateComponents()
        comps.hour = h
        comps.minute = m
        let formatter = DateFormatter()
        formatter.dateFormat = "h:mm a"
        if let date = Calendar.current.date(from: comps) {
            return formatter.string(from: date)
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

    // MARK: - Next Check Countdown

    private var nextCheckRow: some View {
        HStack(spacing: 12) {
            Text("⏳")
                .font(.system(size: 16))
                .frame(width: 28, alignment: .center)

            VStack(alignment: .leading, spacing: 1) {
                Text("Next check")
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

    // MARK: - Visit Website

    private var visitWebsiteCard: some View {
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
                    Text("Visit Website")
                        .font(Theme.body(13, weight: .semibold))
                        .foregroundStyle(Theme.ink)

                    Text(watch.url)
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
                Text("Delete Watch")
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
                    Text("Share this watch")
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

    // MARK: - Recent Checks (Real Data from Supabase)

    private var recentChecks: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Recent Checks")
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

                    Text("No checks yet — Steward will start monitoring soon")
                        .font(Theme.body(12))
                        .foregroundStyle(Theme.inkLight)
                }
                .padding(.vertical, 16)
            } else {
                VStack(spacing: 0) {
                    ForEach(Array(checkResults.enumerated()), id: \.element.id) { index, result in
                        HStack {
                            Text(result.checkedAt.formatted(.relative(presentation: .named)))
                                .font(Theme.body(12))
                                .foregroundStyle(Theme.inkMid)

                            Spacer()

                            Text(result.resultText)
                                .font(Theme.body(12, weight: result.changed ? .semibold : .regular))
                                .foregroundStyle(result.changed ? Theme.accent : Theme.inkLight)
                                .lineLimit(1)
                        }
                        .padding(.vertical, 11)

                        if index < checkResults.count - 1 {
                            Divider().foregroundStyle(Theme.border)
                        }
                    }
                }
            }
        }
    }
}
