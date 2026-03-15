import Foundation

// MARK: - Savings Milestone

struct SavingsMilestone: Identifiable, Equatable {
    let id = UUID()
    let amount: Double
    let label: String
    let emoji: String

    static let tiers: [SavingsMilestone] = [
        SavingsMilestone(amount: 5,    label: "First Sprout",    emoji: "🌱"),
        SavingsMilestone(amount: 15,   label: "Growing Saver",   emoji: "🌿"),
        SavingsMilestone(amount: 50,   label: "Money Tree",      emoji: "🌳"),
        SavingsMilestone(amount: 100,  label: "Big Saver",       emoji: "💰"),
        SavingsMilestone(amount: 250,  label: "Champion",        emoji: "🏆"),
        SavingsMilestone(amount: 500,  label: "Sharpshooter",    emoji: "🎯"),
        SavingsMilestone(amount: 1000, label: "Royalty",         emoji: "👑"),
    ]

    /// Find the current achieved milestone for a savings amount
    static func currentMilestone(for amount: Double) -> SavingsMilestone? {
        tiers.last(where: { amount >= $0.amount })
    }

    /// Find the next milestone to achieve
    static func nextMilestone(for amount: Double) -> SavingsMilestone? {
        tiers.first(where: { amount < $0.amount })
    }
}

// MARK: - Per-Watch Savings Breakdown

struct WatchSavings: Identifiable {
    let id: UUID  // watch ID
    let name: String
    let emoji: String
    let highestPrice: Double
    let currentPrice: Double

    var savings: Double {
        max(0, highestPrice - currentPrice)
    }
}

// MARK: - Savings Calculation Result

struct SavingsCalculation {
    let totalSavings: Double
    let perWatchSavings: [WatchSavings]
    let currentMilestone: SavingsMilestone?
    let nextMilestone: SavingsMilestone?
    let progressToNext: Double  // 0.0 – 1.0

    static let empty = SavingsCalculation(
        totalSavings: 0,
        perWatchSavings: [],
        currentMilestone: nil,
        nextMilestone: SavingsMilestone.tiers.first,
        progressToNext: 0
    )
}

// MARK: - Savings Calculator

enum SavingsCalculator {

    /// Calculate total savings across all price watches.
    /// For each watch with 2+ price points, savings = max(0, highestPrice - currentPrice).
    static func calculate(
        watches: [(id: UUID, name: String, emoji: String)],
        priceHistories: [UUID: [PricePoint]]
    ) -> SavingsCalculation {
        var perWatch: [WatchSavings] = []

        for watch in watches {
            guard let history = priceHistories[watch.id],
                  history.count >= 2,
                  let highest = PricePoint.highestPrice(in: history),
                  let current = history.last else {
                continue
            }

            let savings = max(0, highest.price - current.price)
            if savings > 0 {
                perWatch.append(WatchSavings(
                    id: watch.id,
                    name: watch.name,
                    emoji: watch.emoji,
                    highestPrice: highest.price,
                    currentPrice: current.price
                ))
            }
        }

        // Sort by savings descending
        perWatch.sort { $0.savings > $1.savings }

        let total = perWatch.reduce(0) { $0 + $1.savings }
        let current = SavingsMilestone.currentMilestone(for: total)
        let next = SavingsMilestone.nextMilestone(for: total)

        // Calculate progress between current and next
        let progress: Double
        if let nextM = next {
            let base = current?.amount ?? 0
            let range = nextM.amount - base
            if range > 0 {
                progress = min(1, (total - base) / range)
            } else {
                progress = 0
            }
        } else {
            // Past all milestones
            progress = 1.0
        }

        return SavingsCalculation(
            totalSavings: total,
            perWatchSavings: perWatch,
            currentMilestone: current,
            nextMilestone: next,
            progressToNext: progress
        )
    }
}
