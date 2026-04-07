import SwiftUI
import Charts

struct SavingsScreen: View {
    @Environment(WatchViewModel.self) private var viewModel
    @Environment(SubscriptionManager.self) private var subscriptionManager

    enum Segment: String, CaseIterable {
        case priceInsights = "Price Insights"
        case priceChanges = "Price Changes"
    }

    enum PriceFilter: String, CaseIterable {
        case all = "All"
        case greatDeal = "Great Deal"
        case goodPrice = "Good Price"
        case fairPrice = "Fair Price"
        case overpriced = "Overpriced"
    }

    enum ChangeSortOption: String, CaseIterable {
        case dateNewest = "Newest"
        case dateOldest = "Oldest"
        case biggestSavings = "Biggest"
        case watchName = "Name"
    }

    @State private var selectedSegment: Segment = .priceInsights
    @State private var priceFilter: PriceFilter = .all
    @State private var changeSortBy: ChangeSortOption = .dateNewest

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                headerSection
                    .padding(.bottom, 20)

                // Savings milestone card
                if viewModel.savingsCalculation.totalSavings > 0 {
                    SavingsMilestoneCard(calculation: viewModel.savingsCalculation)
                        .padding(.horizontal, 24)
                        .padding(.bottom, 16)
                }

                // Segment picker
                segmentPicker
                    .padding(.horizontal, 24)
                    .padding(.bottom, 12)

                // Content based on segment
                switch selectedSegment {
                case .priceInsights:
                    priceInsightsSegment
                case .priceChanges:
                    priceChangesSegment
                }
            }
        }
        .refreshable {
            await viewModel.syncFromCloud(force: true)
        }
        .background(Theme.bg)
    }

    // MARK: - Header

    private var headerSection: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 8) {
                Text("Savings & Insights")
                    .font(Theme.serif(22, weight: .bold))
                    .foregroundStyle(Theme.ink)

                Image(systemName: "sparkles")
                    .font(.system(size: 14))
                    .foregroundStyle(Theme.accent)
            }

            Text("Track prices and find deals across your watches")
                .font(Theme.body(13))
                .foregroundStyle(Theme.inkLight)
        }
        .padding(.horizontal, 24)
        .padding(.top, 20)
    }

    // MARK: - Segment Picker

    private var segmentPicker: some View {
        HStack(spacing: 0) {
            ForEach(Segment.allCases, id: \.self) { segment in
                Button {
                    withAnimation(.spring(response: 0.3)) {
                        selectedSegment = segment
                    }
                } label: {
                    Text(segment.rawValue)
                        .font(Theme.body(13, weight: .semibold))
                        .foregroundStyle(selectedSegment == segment ? .white : Theme.inkMid)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(selectedSegment == segment ? Theme.accent : Color.clear)
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                }
                .buttonStyle(.plain)
            }
        }
        .padding(3)
        .background(Theme.bgDeep)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Theme.border, lineWidth: 1)
        )
    }

    // MARK: - Price Insights Segment

    private var filteredPriceWatches: [Watch] {
        let watches = viewModel.priceWatches
        switch priceFilter {
        case .all:
            return watches
        case .greatDeal:
            return watches.filter { viewModel.dealInsights[$0.id]?.rating == .greatDeal }
        case .goodPrice:
            return watches.filter { viewModel.dealInsights[$0.id]?.rating == .goodPrice }
        case .fairPrice:
            return watches.filter { viewModel.dealInsights[$0.id]?.rating == .fairPrice }
        case .overpriced:
            return watches.filter { viewModel.dealInsights[$0.id]?.rating == .overpriced }
        }
    }

    private var priceInsightsSegment: some View {
        VStack(spacing: 12) {
            // Filter chips by deal quality
            if !viewModel.priceWatches.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(PriceFilter.allCases, id: \.self) { filter in
                            Button {
                                withAnimation(.spring(response: 0.3)) { priceFilter = filter }
                            } label: {
                                Text(filter.rawValue)
                                    .font(Theme.body(11, weight: .semibold))
                                    .foregroundStyle(priceFilter == filter ? .white : Theme.inkMid)
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 6)
                                    .background(priceFilter == filter ? Theme.accent : Theme.bgCard)
                                    .clipShape(Capsule())
                                    .overlay(
                                        Capsule()
                                            .stroke(priceFilter == filter ? Color.clear : Theme.border, lineWidth: 1)
                                    )
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal, 24)
                }
            }

            // Watch rows
            if filteredPriceWatches.isEmpty {
                emptyState
            } else {
                VStack(spacing: 10) {
                    ForEach(filteredPriceWatches) { watch in
                        priceWatchCard(watch)
                    }
                }
                .padding(.horizontal, 24)
            }
        }
    }

    private func priceWatchCard(_ watch: Watch) -> some View {
        let history = viewModel.allPriceHistories[watch.id] ?? []
        let insight = viewModel.dealInsights[watch.id]
        let currentPrice = history.last?.price
        let previousPrice = history.dropLast().last?.price

        return Button {
            viewModel.openDetail(for: watch)
        } label: {
            VStack(spacing: 0) {
                HStack(spacing: 12) {
                    // Watch image or emoji
                    if let imageURL = watch.imageURL, let url = URL(string: imageURL) {
                        AsyncImage(url: url) { phase in
                            switch phase {
                            case .success(let image):
                                image.resizable().scaledToFill()
                            default:
                                Text(watch.emoji).font(.system(size: 18))
                            }
                        }
                        .frame(width: 40, height: 40)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                    } else {
                        Text(watch.emoji)
                            .font(.system(size: 18))
                            .frame(width: 40, height: 40)
                            .background(Theme.bgDeep)
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                    }

                    VStack(alignment: .leading, spacing: 3) {
                        Text(watch.name)
                            .font(Theme.body(13, weight: .semibold))
                            .foregroundStyle(Theme.ink)
                            .lineLimit(1)

                        // Deal quality pill
                        if let insight {
                            HStack(spacing: 4) {
                                Text(insight.rating.emoji)
                                    .font(.system(size: 10))
                                Text(insight.rating.rawValue)
                                    .font(Theme.body(10, weight: .semibold))
                            }
                            .foregroundStyle(Theme.colorFor(insight.rating.colorName))
                        }
                    }

                    Spacer()

                    // Current price + change
                    VStack(alignment: .trailing, spacing: 3) {
                        if let price = currentPrice {
                            Text(Theme.formatPrice(price))
                                .font(Theme.body(15, weight: .bold))
                                .foregroundStyle(Theme.ink)
                        }

                        if let curr = currentPrice, let prev = previousPrice, abs(curr - prev) > 0.01 {
                            let pct = ((curr - prev) / prev) * 100
                            let isDown = curr < prev
                            HStack(spacing: 2) {
                                Image(systemName: isDown ? "arrow.down.right" : "arrow.up.right")
                                    .font(.system(size: 9))
                                Text(String(format: "%.1f%%", abs(pct)))
                                    .font(Theme.body(11, weight: .medium))
                            }
                            .foregroundStyle(isDown ? Theme.green : Theme.red)
                        }
                    }

                    Image(systemName: "chevron.right")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(Theme.borderMid)
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 12)

                // Mini chart
                if history.count >= 2 {
                    miniChart(points: history)
                        .frame(height: 50)
                        .padding(.horizontal, 14)
                        .padding(.bottom, 10)
                }
            }
            .background(Theme.bgCard)
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .stroke(Theme.border, lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }

    private func miniChart(points: [PricePoint]) -> some View {
        let prices = points.map(\.price)
        let minPrice = (prices.min() ?? 0) * 0.98
        let maxPrice = (prices.max() ?? 100) * 1.02

        return Chart {
            ForEach(points) { point in
                AreaMark(
                    x: .value("Date", point.date),
                    yStart: .value("Min", minPrice),
                    yEnd: .value("Price", point.price)
                )
                .foregroundStyle(
                    LinearGradient(
                        colors: [Theme.accent.opacity(0.15), Theme.accent.opacity(0.02)],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
                .interpolationMethod(.catmullRom)

                LineMark(
                    x: .value("Date", point.date),
                    y: .value("Price", point.price)
                )
                .foregroundStyle(Theme.accent)
                .lineStyle(StrokeStyle(lineWidth: 1.5))
                .interpolationMethod(.catmullRom)
            }
        }
        .chartYScale(domain: minPrice...maxPrice)
        .chartXAxis(.hidden)
        .chartYAxis(.hidden)
    }

    // MARK: - Price Changes Segment

    struct PriceChangeItem: Identifiable {
        let id: String
        let watchId: UUID
        let watchName: String
        let watchEmoji: String
        let oldPrice: Double
        let newPrice: Double
        let date: Date
        let totalSavings: Double

        var priceDifference: Double { newPrice - oldPrice }
        var percentChange: Double {
            guard oldPrice > 0 else { return 0 }
            return ((newPrice - oldPrice) / oldPrice) * 100
        }
        var isDecrease: Bool { newPrice < oldPrice }
    }

    private var priceChangeItems: [PriceChangeItem] {
        var items: [PriceChangeItem] = []
        for watch in viewModel.watches {
            guard let history = viewModel.allPriceHistories[watch.id],
                  history.count >= 2 else { continue }
            let watchSavings = viewModel.savingsCalculation.perWatchSavings
                .first(where: { $0.id == watch.id })?.savings ?? 0
            for i in 1..<history.count {
                let prev = history[i - 1]
                let curr = history[i]
                if abs(curr.price - prev.price) > 0.01 {
                    items.append(PriceChangeItem(
                        id: "\(watch.id)-\(i)-\(curr.date.timeIntervalSince1970)",
                        watchId: watch.id,
                        watchName: watch.name,
                        watchEmoji: watch.emoji,
                        oldPrice: prev.price,
                        newPrice: curr.price,
                        date: curr.date,
                        totalSavings: watchSavings
                    ))
                }
            }
        }
        return items
    }

    private var sortedPriceChanges: [PriceChangeItem] {
        switch changeSortBy {
        case .dateNewest: return priceChangeItems.sorted { $0.date > $1.date }
        case .dateOldest: return priceChangeItems.sorted { $0.date < $1.date }
        case .biggestSavings: return priceChangeItems.sorted { abs($0.priceDifference) > abs($1.priceDifference) }
        case .watchName: return priceChangeItems.sorted { $0.watchName.localizedCaseInsensitiveCompare($1.watchName) == .orderedAscending }
        }
    }

    private var priceChangesSegment: some View {
        VStack(spacing: 12) {
            // Sort chips
            if !priceChangeItems.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(ChangeSortOption.allCases, id: \.self) { option in
                            Button {
                                withAnimation(.spring(response: 0.3)) { changeSortBy = option }
                            } label: {
                                Text(option.rawValue)
                                    .font(Theme.body(11, weight: .semibold))
                                    .foregroundStyle(changeSortBy == option ? .white : Theme.inkMid)
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 6)
                                    .background(changeSortBy == option ? Theme.accent : Theme.bgCard)
                                    .clipShape(Capsule())
                                    .overlay(
                                        Capsule()
                                            .stroke(changeSortBy == option ? Color.clear : Theme.border, lineWidth: 1)
                                    )
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal, 24)
                }
            }

            // Change rows
            if sortedPriceChanges.isEmpty {
                emptyState
            } else {
                VStack(spacing: 8) {
                    ForEach(sortedPriceChanges) { item in
                        priceChangeRow(item)
                    }
                }
                .padding(.horizontal, 24)
            }
        }
    }

    private func priceChangeRow(_ item: PriceChangeItem) -> some View {
        HStack(spacing: 12) {
            Text(item.watchEmoji)
                .font(.system(size: 20))
                .frame(width: 40, height: 40)
                .background(Theme.bgDeep)
                .clipShape(RoundedRectangle(cornerRadius: 10))

            VStack(alignment: .leading, spacing: 3) {
                Text(item.watchName)
                    .font(Theme.body(13, weight: .semibold))
                    .foregroundStyle(Theme.ink)
                    .lineLimit(1)
                Text(formatDate(item.date))
                    .font(Theme.body(11))
                    .foregroundStyle(Theme.inkLight)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 3) {
                HStack(spacing: 4) {
                    Text(Theme.formatPrice(item.oldPrice))
                        .font(Theme.body(12))
                        .foregroundStyle(Theme.inkLight)
                        .strikethrough()
                    Image(systemName: "arrow.right")
                        .font(.system(size: 8))
                        .foregroundStyle(Theme.inkLight)
                    Text(Theme.formatPrice(item.newPrice))
                        .font(Theme.body(13, weight: .semibold))
                        .foregroundStyle(item.isDecrease ? Theme.green : Theme.red)
                }
                HStack(spacing: 2) {
                    Image(systemName: item.isDecrease ? "arrow.down.right" : "arrow.up.right")
                        .font(.system(size: 9))
                    Text(String(format: "%.1f%%", abs(item.percentChange)))
                        .font(Theme.body(11, weight: .medium))
                }
                .foregroundStyle(item.isDecrease ? Theme.green : Theme.red)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
        .background(Theme.bgCard)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(Theme.border, lineWidth: 1)
        )
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "chart.line.uptrend.xyaxis")
                .font(.system(size: 36))
                .foregroundStyle(Theme.inkLight)

            VStack(spacing: 6) {
                Text(L10n.t("savings.empty.title"))
                    .font(Theme.serif(17, weight: .semibold))
                    .foregroundStyle(Theme.ink)

                Text("When Steward detects price changes,\nthey'll appear here.")
                    .font(Theme.body(13))
                    .foregroundStyle(Theme.inkLight)
                    .multilineTextAlignment(.center)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 40)
    }

    // MARK: - Formatting

    private static let relativeDateFormatter: RelativeDateTimeFormatter = {
        let f = RelativeDateTimeFormatter()
        f.unitsStyle = .short
        return f
    }()

    private func formatDate(_ date: Date) -> String {
        let interval = Date().timeIntervalSince(date)
        if interval < 86400 * 7 {
            return Self.relativeDateFormatter.localizedString(for: date, relativeTo: Date())
        }
        let f = DateFormatter()
        f.dateStyle = .medium
        f.timeStyle = .short
        return f.string(from: date)
    }
}
