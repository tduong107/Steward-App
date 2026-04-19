import SwiftUI
import Charts

struct PriceWatchRow: View {
    let watch: Watch
    let priceHistory: [PricePoint]
    let dealInsight: DealInsight?
    let onTap: () -> Void

    private var currentPrice: Double? {
        priceHistory.last?.price
    }

    private var priceChange: Double? {
        guard let first = priceHistory.first, let last = priceHistory.last else { return nil }
        return ((last.price - first.price) / first.price) * 100
    }

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 12) {
                // Product image or emoji
                Group {
                    if let imageURL = watch.imageURL, let url = URL(string: imageURL) {
                        CachedAsyncImage(url: url) { image in
                            image
                                .resizable()
                                .scaledToFill()
                        } placeholder: {
                            Text(watch.emoji)
                                .font(.system(size: 18))
                        }
                    } else {
                        Text(watch.emoji)
                            .font(.system(size: 18))
                    }
                }
                .frame(width: 40, height: 40)
                .background(Theme.bgDeep)
                .clipShape(RoundedRectangle(cornerRadius: 10))

                // Name + price or waiting state
                VStack(alignment: .leading, spacing: 2) {
                    Text(watch.name)
                        .font(Theme.body(13, weight: .semibold))
                        .foregroundStyle(Theme.ink)
                        .lineLimit(1)

                    if let price = currentPrice {
                        HStack(spacing: 4) {
                            Text(formatPrice(price))
                                .font(Theme.body(12, weight: .bold))
                                .foregroundStyle(Theme.ink)

                            if let change = priceChange {
                                Text("\(change >= 0 ? "+" : "")\(String(format: "%.1f", change))%")
                                    .font(Theme.body(10, weight: .semibold))
                                    .foregroundStyle(change >= 0 ? Theme.red : Theme.accent)
                            }
                        }
                    } else {
                        Text("Waiting for price data…")
                            .font(Theme.body(11))
                            .foregroundStyle(Theme.inkLight)
                    }
                }

                Spacer()

                // Mini sparkline
                if priceHistory.count >= 2 {
                    miniSparkline
                        .frame(width: 50, height: 28)
                }

                // Deal rating pill
                if let insight = dealInsight {
                    DealRatingPill(rating: insight.rating)
                }

                Image(systemName: "chevron.right")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(Theme.borderMid)
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
    }

    // MARK: - Mini Sparkline

    private var miniSparkline: some View {
        Chart(priceHistory) { point in
            LineMark(
                x: .value("Date", point.date),
                y: .value("Price", point.price)
            )
            .foregroundStyle(sparklineColor)
            .lineStyle(StrokeStyle(lineWidth: 1.5))
        }
        .chartXAxis(.hidden)
        .chartYAxis(.hidden)
        .chartLegend(.hidden)
    }

    private var sparklineColor: Color {
        guard let change = priceChange else { return Theme.inkLight }
        return change >= 0 ? Theme.red : Theme.accent
    }

    private func formatPrice(_ price: Double) -> String {
        "$\(String(format: "%.2f", price))"
    }
}
