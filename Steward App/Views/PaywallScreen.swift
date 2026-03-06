import SwiftUI
import StoreKit

struct PaywallScreen: View {
    @Environment(SubscriptionManager.self) private var subscriptionManager
    @Environment(\.dismiss) private var dismiss
    @State private var billingCycle: BillingCycle = .monthly

    enum BillingCycle: String, CaseIterable {
        case monthly = "Monthly"
        case yearly = "Yearly"
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 0) {
                    // Reason banner (if paywall was triggered by a limit)
                    if let reason = subscriptionManager.paywallReason {
                        reasonBanner(reason)
                    }

                    heroSection
                    freeVsPaidComparison
                    billingToggle
                    proCard
                    premiumCard
                    restoreButton
                    legalText
                }
                .padding(.bottom, 32)
            }
            .background(Theme.bg)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Not now") {
                        dismiss()
                    }
                    .font(Theme.body(14))
                    .foregroundStyle(Theme.inkMid)
                }
            }
            .overlay {
                if subscriptionManager.isPurchasing {
                    purchasingOverlay
                }
            }
        }
    }

    // MARK: - Reason Banner

    private func reasonBanner(_ reason: String) -> some View {
        HStack(spacing: 10) {
            Image(systemName: "exclamationmark.circle.fill")
                .font(.system(size: 16))
                .foregroundStyle(Theme.gold)

            Text(reason)
                .font(Theme.body(13, weight: .medium))
                .foregroundStyle(Theme.ink)
                .lineSpacing(2)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(Theme.goldLight)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Theme.gold.opacity(0.3), lineWidth: 1)
        )
        .padding(.horizontal, 24)
        .padding(.top, 16)
    }

    // MARK: - Hero Section

    private var heroSection: some View {
        VStack(spacing: 12) {
            StewardLogo(size: 56)
                .padding(.top, 24)

            Text("Unlock Steward")
                .font(Theme.serif(24, weight: .bold))
                .foregroundStyle(Theme.ink)

            Text("Monitor smarter with faster checks,\nunlimited watches & price insights")
                .font(Theme.body(14))
                .foregroundStyle(Theme.inkMid)
                .multilineTextAlignment(.center)
                .lineSpacing(3)
        }
        .padding(.bottom, 20)
    }

    // MARK: - Free vs Paid Comparison

    private var freeVsPaidComparison: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("FREE PLAN INCLUDES")
                .font(Theme.body(10, weight: .bold))
                .foregroundStyle(Theme.inkLight)
                .tracking(0.8)

            VStack(alignment: .leading, spacing: 6) {
                comparisonRow("Up to 3 watches", included: true)
                comparisonRow("Checks once per day", included: true)
                comparisonRow("Push notifications", included: true)
                comparisonRow("Faster check frequencies", included: false)
                comparisonRow("Price insights & deal alerts", included: false)
                comparisonRow("Unlimited watches", included: false)
            }
        }
        .padding(16)
        .background(Theme.bgCard)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(Theme.border, lineWidth: 1)
        )
        .padding(.horizontal, 24)
        .padding(.bottom, 20)
    }

    private func comparisonRow(_ text: String, included: Bool) -> some View {
        HStack(spacing: 8) {
            Image(systemName: included ? "checkmark" : "xmark")
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(included ? Theme.accent : Theme.inkLight)
                .frame(width: 16, height: 16)

            Text(text)
                .font(Theme.body(12))
                .foregroundStyle(included ? Theme.ink : Theme.inkLight)
        }
    }

    // MARK: - Billing Toggle

    private var billingToggle: some View {
        HStack(spacing: 0) {
            ForEach(BillingCycle.allCases, id: \.self) { cycle in
                Button {
                    withAnimation(.spring(response: 0.3)) {
                        billingCycle = cycle
                    }
                } label: {
                    HStack(spacing: 4) {
                        Text(cycle.rawValue)
                            .font(Theme.body(13, weight: .semibold))
                            .foregroundStyle(billingCycle == cycle ? .white : Theme.inkMid)

                        if cycle == .yearly {
                            Text("Save 16%")
                                .font(Theme.body(10, weight: .bold))
                                .foregroundStyle(billingCycle == cycle ? Theme.goldLight : Theme.gold)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(billingCycle == cycle ? Theme.accent : Color.clear)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                }
                .buttonStyle(.plain)
            }
        }
        .padding(3)
        .background(Theme.bgDeep)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Theme.border, lineWidth: 1)
        )
        .padding(.horizontal, 24)
        .padding(.bottom, 20)
    }

    // MARK: - Pro Card

    private var proCard: some View {
        let product = billingCycle == .monthly
            ? subscriptionManager.monthlyProduct(for: .pro)
            : subscriptionManager.yearlyProduct(for: .pro)
        let isHighlighted = subscriptionManager.paywallHighlightedTier == .pro

        return tierCard(
            tier: .pro,
            badge: nil,
            features: [
                "Up to 20 watches",
                "Check frequency up to every 30 minutes",
                "Price insights & deal alerts"
            ],
            product: product,
            highlighted: isHighlighted,
            accentColor: Theme.accent,
            accentLight: Theme.accentLight,
            accentMid: Theme.accentMid
        )
    }

    // MARK: - Premium Card

    private var premiumCard: some View {
        let product = billingCycle == .monthly
            ? subscriptionManager.monthlyProduct(for: .premium)
            : subscriptionManager.yearlyProduct(for: .premium)
        let isHighlighted = subscriptionManager.paywallHighlightedTier == .premium

        return tierCard(
            tier: .premium,
            badge: "BEST VALUE",
            features: [
                "Unlimited watches",
                "Check frequency up to every 5 minutes",
                "Everything in Pro included",
                "Priority support"
            ],
            product: product,
            highlighted: isHighlighted,
            accentColor: Theme.gold,
            accentLight: Theme.goldLight,
            accentMid: Theme.gold.opacity(0.3)
        )
    }

    // MARK: - Tier Card Builder

    private func tierCard(
        tier: SubscriptionTier,
        badge: String?,
        features: [String],
        product: Product?,
        highlighted: Bool,
        accentColor: Color,
        accentLight: Color,
        accentMid: Color
    ) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            // Title row
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 8) {
                        Text("Steward \(tier.displayName)")
                            .font(Theme.serif(18, weight: .bold))
                            .foregroundStyle(Theme.ink)

                        if let badge {
                            Text(badge)
                                .font(Theme.body(9, weight: .bold))
                                .foregroundStyle(.white)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 3)
                                .background(accentColor)
                                .clipShape(Capsule())
                        }
                    }

                    if let product {
                        Text(product.displayPrice + " / " + (billingCycle == .monthly ? "month" : "year"))
                            .font(Theme.body(13))
                            .foregroundStyle(Theme.inkMid)
                    }
                }

                Spacer()
            }

            // Features
            VStack(alignment: .leading, spacing: 8) {
                ForEach(features, id: \.self) { feature in
                    HStack(spacing: 10) {
                        Image(systemName: "checkmark")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(accentColor)
                            .frame(width: 18, height: 18)
                            .background(accentLight)
                            .clipShape(Circle())

                        Text(feature)
                            .font(Theme.body(13))
                            .foregroundStyle(Theme.ink)
                    }
                }
            }

            // Purchase button
            Button {
                guard let product else { return }
                Task {
                    await subscriptionManager.purchase(product)
                    if subscriptionManager.currentTier.includes(tier) {
                        dismiss()
                    }
                }
            } label: {
                HStack {
                    if subscriptionManager.currentTier.includes(tier) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 14))
                        Text("Current Plan")
                            .font(Theme.body(14, weight: .bold))
                    } else {
                        Text(product != nil ? "Subscribe for \(product!.displayPrice)" : "Loading…")
                            .font(Theme.body(14, weight: .bold))
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .foregroundStyle(subscriptionManager.currentTier.includes(tier) ? accentColor : .white)
                .background(subscriptionManager.currentTier.includes(tier) ? accentLight : accentColor)
                .clipShape(RoundedRectangle(cornerRadius: 14))
                .overlay(
                    RoundedRectangle(cornerRadius: 14)
                        .stroke(subscriptionManager.currentTier.includes(tier) ? accentMid : Color.clear, lineWidth: 1)
                )
            }
            .buttonStyle(.plain)
            .disabled(product == nil || subscriptionManager.currentTier.includes(tier))
        }
        .padding(18)
        .background(Theme.bgCard)
        .clipShape(RoundedRectangle(cornerRadius: 18))
        .overlay(
            RoundedRectangle(cornerRadius: 18)
                .stroke(highlighted ? accentColor : Theme.border, lineWidth: highlighted ? 2 : 1)
        )
        .shadow(color: highlighted ? accentColor.opacity(0.15) : .black.opacity(0.04), radius: 12, y: 4)
        .padding(.horizontal, 24)
        .padding(.bottom, 14)
    }

    // MARK: - Restore Button

    private var restoreButton: some View {
        Button {
            Task {
                await subscriptionManager.restorePurchases()
                if subscriptionManager.currentTier != .free {
                    dismiss()
                }
            }
        } label: {
            Text("Restore Purchases")
                .font(Theme.body(13, weight: .medium))
                .foregroundStyle(Theme.inkMid)
                .underline()
        }
        .buttonStyle(.plain)
        .padding(.top, 8)
    }

    // MARK: - Legal Text

    private var legalText: some View {
        VStack(spacing: 4) {
            if let error = subscriptionManager.errorMessage {
                Text(error)
                    .font(Theme.body(11))
                    .foregroundStyle(Theme.red)
                    .multilineTextAlignment(.center)
                    .padding(.bottom, 4)
            }

            Text("Subscriptions auto-renew unless cancelled at least 24 hours before the end of the current period. Manage subscriptions in Settings \u{2192} Apple ID \u{2192} Subscriptions.")
                .font(Theme.body(10))
                .foregroundStyle(Theme.inkLight)
                .multilineTextAlignment(.center)
                .lineSpacing(2)
        }
        .padding(.horizontal, 32)
        .padding(.top, 16)
    }

    // MARK: - Purchasing Overlay

    private var purchasingOverlay: some View {
        ZStack {
            Color.black.opacity(0.3)
                .ignoresSafeArea()

            VStack(spacing: 12) {
                ProgressView()
                    .controlSize(.large)
                    .tint(Theme.accent)

                Text("Processing…")
                    .font(Theme.body(14, weight: .medium))
                    .foregroundStyle(Theme.ink)
            }
            .padding(32)
            .background(Theme.bgCard)
            .clipShape(RoundedRectangle(cornerRadius: 20))
            .shadow(color: .black.opacity(0.2), radius: 20, y: 8)
        }
    }
}
