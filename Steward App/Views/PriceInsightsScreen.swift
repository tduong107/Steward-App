import SwiftUI

struct PriceInsightsScreen: View {
    @Environment(WatchViewModel.self) private var viewModel
    @Environment(SupabaseService.self) private var supabase
    @Environment(\.dismiss) private var dismiss

    /// Price data for each watch (keyed by watch ID)
    @State private var priceData: [UUID: [PricePoint]] = [:]
    @State private var dealInsights: [UUID: DealInsight] = [:]
    @State private var isLoading = true

    /// Only price-related watches
    private var priceWatches: [Watch] {
        viewModel.watches.filter { watch in
            watch.actionType == .price ||
            watch.condition.lowercased().contains("price") ||
            watch.actionLabel.lowercased().contains("price")
        }
    }

    /// Count of good/great deals found
    private var greatDealCount: Int {
        dealInsights.values.filter { $0.rating == .greatDeal || $0.rating == .goodPrice }.count
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                // Header summary
                summaryCard

                if isLoading {
                    loadingState
                } else if priceWatches.isEmpty {
                    emptyState
                } else {
                    // Watch list
                    VStack(spacing: 10) {
                        ForEach(priceWatches) { watch in
                            PriceWatchRow(
                                watch: watch,
                                priceHistory: priceData[watch.id] ?? [],
                                dealInsight: dealInsights[watch.id],
                                onTap: {
                                    viewModel.openDetail(for: watch)
                                }
                            )
                        }
                    }
                }
            }
            .padding(.horizontal, 24)
            .padding(.vertical, 16)
            .padding(.bottom, 24)
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
        }
        .navigationTitle("Price Insights")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await loadAllPriceData()
        }
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Image(systemName: "chart.line.downtrend.xyaxis")
                    .font(.system(size: 16))
                    .foregroundStyle(Theme.accent)
                    .frame(width: 32, height: 32)
                    .background(Theme.accentLight)
                    .clipShape(RoundedRectangle(cornerRadius: 8))

                Text("Price Insights")
                    .font(Theme.serif(18, weight: .bold))
                    .foregroundStyle(Theme.ink)
            }

            Text("Tracking \(priceWatches.count) price\(priceWatches.count == 1 ? "" : "s")")
                .font(Theme.body(13))
                .foregroundStyle(Theme.inkMid)

            if greatDealCount > 0 {
                HStack(spacing: 6) {
                    Text("🔥")
                        .font(.system(size: 12))

                    Text("\(greatDealCount) great deal\(greatDealCount == 1 ? "" : "s") found")
                        .font(Theme.body(12, weight: .semibold))
                        .foregroundStyle(Theme.accent)
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(Theme.accentLight)
                .clipShape(Capsule())
            }

            // Deal rating legend
            if !dealInsights.isEmpty {
                dealRatingLegend
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(Theme.bgCard)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Theme.border, lineWidth: 1)
        )
        .shadow(color: .black.opacity(0.04), radius: 8, y: 4)
    }

    // MARK: - Deal Rating Legend

    private var dealRatingLegend: some View {
        let ratingCounts = Dictionary(
            grouping: dealInsights.values,
            by: { $0.rating }
        ).mapValues { $0.count }

        return HStack(spacing: 8) {
            ForEach(DealRating.allCases, id: \.self) { rating in
                if let count = ratingCounts[rating], count > 0 {
                    HStack(spacing: 3) {
                        Text(rating.emoji)
                            .font(.system(size: 10))
                        Text("\(count)")
                            .font(Theme.body(11, weight: .semibold))
                            .foregroundStyle(Theme.inkMid)
                    }
                }
            }
        }
    }

    // MARK: - Loading State

    private var loadingState: some View {
        VStack(spacing: 12) {
            ProgressView()
                .controlSize(.regular)

            Text("Analyzing prices...")
                .font(Theme.body(13))
                .foregroundStyle(Theme.inkLight)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 40)
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "chart.line.downtrend.xyaxis")
                .font(.system(size: 36))
                .foregroundStyle(Theme.inkLight)

            VStack(spacing: 6) {
                Text("No price watches yet")
                    .font(Theme.serif(17, weight: .semibold))
                    .foregroundStyle(Theme.ink)

                Text("Set up a price watch and Steward will\ntrack prices and analyze deals for you.")
                    .font(Theme.body(13))
                    .foregroundStyle(Theme.inkLight)
                    .multilineTextAlignment(.center)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 40)
    }

    // MARK: - Load Data

    private func loadAllPriceData() async {
        // Load price data for each price watch sequentially
        // (avoids MainActor isolation issues with TaskGroup + @Observable)
        for watch in priceWatches {
            do {
                let results = try await supabase.fetchPriceHistory(forWatchId: watch.id)
                let points = PricePoint.fromCheckResults(results)

                // Always use real data only — no mock fallback
                priceData[watch.id] = points

                if points.count >= 2, let insight = DealAnalyzer.analyze(history: points) {
                    dealInsights[watch.id] = insight
                }
            } catch {
                // On error, leave empty — no mock data
                priceData[watch.id] = []
            }
        }

        isLoading = false
    }
}
