import SwiftUI

struct SavingsMilestoneCard: View {
    let calculation: SavingsCalculation

    @State private var animateGlow = false

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Festive header with sparkle effect
            HStack(spacing: 10) {
                // Animated milestone badge
                ZStack {
                    Circle()
                        .fill(
                            RadialGradient(
                                colors: [Theme.accent.opacity(0.3), Theme.accent.opacity(0.05)],
                                center: .center,
                                startRadius: 0,
                                endRadius: 24
                            )
                        )
                        .frame(width: 48, height: 48)
                        .scaleEffect(animateGlow ? 1.1 : 1.0)

                    if let milestone = calculation.currentMilestone {
                        Text(milestone.emoji)
                            .font(.system(size: 22))
                    } else {
                        Image(systemName: "sparkles")
                            .font(.system(size: 18))
                            .foregroundStyle(Theme.accent)
                    }
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text(L10n.t("savings.potential_label"))
                        .font(Theme.body(11, weight: .semibold))
                        .foregroundStyle(Theme.inkMid)
                        .textCase(.uppercase)
                        .tracking(0.5)

                    Text(formatPrice(calculation.totalSavings))
                        .font(Theme.serif(26, weight: .bold))
                        .foregroundStyle(Theme.accent)
                }

                Spacer()

                if let milestone = calculation.currentMilestone {
                    VStack(spacing: 2) {
                        Text(milestone.emoji)
                            .font(.system(size: 12))
                        Text(milestone.label)
                            .font(Theme.body(9, weight: .bold))
                            .foregroundStyle(Theme.accent)
                    }
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(
                        RoundedRectangle(cornerRadius: 10)
                            .fill(Theme.accent.opacity(0.1))
                            .overlay(
                                RoundedRectangle(cornerRadius: 10)
                                    .stroke(Theme.accent.opacity(0.2), lineWidth: 1)
                            )
                    )
                }
            }

            // Progress bar with gradient
            progressBar

            // Per-watch breakdown (top 3) with festive styling
            if !calculation.perWatchSavings.isEmpty {
                VStack(spacing: 8) {
                    ForEach(Array(calculation.perWatchSavings.prefix(3).enumerated()), id: \.element.id) { index, item in
                        HStack(spacing: 10) {
                            // Rank badge
                            Text(rankEmoji(for: index))
                                .font(.system(size: 14))

                            Text(item.emoji)
                                .font(.system(size: 13))

                            Text(item.name)
                                .font(Theme.body(12, weight: .medium))
                                .foregroundStyle(Theme.ink)
                                .lineLimit(1)

                            Spacer()

                            Text("-\(formatPrice(item.savings))")
                                .font(Theme.body(12, weight: .bold))
                                .foregroundStyle(Theme.green)
                        }
                    }
                }
                .padding(12)
                .background(Theme.bgDeep.opacity(0.5))
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }

            // Steward branding footer
            HStack(spacing: 6) {
                StewardLogo(size: 14)

                Text("Steward")
                    .font(Theme.body(10, weight: .medium))
                    .foregroundStyle(Theme.inkLight)

                Spacer()

                Text("Prices tracked automatically")
                    .font(Theme.body(9))
                    .foregroundStyle(Theme.inkLight)
            }
        }
        .padding(18)
        .background(
            ZStack {
                Theme.bgCard

                // Subtle celebratory gradient overlay
                LinearGradient(
                    colors: [Theme.accent.opacity(0.03), .clear, Theme.accent.opacity(0.02)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            }
        )
        .clipShape(RoundedRectangle(cornerRadius: 18))
        .overlay(
            RoundedRectangle(cornerRadius: 18)
                .stroke(
                    LinearGradient(
                        colors: [Theme.accent.opacity(0.3), Theme.border, Theme.accent.opacity(0.15)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    lineWidth: 1
                )
        )
        .shadow(color: Theme.accent.opacity(0.08), radius: 12, y: 4)
        .onAppear {
            withAnimation(.easeInOut(duration: 2.0).repeatForever(autoreverses: true)) {
                animateGlow = true
            }
        }
    }

    // MARK: - Rank Emoji

    private func rankEmoji(for index: Int) -> String {
        switch index {
        case 0: return "🥇"
        case 1: return "🥈"
        case 2: return "🥉"
        default: return "•"
        }
    }

    // MARK: - Progress Bar

    private var progressBar: some View {
        VStack(spacing: 6) {
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    // Track
                    RoundedRectangle(cornerRadius: 5)
                        .fill(Theme.bgDeep)
                        .frame(height: 10)

                    // Fill with gradient
                    RoundedRectangle(cornerRadius: 5)
                        .fill(
                            LinearGradient(
                                colors: [Theme.accent.opacity(0.6), Theme.accent, Theme.green],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(
                            width: max(8, geo.size.width * calculation.progressToNext),
                            height: 10
                        )
                        .animation(.spring(response: 0.6, dampingFraction: 0.8), value: calculation.progressToNext)

                    // Sparkle at the tip
                    if calculation.progressToNext > 0.05 {
                        Circle()
                            .fill(.white.opacity(0.8))
                            .frame(width: 4, height: 4)
                            .offset(x: max(6, geo.size.width * calculation.progressToNext) - 6)
                            .animation(.spring(response: 0.6, dampingFraction: 0.8), value: calculation.progressToNext)
                    }
                }
            }
            .frame(height: 10)

            // Labels
            HStack {
                if let current = calculation.currentMilestone {
                    Text("\(current.emoji) $\(Int(current.amount))")
                        .font(Theme.body(10, weight: .semibold))
                        .foregroundStyle(Theme.accent)
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
                    HStack(spacing: 4) {
                        Image(systemName: "sparkles")
                            .font(.system(size: 8))
                        Text("All milestones reached!")
                            .font(Theme.body(10, weight: .semibold))
                    }
                    .foregroundStyle(Theme.accent)
                }
            }
        }
    }

    // MARK: - Helpers

    private func formatPrice(_ price: Double) -> String {
        Theme.formatPrice(price)
    }
}
