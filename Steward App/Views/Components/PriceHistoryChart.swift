import SwiftUI
import Charts

struct PriceHistoryChart: View {
    let points: [PricePoint]
    let accentColor: Color

    @State private var selectedPoint: PricePoint?

    private var minPrice: Double {
        (points.map(\.price).min() ?? 0) * 0.97
    }
    private var maxPrice: Double {
        (points.map(\.price).max() ?? 100) * 1.03
    }
    private var currentPrice: Double {
        points.last?.price ?? 0
    }
    private var lowestPoint: PricePoint? {
        PricePoint.lowestPrice(in: points)
    }
    private var highestPoint: PricePoint? {
        PricePoint.highestPrice(in: points)
    }
    private var priceChange: Double {
        guard let first = points.first, let last = points.last else { return 0 }
        return last.price - first.price
    }
    private var priceChangePercent: Double {
        guard let first = points.first else { return 0 }
        return (priceChange / first.price) * 100
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            // Section header
            HStack {
                Text("Price History")
                    .font(Theme.serif(15, weight: .semibold))
                    .foregroundStyle(Theme.ink)

                Spacer()

                // Period label based on actual data range
                if let firstDate = points.first?.date, let lastDate = points.last?.date {
                    let days = max(1, Calendar.current.dateComponents([.day], from: firstDate, to: lastDate).day ?? 1)
                    Text("\(days) day\(days == 1 ? "" : "s")")
                        .font(Theme.body(11, weight: .medium))
                        .foregroundStyle(Theme.inkLight)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 4)
                        .background(Theme.bgDeep)
                        .clipShape(Capsule())
                } else {
                    Text("1 check")
                        .font(Theme.body(11, weight: .medium))
                        .foregroundStyle(Theme.inkLight)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 4)
                        .background(Theme.bgDeep)
                        .clipShape(Capsule())
                }
            }

            // Current price + change
            HStack(alignment: .firstTextBaseline, spacing: 8) {
                Text(formatPrice(selectedPoint?.price ?? currentPrice))
                    .font(Theme.serif(22, weight: .bold))
                    .foregroundStyle(Theme.ink)
                    .contentTransition(.numericText())

                if points.count >= 2 {
                    if selectedPoint == nil {
                        HStack(spacing: 3) {
                            Image(systemName: priceChange >= 0 ? "arrow.up.right" : "arrow.down.right")
                                .font(.system(size: 10, weight: .bold))

                            Text("\(priceChange >= 0 ? "+" : "")\(String(format: "%.1f", priceChangePercent))%")
                                .font(Theme.body(12, weight: .semibold))
                        }
                        .foregroundStyle(priceChange >= 0 ? Theme.red : Theme.accent)
                    } else if let sel = selectedPoint {
                        Text(formatDate(sel.date))
                            .font(Theme.body(12))
                            .foregroundStyle(Theme.inkMid)
                    }
                } else {
                    Text("First data point")
                        .font(Theme.body(12))
                        .foregroundStyle(Theme.inkLight)
                }
            }

            // Chart
            Chart(points) { point in
                if points.count >= 2 {
                    AreaMark(
                        x: .value("Date", point.date),
                        yStart: .value("Min", minPrice),
                        yEnd: .value("Price", point.price)
                    )
                    .foregroundStyle(
                        LinearGradient(
                            colors: [accentColor.opacity(0.15), accentColor.opacity(0.02)],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )

                    LineMark(
                        x: .value("Date", point.date),
                        y: .value("Price", point.price)
                    )
                    .foregroundStyle(accentColor)
                    .lineStyle(StrokeStyle(lineWidth: 2))
                }

                // Show point mark for single data point or selected point
                if points.count == 1 {
                    PointMark(
                        x: .value("Date", point.date),
                        y: .value("Price", point.price)
                    )
                    .foregroundStyle(accentColor)
                    .symbolSize(80)
                } else if let sel = selectedPoint, sel.id == point.id {
                    PointMark(
                        x: .value("Date", point.date),
                        y: .value("Price", point.price)
                    )
                    .foregroundStyle(accentColor)
                    .symbolSize(60)
                }
            }
            .chartYScale(domain: minPrice...maxPrice)
            .chartXAxis {
                AxisMarks(values: .stride(by: .day, count: max(1, points.count > 7 ? 7 : points.count))) { value in
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                        .font(Theme.body(10))
                        .foregroundStyle(Theme.inkLight)
                }
            }
            .chartYAxis {
                AxisMarks(position: .leading, values: .automatic(desiredCount: 4)) { value in
                    AxisValueLabel {
                        if let price = value.as(Double.self) {
                            Text(formatPrice(price))
                                .font(Theme.body(10))
                                .foregroundStyle(Theme.inkLight)
                        }
                    }
                    AxisGridLine()
                        .foregroundStyle(Theme.border)
                }
            }
            .chartOverlay { proxy in
                GeometryReader { geo in
                    Rectangle()
                        .fill(.clear)
                        .contentShape(Rectangle())
                        .gesture(
                            DragGesture(minimumDistance: 0)
                                .onChanged { value in
                                    let x = value.location.x
                                    if let date: Date = proxy.value(atX: x) {
                                        selectedPoint = closestPoint(to: date)
                                    }
                                }
                                .onEnded { _ in
                                    withAnimation(.easeOut(duration: 0.2)) {
                                        selectedPoint = nil
                                    }
                                }
                        )
                }
            }
            .frame(height: 180)

            // Low / High badges (only meaningful with 2+ data points)
            if points.count >= 2 {
                HStack(spacing: 12) {
                    if let low = lowestPoint {
                        priceBadge(
                            label: "Low",
                            price: low.price,
                            color: Theme.accent,
                            icon: "arrow.down"
                        )
                    }

                    if let high = highestPoint {
                        priceBadge(
                            label: "High",
                            price: high.price,
                            color: Theme.red,
                            icon: "arrow.up"
                        )
                    }
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
        .shadow(color: .black.opacity(0.04), radius: 8, y: 4)
    }

    // MARK: - Components

    private func priceBadge(label: String, price: Double, color: Color, icon: String) -> some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(color)
                .frame(width: 24, height: 24)
                .background(color.opacity(0.12))
                .clipShape(Circle())

            VStack(alignment: .leading, spacing: 1) {
                Text(label)
                    .font(Theme.body(10))
                    .foregroundStyle(Theme.inkLight)

                Text(formatPrice(price))
                    .font(Theme.body(12, weight: .semibold))
                    .foregroundStyle(Theme.ink)
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(Theme.bgDeep)
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }

    // MARK: - Helpers

    private func closestPoint(to date: Date) -> PricePoint? {
        points.min(by: {
            abs($0.date.timeIntervalSince(date)) < abs($1.date.timeIntervalSince(date))
        })
    }

    private func formatPrice(_ price: Double) -> String {
        "$\(String(format: "%.2f", price))"
    }

    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d"
        return formatter.string(from: date)
    }
}
