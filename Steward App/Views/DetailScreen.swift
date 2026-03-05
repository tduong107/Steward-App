import SwiftUI

struct DetailScreen: View {
    let watch: Watch
    @Environment(WatchViewModel.self) private var viewModel
    @Environment(SupabaseService.self) private var supabase
    @Environment(\.dismiss) private var dismiss

    // Price history (generated once per view)
    @State private var priceHistory: [PricePoint] = []
    @State private var showShareSheet = false

    // Real check results from Supabase
    @State private var checkResults: [CheckResultDTO] = []
    @State private var isLoadingChecks = true

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
                Button {
                    showShareSheet = true
                } label: {
                    Image(systemName: "square.and.arrow.up")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(Theme.ink)
                }
                .accessibilityLabel("Share this watch")
            }
        }
        .sheet(isPresented: $showShareSheet) {
            ShareWatchSheet(watch: watch)
        }
        .onAppear {
            if priceHistory.isEmpty && showsPriceChart {
                priceHistory = PricePoint.mockHistory(for: watch.name)
            }
        }
        .task {
            await loadCheckResults()
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

    // MARK: - Header Card

    private var headerCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 14) {
                Text(watch.emoji)
                    .font(.system(size: 26))
                    .frame(width: 56, height: 56)
                    .background(Theme.bgDeep)
                    .clipShape(RoundedRectangle(cornerRadius: 16))

                VStack(alignment: .leading, spacing: 2) {
                    Text(watch.name)
                        .font(Theme.serif(18, weight: .bold))
                        .foregroundStyle(Theme.ink)

                    Text(watch.url)
                        .font(Theme.body(12))
                        .foregroundStyle(Theme.inkLight)
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
            if showsPriceChart && !priceHistory.isEmpty {
                PriceHistoryChart(points: priceHistory, accentColor: Theme.accent)
                    .padding(.bottom, 4)
            }

            DetailRow(icon: "🎯", label: "Watching for", value: watch.condition)
            DetailRow(icon: "⚡", label: "AI will", value: watch.actionLabel, highlight: watch.triggered)
            DetailRow(icon: "⏱", label: "Check frequency", value: watch.checkFrequency)
            DetailRow(icon: "🔔", label: "Notify via", value: "Push notification · Email")

            actionButton

            // Share card
            shareCard

            recentChecks
        }
        .padding(.horizontal, 24)
        .padding(.top, 16)
        .padding(.bottom, 24)
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

            Text("Your condition was met · Steward can act now")
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
                    Image(systemName: "sparkle")
                        .font(.system(size: 14))
                }
                Text(watch.triggered ? "Let Steward Act Now" : "⏳ Waiting for trigger…")
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
