import Foundation

struct PricePoint: Identifiable, Sendable {
    let id = UUID()
    let date: Date
    let price: Double
    let confidence: String?  // "high", "medium", "low", "none" — nil for user-confirmed prices

    init(date: Date, price: Double, confidence: String? = nil) {
        self.date = date
        self.price = price
        self.confidence = confidence
    }
}

#if DEBUG
// MARK: - Mock Data Generator
extension PricePoint {
    /// Generate realistic-looking price history for demo purposes
    static func mockHistory(for watchName: String, days: Int = 30) -> [PricePoint] {
        let calendar = Calendar.current
        let now = Date()

        // Derive a stable "base price" from the watch name so it's consistent
        let hash = abs(watchName.hashValue)
        let basePrice = Double(50 + (hash % 450)) // $50 – $500
        var points: [PricePoint] = []
        var currentPrice = basePrice

        for dayOffset in stride(from: days, through: 0, by: -1) {
            guard let date = calendar.date(byAdding: .day, value: -dayOffset, to: now) else { continue }
            // Small random walk: -3% to +3%
            let change = Double.random(in: -0.03...0.03)
            currentPrice *= (1 + change)
            currentPrice = max(currentPrice * 0.8, min(currentPrice, basePrice * 1.3)) // bound it
            points.append(PricePoint(date: date, price: currentPrice))
        }

        return points
    }
}
#endif

extension PricePoint {
    /// The lowest price in a set of points
    static func lowestPrice(in points: [PricePoint]) -> PricePoint? {
        points.min(by: { $0.price < $1.price })
    }

    /// The highest price in a set of points
    static func highestPrice(in points: [PricePoint]) -> PricePoint? {
        points.max(by: { $0.price < $1.price })
    }

    /// Convert real check results (with price data) into PricePoints
    static func fromCheckResults(_ results: [CheckResultDTO]) -> [PricePoint] {
        results
            .filter { $0.price != nil }
            .map { PricePoint(date: $0.checkedAt, price: $0.price!, confidence: $0.resultData?.priceConfidence) }
            .sorted { $0.date < $1.date }
    }

    /// The average price across a set of points
    static func averagePrice(in points: [PricePoint]) -> Double? {
        guard !points.isEmpty else { return nil }
        return points.map(\.price).reduce(0, +) / Double(points.count)
    }
}
