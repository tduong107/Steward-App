import SwiftUI

struct ResponseModePickerSheet: View {
    @Binding var selectedMode: String
    var stewardActsAvailable: Bool = true  // Set to false to grey out Steward Acts
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
                        Text("When Triggered")
                            .font(Theme.serif(20, weight: .bold))
                            .foregroundStyle(Theme.ink)

                        Text("What should Steward do when your watch condition is met?")
                            .font(Theme.body(13))
                            .foregroundStyle(Theme.inkLight)
                    }
                    .padding(.horizontal, 24)
                    .padding(.top, 16)
                    .padding(.bottom, 20)

                    // Response mode options
                    VStack(spacing: 0) {
                        responseModeOption(
                            mode: .notify,
                            description: "Steward sends you a push notification when your watch condition is met. You decide what to do next — open the link, buy it, or just keep watching.",
                            example: "\"Price dropped to $42!\"",
                            isLast: false
                        )

                        Divider().foregroundStyle(Theme.border).padding(.leading, 52)

                        responseModeOption(
                            mode: .quickLink,
                            description: "Get a notification with a smart action link. One tap to add to cart, book a reservation, or open the checkout page — no searching required.",
                            example: "\"Price dropped to $42!\" → [Add to Cart]",
                            isLast: false
                        )

                        Divider().foregroundStyle(Theme.border).padding(.leading, 52)

                        responseModeOption(
                            mode: .stewardActs,
                            description: "Steward automatically takes action for you — adds to cart, books the reservation, or completes the purchase within your spending limit.",
                            example: "Currently available: Cart-add on Amazon, Target, Walmart, Best Buy · Resy reservations (coming soon)",
                            isLast: true,
                            isUnavailable: !stewardActsAvailable
                        )
                    }
                    .background(Theme.bgCard)
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(Theme.border, lineWidth: 1)
                    )
                    .shadow(color: .black.opacity(0.04), radius: 8, y: 4)
                    .padding(.horizontal, 24)

                    // Upgrade prompt for free users
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

    // MARK: - Response Mode Option

    private func responseModeOption(mode: ResponseMode, description: String, example: String, isLast: Bool, isUnavailable: Bool = false) -> some View {
        let isSelected = selectedMode == mode.rawValue
        let locked = !currentTier.includes(mode.requiredTier)
        let disabled = locked || isUnavailable

        return Button {
            if isUnavailable { return }
            if locked {
                subscriptionManager.presentPaywall(highlighting: mode.requiredTier)
            } else {
                selectedMode = mode.rawValue
                // Sync to App Group for Share Extension
                UserDefaults(suiteName: "group.Steward.Steward-App")?.set(mode.rawValue, forKey: "defaultResponseMode")
                dismiss()
            }
        } label: {
            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 12) {
                    // Check icon
                    Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                        .font(.system(size: 18))
                        .foregroundStyle(isSelected ? Theme.accent : (disabled ? Theme.inkLight.opacity(0.3) : Theme.borderMid))
                        .frame(width: 24)

                    // Title + badges
                    HStack(spacing: 6) {
                        Text(mode.title)
                            .font(Theme.body(14, weight: .semibold))
                            .foregroundStyle(disabled ? Theme.inkLight.opacity(0.5) : Theme.ink)

                        if isUnavailable {
                            Text("Not available for this watch")
                                .font(Theme.body(9, weight: .medium))
                                .foregroundStyle(Theme.inkLight)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(Theme.bgDeep)
                                .clipShape(Capsule())
                        }

                        if mode == .quickLink {
                            Text("Pro")
                                .font(Theme.body(9, weight: .bold))
                                .foregroundStyle(Theme.accent)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(Theme.accent.opacity(0.12))
                                .clipShape(Capsule())
                        }

                        if mode == .stewardActs {
                            Text("Beta")
                                .font(Theme.body(9, weight: .bold))
                                .foregroundStyle(.white)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(Theme.accent)
                                .clipShape(Capsule())

                            Text("Premium")
                                .font(Theme.body(9, weight: .bold))
                                .foregroundStyle(Theme.gold)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(Theme.gold.opacity(0.12))
                                .clipShape(Capsule())
                        }
                    }

                    Spacer()

                    if locked {
                        Image(systemName: "lock.fill")
                            .font(.system(size: 10))
                            .foregroundStyle(Theme.inkLight)
                    }
                }

                // Description
                Text(description)
                    .font(Theme.body(12))
                    .foregroundStyle(disabled ? Theme.inkLight.opacity(0.4) : Theme.inkMid)
                    .lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.leading, 36)

                // Example
                HStack(spacing: 6) {
                    Image(systemName: "quote.opening")
                        .font(.system(size: 8))
                        .foregroundStyle(Theme.accent.opacity(0.5))
                    Text(example)
                        .font(Theme.body(11, weight: .medium))
                        .foregroundStyle(locked ? Theme.inkLight.opacity(0.4) : Theme.accent.opacity(0.8))
                        .italic()
                }
                .padding(.leading, 36)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
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

                Text("Upgrade for smarter actions")
                    .font(Theme.body(14, weight: .bold))
                    .foregroundStyle(Theme.ink)
            }

            Text("Pro adds Quick Links — one-tap actions right from your notification. Premium lets Steward act automatically so you never miss a deal.")
                .font(Theme.body(12))
                .foregroundStyle(Theme.inkMid)
                .lineSpacing(3)

            HStack(spacing: 10) {
                Button {
                    subscriptionManager.presentPaywall(highlighting: .pro)
                } label: {
                    Text("Go Pro · \(SubscriptionTier.pro.price)")
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
                    Text("Premium · \(SubscriptionTier.premium.price)")
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
}
