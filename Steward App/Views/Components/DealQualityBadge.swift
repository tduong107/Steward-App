import SwiftUI

struct DealQualityBadge: View {
    let insight: DealInsight

    private var ratingColor: Color {
        switch insight.rating {
        case .greatDeal:  return Theme.accent
        case .goodPrice:  return Theme.blue
        case .fairPrice:  return Theme.inkMid
        case .overpriced: return Theme.gold
        case .fakeDeal:   return Theme.red
        }
    }

    private var ratingBgColor: Color {
        switch insight.rating {
        case .greatDeal:  return Theme.accentLight
        case .goodPrice:  return Theme.blueLight
        case .fairPrice:  return Theme.bgDeep
        case .overpriced: return Theme.goldLight
        case .fakeDeal:   return Theme.redLight
        }
    }

    private var ratingBorderColor: Color {
        switch insight.rating {
        case .greatDeal:  return Theme.accentMid
        case .goodPrice:  return Theme.blue.opacity(0.3)
        case .fairPrice:  return Theme.border
        case .overpriced: return Theme.gold.opacity(0.3)
        case .fakeDeal:   return Theme.red.opacity(0.3)
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            // Rating pill
            HStack(spacing: 6) {
                Text(insight.rating.emoji)
                    .font(.system(size: 14))

                Text(insight.rating.rawValue)
                    .font(Theme.body(13, weight: .bold))
                    .foregroundStyle(ratingColor)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(ratingBgColor)
            .clipShape(Capsule())
            .overlay(
                Capsule()
                    .stroke(ratingBorderColor, lineWidth: 1)
            )

            // Summary line
            Text(insight.summary)
                .font(Theme.body(13))
                .foregroundStyle(Theme.inkMid)

            // Stats row
            HStack(spacing: 16) {
                statItem(label: "30d Avg", value: formatPrice(insight.avgPrice30d))
                statItem(label: "All-Time Low", value: formatPrice(insight.allTimeLow))
                statItem(label: "All-Time High", value: formatPrice(insight.allTimeHigh))
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(Theme.bgCard)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(ratingBorderColor, lineWidth: 1)
        )
    }

    // MARK: - Components

    private func statItem(label: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label)
                .font(Theme.body(10))
                .foregroundStyle(Theme.inkLight)

            Text(value)
                .font(Theme.body(13, weight: .semibold))
                .foregroundStyle(Theme.ink)
        }
    }

    private func formatPrice(_ price: Double) -> String {
        "$\(String(format: "%.2f", price))"
    }
}

// MARK: - Compact Badge (for list rows)

struct DealRatingPill: View {
    let rating: DealRating

    private var pillColor: Color {
        switch rating {
        case .greatDeal:  return Theme.accent
        case .goodPrice:  return Theme.blue
        case .fairPrice:  return Theme.inkMid
        case .overpriced: return Theme.gold
        case .fakeDeal:   return Theme.red
        }
    }

    private var pillBg: Color {
        switch rating {
        case .greatDeal:  return Theme.accentLight
        case .goodPrice:  return Theme.blueLight
        case .fairPrice:  return Theme.bgDeep
        case .overpriced: return Theme.goldLight
        case .fakeDeal:   return Theme.redLight
        }
    }

    var body: some View {
        HStack(spacing: 3) {
            Text(rating.emoji)
                .font(.system(size: 10))

            Text(rating.rawValue)
                .font(Theme.body(10, weight: .semibold))
                .foregroundStyle(pillColor)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 3)
        .background(pillBg)
        .clipShape(Capsule())
    }
}
