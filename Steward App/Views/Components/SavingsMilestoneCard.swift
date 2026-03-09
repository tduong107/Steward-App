import SwiftUI

struct SavingsMilestoneCard: View {
    let calculation: SavingsCalculation

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            // Header row
            HStack(spacing: 8) {
                if let milestone = calculation.currentMilestone {
                    Text(milestone.emoji)
                        .font(.system(size: 18))
                        .frame(width: 32, height: 32)
                        .background(Theme.accentLight)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                } else {
                    Image(systemName: "leaf.fill")
                        .font(.system(size: 14))
                        .foregroundStyle(Theme.accent)
                        .frame(width: 32, height: 32)
                        .background(Theme.accentLight)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                }

                VStack(alignment: .leading, spacing: 1) {
                    Text("Total Savings")
                        .font(Theme.body(11, weight: .medium))
                        .foregroundStyle(Theme.inkMid)

                    Text(formatPrice(calculation.totalSavings))
                        .font(Theme.serif(20, weight: .bold))
                        .foregroundStyle(Theme.accent)
                }

                Spacer()

                if let milestone = calculation.currentMilestone {
                    Text(milestone.label)
                        .font(Theme.body(10, weight: .semibold))
                        .foregroundStyle(Theme.accent)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 4)
                        .background(Theme.accentLight)
                        .clipShape(Capsule())
                }
            }

            // Progress bar
            progressBar

            // Per-watch breakdown (top 3)
            if !calculation.perWatchSavings.isEmpty {
                VStack(spacing: 6) {
                    ForEach(Array(calculation.perWatchSavings.prefix(3))) { item in
                        HStack(spacing: 8) {
                            Text(item.emoji)
                                .font(.system(size: 12))

                            Text(item.name)
                                .font(Theme.body(12))
                                .foregroundStyle(Theme.inkMid)
                                .lineLimit(1)

                            Spacer()

                            Text("-\(formatPrice(item.savings))")
                                .font(Theme.body(12, weight: .semibold))
                                .foregroundStyle(Theme.accent)
                        }
                    }
                }
                .padding(.top, 2)
            }

            // Steward branding footer (screenshot-worthy)
            HStack(spacing: 4) {
                StewardLogo(size: 14)

                Text("Steward")
                    .font(Theme.body(10, weight: .medium))
                    .foregroundStyle(Theme.inkLight)
            }
            .padding(.top, 2)
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

    // MARK: - Progress Bar

    private var progressBar: some View {
        VStack(spacing: 6) {
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    // Track
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Theme.bgDeep)
                        .frame(height: 8)

                    // Fill
                    RoundedRectangle(cornerRadius: 4)
                        .fill(
                            LinearGradient(
                                colors: [Theme.accent.opacity(0.7), Theme.accent],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(
                            width: max(6, geo.size.width * calculation.progressToNext),
                            height: 8
                        )
                        .animation(.spring(response: 0.6, dampingFraction: 0.8), value: calculation.progressToNext)
                }
            }
            .frame(height: 8)

            // Labels
            HStack {
                if let current = calculation.currentMilestone {
                    Text("\(current.emoji) $\(Int(current.amount))")
                        .font(Theme.body(10, weight: .medium))
                        .foregroundStyle(Theme.inkMid)
                } else {
                    Text("$0")
                        .font(Theme.body(10, weight: .medium))
                        .foregroundStyle(Theme.inkLight)
                }

                Spacer()

                if let next = calculation.nextMilestone {
                    Text("Next: \(next.emoji) $\(Int(next.amount))")
                        .font(Theme.body(10, weight: .medium))
                        .foregroundStyle(Theme.inkLight)
                } else {
                    Text("All milestones reached! 🎉")
                        .font(Theme.body(10, weight: .medium))
                        .foregroundStyle(Theme.accent)
                }
            }
        }
    }

    // MARK: - Helpers

    private func formatPrice(_ price: Double) -> String {
        "$\(String(format: "%.2f", price))"
    }
}
