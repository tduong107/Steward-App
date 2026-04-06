import Foundation

// MARK: - Deal Rating

enum DealRating: String, CaseIterable {
    case greatDeal  = "Great Deal"
    case goodPrice  = "Good Price"
    case fairPrice  = "Fair Price"
    case overpriced = "Overpriced"
    case fakeDeal   = "Suspicious Deal"

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

    /// Rank for sorting (higher = better deal)
    var rank: Int {
        switch self {
        case .greatDeal:  return 5
        case .goodPrice:  return 4
        case .fairPrice:  return 3
        case .overpriced: return 2
        case .fakeDeal:   return 1
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
    /// - Parameter sellerWasPrice: The seller's claimed "was"/"original" price (from page HTML)
    static func analyze(history: [PricePoint], sellerWasPrice: Double? = nil) -> DealInsight? {
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

        // Check if price has actually varied — if all data points are the same price,
        // we don't have enough history to make meaningful deal judgments
        let priceRange = allTimeHigh - allTimeLow
        let hasMeaningfulVariance = priceRange > allTimeLow * 0.01  // >1% spread required

        // Minimum history span: need at least 3 days of data to make deal claims
        let oldestDate = history.first?.date ?? Date()
        let historySpanDays = calendar.dateComponents([.day], from: oldestDate, to: Date()).day ?? 0
        let hasEnoughHistory = historySpanDays >= 3 && history.count >= 3

        // Fake deal detection (two methods):
        // Method 1: Check if price was inflated in the last 14 days then "dropped" back to average
        let historyFakeDeal = detectFakeDeal(
            history: history,
            currentPrice: currentPrice,
            avg30d: avg30d
        )
        // Method 2: Compare seller's "was" price to our historical data
        // If our 30d avg is close to the "sale" price, the "was" price is likely inflated
        let sellerFakeDeal = detectSellerInflatedPrice(
            sellerWasPrice: sellerWasPrice,
            currentPrice: currentPrice,
            avg30d: avg30d,
            allTimeHigh: allTimeHigh
        )
        let fakeDealDetected = historyFakeDeal || sellerFakeDeal

        // Determine rating
        let rating: DealRating
        let summary: String

        if fakeDealDetected {
            if sellerFakeDeal, let wasPrice = sellerWasPrice {
                rating = .fakeDeal
                let claimedDiscount = Int(((wasPrice - currentPrice) / wasPrice) * 100)
                summary = "Seller claims \(claimedDiscount)% off \"$\(String(format: "%.0f", wasPrice))\" but this has been ~$\(String(format: "%.0f", avg30d)) for 30 days"
            } else {
                rating = .fakeDeal
                summary = "Price was inflated recently before this \"sale\""
            }
        } else if !hasEnoughHistory || !hasMeaningfulVariance {
            // Not enough data to make a deal judgment — show neutral
            rating = .fairPrice
            summary = "Gathering price data — check back soon"
        } else if currentPrice <= allTimeLow * 1.02 {
            // Within 2% of all-time low (only meaningful with enough history)
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

    // MARK: - Seller Inflated Price Detection

    /// Detects if the seller's claimed "was" price is inflated:
    /// If the "was" price is significantly higher than both the current price AND
    /// our historical 30d average, while the current price is near the 30d average,
    /// the "was" price is likely manufactured to create a false sense of discount.
    ///
    /// Example: Seller shows "Was $99.99, Now $89.99 (10% off!)"
    /// but our data shows the item has been ~$89.99 for the past 30 days.
    private static func detectSellerInflatedPrice(
        sellerWasPrice: Double?,
        currentPrice: Double,
        avg30d: Double,
        allTimeHigh: Double
    ) -> Bool {
        guard let wasPrice = sellerWasPrice, wasPrice > currentPrice else { return false }

        // The seller claims a discount from wasPrice → currentPrice
        let claimedDiscount = (wasPrice - currentPrice) / wasPrice

        // Is the current price near our 30d average? (within 10%)
        let currentNearAvg = abs(currentPrice - avg30d) / avg30d <= 0.10

        // Was the "was" price NEVER actually seen in our history?
        // If allTimeHigh is significantly below the "was" price, it's likely inflated
        let wasPriceNeverReached = wasPrice > allTimeHigh * 1.05

        // Trigger if:
        // - Claimed discount is at least 8% (seller is advertising a "deal")
        // - Current price is near the historical average (this IS the normal price)
        // - The "was" price was never actually reached in our tracking history
        return claimedDiscount >= 0.08 && currentNearAvg && wasPriceNeverReached
    }
}
