import SwiftUI

struct DetailRow: View {
    let icon: String
    let label: String
    let value: String
    var highlight: Bool = false

    var body: some View {
        HStack(spacing: 12) {
            Text(icon)
                .font(.system(size: 17))

            VStack(alignment: .leading, spacing: 1) {
                Text(label)
                    .font(Theme.body(11))
                    .foregroundStyle(Theme.inkLight)

                Text(value)
                    .font(Theme.body(13, weight: .semibold))
                    .foregroundStyle(highlight ? Theme.accent : Theme.ink)
            }

            Spacer()
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .background(Theme.bgCard)
        .clipShape(RoundedRectangle(cornerRadius: Theme.radiusMd))
        .overlay(
            RoundedRectangle(cornerRadius: Theme.radiusMd)
                .stroke(highlight ? Theme.accentMid : Theme.border, lineWidth: 1)
        )
        .shadow(color: .black.opacity(0.04), radius: 8, y: 4)
    }
}
