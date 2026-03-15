import Foundation

// MARK: - Deal Rating

enum DealRating: String, CaseIterable {
    case greatDeal  = "Great Deal"
    case goodPrice  = "Good Price"
    case fairPrice  = "Fair Price"
    case overpriced = "Overpriced"
    case fakeDeal   = "Fake Deal"

    var emoji: String {
        switch self {
        case .greatDeal:  return "🔥"
        case .goodPrice:  return "👍"
        case .fairPrice:  return "😐"
        case .overpriced: return "📈"
        case .fakeDeal:   return "⚠️"
        }
    }

    /// Color name matching Theme helpers (accent, green, red, etc.)
    var colorName: String {
        switch self {
        case .greatDeal:  return "green"
        case .goodPrice:  return "teal"
        case .fairPrice:  return "gray"
        case .overpriced: return "orange"
        case .fakeDeal:   return "red"
        }
    }
}

// MARK: - Deal Insight (result of analysis)

struct DealInsight {
    let rating: DealRating
    let currentPrice: Double
    let avgPrice30d: Double
    let allTimeLow: Double
    let allTimeHigh: Double
    let savingsPercent: Double?   // Negative = savings, positive = overpaying
    let summary: String
}

// MARK: - Deal Analyzer

struct DealAnalyzer {

    /// Analyze a price history and return a deal insight.
    /// Requires at least 2 data points; returns nil otherwise.
    static func analyze(history: [PricePoint]) -> DealInsight? {
        guard history.count >= 2,
              let currentPrice = history.last?.price else { return nil }

        let allTimeLow = PricePoint.lowestPrice(in: history)?.price ?? currentPrice
        let allTimeHigh = PricePoint.highestPrice(in: history)?.price ?? currentPrice

        // 30-day average
        let calendar = Calendar.current
        let thirtyDaysAgo = calendar.date(byAdding: .day, value: -30, to: Date()) ?? Date()
        let last30d = history.filter { $0.date >= thirtyDaysAgo }
        let avg30d = PricePoint.averagePrice(in: last30d.isEmpty ? history : last30d) ?? currentPrice

        // Percent difference from 30d average (negative = cheaper)
        let diffPercent = ((currentPrice - avg30d) / avg30d) * 100

        // Fake deal detection:
        // Check if price was inflated in the last 14 days then "dropped" back to average
        let fakeDealDetected = detectFakeDeal(
            history: history,
            currentPrice: currentPrice,
            avg30d: avg30d
        )

        // Determine rating
        let rating: DealRating
        let summary: String

        if fakeDealDetected {
            rating = .fakeDeal
            summary = "Price was inflated recently before this \"sale\""
        } else if currentPrice <= allTimeLow * 1.02 {
            // Within 2% of all-time low
            rating = .greatDeal
            let savings = ((avg30d - currentPrice) / avg30d) * 100
            summary = "Near all-time low! \(String(format: "%.0f", savings))% below avg"
        } else if diffPercent <= -15 {
            rating = .greatDeal
            summary = "\(String(format: "%.0f", abs(diffPercent)))% below 30-day avg"
        } else if diffPercent <= -5 {
            rating = .goodPrice
            summary = "\(String(format: "%.0f", abs(diffPercent)))% below 30-day avg"
        } else if diffPercent <= 5 {
            rating = .fairPrice
            summary = "Around the typical price"
        } else {
            rating = .overpriced
            summary = "\(String(format: "%.0f", diffPercent))% above 30-day avg"
        }

        return DealInsight(
            rating: rating,
            currentPrice: currentPrice,
            avgPrice30d: avg30d,
            allTimeLow: allTimeLow,
            allTimeHigh: allTimeHigh,
            savingsPercent: -diffPercent, // Positive = saving money
            summary: summary
        )
    }

    // MARK: - Fake Deal Detection

    /// Detects if the price was artificially inflated before a "sale":
    /// If the max price in the last 14 days is >15% above the 30d average
    /// AND the current price is within 5% of the 30d average → likely fake deal.
    private static func detectFakeDeal(
        history: [PricePoint],
        currentPrice: Double,
        avg30d: Double
    ) -> Bool {
        let calendar = Calendar.current
        guard let fourteenDaysAgo = calendar.date(byAdding: .day, value: -14, to: Date()) else {
            return false
        }

        let last14d = history.filter { $0.date >= fourteenDaysAgo }
        guard let maxRecent = PricePoint.highestPrice(in: last14d)?.price else {
            return false
        }

        // Was the price inflated >15% above avg in the last 14 days?
        let inflationPercent = ((maxRecent - avg30d) / avg30d) * 100
        let isInflated = inflationPercent > 15

        // Is the current price back near the average? (within 5%)
        let currentDiffPercent = abs(((currentPrice - avg30d) / avg30d) * 100)
        let isBackToNormal = currentDiffPercent <= 5

        return isInflated && isBackToNormal
    }
}
