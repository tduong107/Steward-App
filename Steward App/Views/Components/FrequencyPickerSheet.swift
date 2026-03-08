import SwiftUI

struct FrequencyPickerSheet: View {
    @Binding var selectedFrequency: String
    @Environment(SubscriptionManager.self) private var subscriptionManager
    @Environment(\.dismiss) private var dismiss

    private var currentTier: SubscriptionTier {
        subscriptionManager.currentTier
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    // Header
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Watch Frequency")
                            .font(Theme.serif(20, weight: .bold))
                            .foregroundStyle(Theme.ink)

                        Text("How often should Steward watch this page?")
                            .font(Theme.body(13))
                            .foregroundStyle(Theme.inkLight)
                    }
                    .padding(.horizontal, 24)
                    .padding(.top, 16)
                    .padding(.bottom, 20)

                    // Free tier
                    tierSection(title: "FREE", tier: .free, frequencies: CheckFrequency.freeTier)

                    // Pro tier
                    tierSection(title: "PRO · \(SubscriptionTier.pro.price)", tier: .pro, frequencies: CheckFrequency.proTier)

                    // Premium tier
                    tierSection(title: "PREMIUM · \(SubscriptionTier.premium.price)", tier: .premium, frequencies: CheckFrequency.premiumTier)

                    // Upgrade prompt
                    if currentTier == .free {
                        upgradeCard
                    }
                }
                .padding(.bottom, 24)
            }
            .background(Theme.bg)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                    .font(Theme.body(14))
                    .foregroundStyle(Theme.inkMid)
                }
            }
        }
    }

    // MARK: - Tier Section

    private func tierSection(title: String, tier: SubscriptionTier, frequencies: [CheckFrequency]) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            // Section header
            HStack(spacing: 6) {
                Text(title)
                    .font(Theme.body(11, weight: .bold))
                    .foregroundStyle(tierHeaderColor(for: tier))
                    .tracking(0.8)

                if tier != .free && !isUnlocked(tier) {
                    Image(systemName: "lock.fill")
                        .font(.system(size: 9))
                        .foregroundStyle(Theme.inkLight)
                }
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 8)
            .padding(.top, 16)

            // Frequency options card
            VStack(spacing: 0) {
                ForEach(Array(frequencies.enumerated()), id: \.element) { index, freq in
                    frequencyRow(freq, tier: tier)

                    if index < frequencies.count - 1 {
                        Divider()
                            .foregroundStyle(Theme.border)
                            .padding(.leading, 52)
                    }
                }
            }
            .background(Theme.bgCard)
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(Theme.border, lineWidth: 1)
            )
            .shadow(color: .black.opacity(0.04), radius: 8, y: 4)
            .padding(.horizontal, 24)
        }
    }

    private func frequencyRow(_ freq: CheckFrequency, tier: SubscriptionTier) -> some View {
        let isSelected = selectedFrequency == freq.rawValue
        let locked = !isUnlocked(tier)

        return Button {
            if locked {
                subscriptionManager.presentPaywall(highlighting: tier)
            } else {
                selectedFrequency = freq.rawValue
                dismiss()
            }
        } label: {
            HStack(spacing: 12) {
                // Check icon
                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                    .font(.system(size: 18))
                    .foregroundStyle(isSelected ? Theme.accent : (locked ? Theme.inkLight.opacity(0.3) : Theme.borderMid))
                    .frame(width: 24)

                // Label
                Text(freq.displayName)
                    .font(Theme.body(13, weight: isSelected ? .semibold : .regular))
                    .foregroundStyle(locked ? Theme.inkLight.opacity(0.5) : Theme.ink)

                Spacer()

                // Lock or tier badge
                if locked {
                    Text(tier.displayName)
                        .font(Theme.body(10, weight: .bold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(tier == .premium ? Theme.gold : Theme.accent)
                        .clipShape(Capsule())
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 13)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }

    // MARK: - Upgrade Card

    private var upgradeCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 8) {
                Image(systemName: "bolt.fill")
                    .font(.system(size: 14))
                    .foregroundStyle(Theme.accent)

                Text("Upgrade for faster checks")
                    .font(Theme.body(14, weight: .bold))
                    .foregroundStyle(Theme.ink)
            }

            Text("Pro checks every 30 min for just $1.99/mo. Premium checks every 5 min for $3.99/mo. Never miss a price drop or restock again!")
                .font(Theme.body(12))
                .foregroundStyle(Theme.inkMid)
                .lineSpacing(3)

            HStack(spacing: 10) {
                Button {
                    subscriptionManager.presentPaywall(highlighting: .pro)
                } label: {
                    Text("Go Pro · $1.99")
                        .font(Theme.body(13, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(Theme.accent)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                }

                Button {
                    subscriptionManager.presentPaywall(highlighting: .premium)
                } label: {
                    Text("Premium · $3.99")
                        .font(Theme.body(13, weight: .bold))
                        .foregroundStyle(Theme.ink)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(Theme.bgDeep)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Theme.border, lineWidth: 1)
                        )
                }
            }
            .padding(.top, 4)
        }
        .padding(16)
        .background(Theme.bgCard)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Theme.accentMid, lineWidth: 1)
        )
        .shadow(color: Theme.accent.opacity(0.1), radius: 12, y: 4)
        .padding(.horizontal, 24)
        .padding(.top, 20)
    }

    // MARK: - Helpers

    private func isUnlocked(_ tier: SubscriptionTier) -> Bool {
        currentTier.includes(tier)
    }

    private func tierHeaderColor(for tier: SubscriptionTier) -> Color {
        switch tier {
        case .free: return Theme.inkLight
        case .pro: return Theme.accent
        case .premium: return Theme.gold
        }
    }
}
