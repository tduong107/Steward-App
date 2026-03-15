import SwiftUI

struct SavingsScreen: View {
    @Environment(WatchViewModel.self) private var viewModel

    enum SortOption: String, CaseIterable {
        case dateNewest = "Newest"
        case dateOldest = "Oldest"
        case biggestSavings = "Biggest Savings"
        case watchName = "Watch Name"
    }

    @State private var sortOption: SortOption = .dateNewest

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                headerSection
                    .padding(.bottom, 24)

                // Savings milestone card
                if viewModel.savingsCalculation.totalSavings > 0 {
                    SavingsMilestoneCard(calculation: viewModel.savingsCalculation)
                        .padding(.horizontal, 24)
                        .padding(.bottom, 20)
                }

                // Sort control + Price changes header
                if !priceChangeItems.isEmpty {
                    priceChangesHeader
                        .padding(.horizontal, 24)
                        .padding(.bottom, 12)

                    // Price change list
                    VStack(spacing: 8) {
                        ForEach(sortedPriceChanges) { item in
                            priceChangeRow(item)
                        }
                    }
                    .padding(.horizontal, 24)
                } else {
                    emptyState
                }
            }
        }
        .background(Theme.bg)
    }

    // MARK: - Header

    private var headerSection: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Savings")
                .font(Theme.serif(22, weight: .bold))
                .foregroundStyle(Theme.ink)

            Text("Track your price drops and total savings")
                .font(Theme.body(13))
                .foregroundStyle(Theme.inkLight)
        }
        .padding(.horizontal, 24)
        .padding(.top, 20)
    }

    // MARK: - Price Changes Header with Sort

    private var priceChangesHeader: some View {
        HStack {
            Text("Price Changes")
                .font(Theme.serif(17, weight: .semibold))
                .foregroundStyle(Theme.ink)

            Spacer()

            Menu {
                ForEach(SortOption.allCases, id: \.self) { option in
                    Button {
                        withAnimation(.spring(response: 0.3)) {
                            sortOption = option
                        }
                    } label: {
                        HStack {
                            Text(option.rawValue)
                            if sortOption == option {
                                Image(systemName: "checkmark")
                            }
                        }
                    }
                }
            } label: {
                HStack(spacing: 4) {
                    Image(systemName: "arrow.up.arrow.down")
                        .font(.system(size: 10))
                    Text(sortOption.rawValue)
                        .font(Theme.body(11, weight: .semibold))
                }
                .foregroundStyle(Theme.accent)
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(Theme.accentLight)
                .clipShape(Capsule())
            }
        }
    }

    // MARK: - Price Change Data

    /// Represents a single price change event between consecutive checks
    struct PriceChangeItem: Identifiable {
        let id = UUID()
        let watchId: UUID
        let watchName: String
        let watchEmoji: String
        let oldPrice: Double
        let newPrice: Double
        let date: Date
        let totalSavings: Double  // cumulative savings for this watch

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

            // Find the per-watch savings for this watch
            let watchSavings = viewModel.savingsCalculation.perWatchSavings
                .first(where: { $0.id == watch.id })?.savings ?? 0

            // Create change items between consecutive price points
            for i in 1..<history.count {
                let prev = history[i - 1]
                let curr = history[i]
                // Only include if the price actually changed
                if abs(curr.price - prev.price) > 0.01 {
                    items.append(PriceChangeItem(
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
        let items = priceChangeItems
        switch sortOption {
        case .dateNewest:
            return items.sorted { $0.date > $1.date }
        case .dateOldest:
            return items.sorted { $0.date < $1.date }
        case .biggestSavings:
            return items.sorted { abs($0.priceDifference) > abs($1.priceDifference) }
        case .watchName:
            return items.sorted { $0.watchName.localizedCaseInsensitiveCompare($1.watchName) == .orderedAscending }
        }
    }

    // MARK: - Price Change Row

    private func priceChangeRow(_ item: PriceChangeItem) -> some View {
        HStack(spacing: 12) {
            // Watch emoji
            Text(item.watchEmoji)
                .font(.system(size: 20))
                .frame(width: 40, height: 40)
                .background(Theme.bgDeep)
                .clipShape(RoundedRectangle(cornerRadius: 10))

            // Watch name + date
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

            // Price change
            VStack(alignment: .trailing, spacing: 3) {
                HStack(spacing: 4) {
                    Text(formatPrice(item.oldPrice))
                        .font(Theme.body(12))
                        .foregroundStyle(Theme.inkLight)
                        .strikethrough()

                    Image(systemName: "arrow.right")
                        .font(.system(size: 8))
                        .foregroundStyle(Theme.inkLight)

                    Text(formatPrice(item.newPrice))
                        .font(Theme.body(13, weight: .semibold))
                        .foregroundStyle(item.isDecrease ? Theme.green : Theme.red)
                }

                // Percentage change
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
                Text("No price changes yet")
                    .font(Theme.serif(17, weight: .semibold))
                    .foregroundStyle(Theme.ink)

                Text("When Steward detects price changes\non your watches, they'll appear here.")
                    .font(Theme.body(13))
                    .foregroundStyle(Theme.inkLight)
                    .multilineTextAlignment(.center)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 40)
    }

    // MARK: - Formatting

    private func formatPrice(_ price: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.maximumFractionDigits = price.truncatingRemainder(dividingBy: 1) == 0 ? 0 : 2
        return formatter.string(from: NSNumber(value: price)) ?? "$\(price)"
    }

    private static let relativeDateFormatter: RelativeDateTimeFormatter = {
        let f = RelativeDateTimeFormatter()
        f.unitsStyle = .short
        return f
    }()

    private static let dateDateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateStyle = .medium
        f.timeStyle = .short
        return f
    }()

    private func formatDate(_ date: Date) -> String {
        let interval = Date().timeIntervalSince(date)
        if interval < 86400 * 7 {
            return Self.relativeDateFormatter.localizedString(for: date, relativeTo: Date())
        }
        return Self.dateDateFormatter.string(from: date)
    }
}
