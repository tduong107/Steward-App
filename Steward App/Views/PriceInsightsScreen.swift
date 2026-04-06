import SwiftUI
import Charts

struct PriceInsightsScreen: View {
    @Environment(WatchViewModel.self) private var viewModel
    @Environment(SupabaseService.self) private var supabase
    @Environment(\.dismiss) private var dismiss

    /// Price data for each watch (keyed by watch ID)
    @State private var priceData: [UUID: [PricePoint]] = [:]
    @State private var dealInsights: [UUID: DealInsight] = [:]
    @State private var isLoading = true
    @State private var sortBy: PriceSortOption = .name

    enum PriceSortOption: String, CaseIterable {
        case name = "Name"
        case priceAsc = "Price Low"
        case priceDesc = "Price High"
        case bestDeal = "Best Deal"
    }

    /// Only price-related watches
    private var priceWatches: [Watch] {
        let filtered = viewModel.watches.filter { watch in
            watch.actionType == .price ||
            watch.condition.lowercased().contains("price") ||
            watch.actionLabel.lowercased().contains("price")
        }
        switch sortBy {
        case .name:
            return filtered.sorted { $0.name < $1.name }
        case .priceAsc:
            return filtered.sorted { (priceData[$0.id]?.last?.price ?? 0) < (priceData[$1.id]?.last?.price ?? 0) }
        case .priceDesc:
            return filtered.sorted { (priceData[$0.id]?.last?.price ?? 0) > (priceData[$1.id]?.last?.price ?? 0) }
        case .bestDeal:
            return filtered.sorted { (dealInsights[$0.id]?.rating.rank ?? 0) > (dealInsights[$1.id]?.rating.rank ?? 0) }
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

                // Sort options
                if !priceWatches.isEmpty {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(PriceSortOption.allCases, id: \.self) { option in
                                Button {
                                    withAnimation(.spring(response: 0.3)) { sortBy = option }
                                } label: {
                                    Text(option.rawValue)
                                        .font(Theme.body(12, weight: .semibold))
                                        .foregroundStyle(sortBy == option ? .white : Theme.inkMid)
                                        .padding(.horizontal, 12)
                                        .padding(.vertical, 6)
                                        .background(sortBy == option ? Theme.accent : Theme.bgCard)
                                        .clipShape(Capsule())
                                        .overlay(
                                            Capsule()
                                                .stroke(sortBy == option ? Color.clear : Theme.border, lineWidth: 1)
                                        )
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding(.horizontal, 24)
                    }
                }

                if isLoading {
                    loadingState
                } else if priceWatches.isEmpty {
                    emptyState
                } else {
                    // Watch list with inline charts
                    VStack(spacing: 14) {
                        ForEach(priceWatches) { watch in
                            VStack(spacing: 0) {
                                PriceWatchRow(
                                    watch: watch,
                                    priceHistory: priceData[watch.id] ?? [],
                                    dealInsight: dealInsights[watch.id],
                                    onTap: {
                                        viewModel.openDetail(for: watch)
                                    }
                                )

                                // Compact inline chart preview
                                if let points = priceData[watch.id], points.count >= 2 {
                                    compactChart(points: points)
                                        .padding(.top, -1) // Visually connect with row above
                                }
                            }
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

    // MARK: - Compact Chart

    private func compactChart(points: [PricePoint]) -> some View {
        let minPrice = (points.map(\.price).min() ?? 0) * 0.97
        let maxPrice = (points.map(\.price).max() ?? 100) * 1.03
        let priceChange: Double = {
            guard points.count >= 2,
                  let first = points.first, let last = points.last,
                  first.price > 0 else { return 0.0 }
            return ((last.price - first.price) / first.price) * 100
        }()
        let chartColor: Color = priceChange >= 0 ? Theme.red : Theme.accent

        return VStack(alignment: .leading, spacing: 8) {
            // Current price + change
            HStack(alignment: .firstTextBaseline, spacing: 6) {
                if let current = points.last {
                    Text(formatPrice(current.price))
                        .font(Theme.serif(18, weight: .bold))
                        .foregroundStyle(Theme.ink)
                }

                if points.count >= 2 {
                    HStack(spacing: 2) {
                        Image(systemName: priceChange >= 0 ? "arrow.up.right" : "arrow.down.right")
                            .font(.system(size: 9, weight: .bold))
                        Text("\(priceChange >= 0 ? "+" : "")\(String(format: "%.1f", priceChange))%")
                            .font(Theme.body(11, weight: .semibold))
                    }
                    .foregroundStyle(chartColor)
                }

                Spacer()

                // Date range
                if let first = points.first?.date, let last = points.last?.date {
                    let days = max(1, Calendar.current.dateComponents([.day], from: first, to: last).day ?? 1)
                    Text("\(days)d")
                        .font(Theme.body(10, weight: .medium))
                        .foregroundStyle(Theme.inkLight)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(Theme.bgDeep)
                        .clipShape(Capsule())
                }
            }

            // Chart
            Chart(points) { point in
                AreaMark(
                    x: .value("Date", point.date),
                    yStart: .value("Min", minPrice),
                    yEnd: .value("Price", point.price)
                )
                .foregroundStyle(
                    LinearGradient(
                        colors: [chartColor.opacity(0.15), chartColor.opacity(0.02)],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )

                LineMark(
                    x: .value("Date", point.date),
                    y: .value("Price", point.price)
                )
                .foregroundStyle(chartColor)
                .lineStyle(StrokeStyle(lineWidth: 2))
            }
            .chartYScale(domain: minPrice...maxPrice)
            .chartXAxis(.hidden)
            .chartYAxis {
                AxisMarks(position: .leading, values: .automatic(desiredCount: 3)) { value in
                    AxisValueLabel {
                        if let price = value.as(Double.self) {
                            Text(formatPrice(price))
                                .font(Theme.body(9))
                                .foregroundStyle(Theme.inkLight)
                        }
                    }
                }
            }
            .chartLegend(.hidden)
            .frame(height: 120)

            // Low / High badges
            HStack(spacing: 10) {
                if let low = PricePoint.lowestPrice(in: points) {
                    compactBadge(label: "Low", price: low.price, color: Theme.accent, icon: "arrow.down")
                }
                if let high = PricePoint.highestPrice(in: points) {
                    compactBadge(label: "High", price: high.price, color: Theme.red, icon: "arrow.up")
                }
            }
        }
        .padding(14)
        .background(Theme.bgCard)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(Theme.border, lineWidth: 1)
        )
        .shadow(color: .black.opacity(0.04), radius: 8, y: 4)
    }

    private func compactBadge(label: String, price: Double, color: Color, icon: String) -> some View {
        HStack(spacing: 5) {
            Image(systemName: icon)
                .font(.system(size: 9, weight: .bold))
                .foregroundStyle(color)

            Text(label)
                .font(Theme.body(10))
                .foregroundStyle(Theme.inkLight)

            Text(formatPrice(price))
                .font(Theme.body(10, weight: .semibold))
                .foregroundStyle(Theme.ink)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 5)
        .background(Theme.bgDeep)
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }

    private func formatPrice(_ price: Double) -> String {
        "$\(String(format: "%.2f", price))"
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
