import Foundation
import StoreKit
import SwiftUI
import Observation
import Supabase

/// Where the user's subscription was purchased
enum SubscriptionSource: String {
    case apple = "apple"
    case stripe = "stripe"
    case none = "none"
}

@Observable
@MainActor
final class SubscriptionManager {

    // MARK: - Published State

    var currentTier: SubscriptionTier = .free
    var currentProductId: String?  // The active subscription's product ID (e.g. "steward.pro.month")
    var products: [Product] = []
    var isPurchasing = false
    var isLoadingProducts = false
    var errorMessage: String?

    /// Where the active subscription was purchased (apple, stripe, or none)
    var subscriptionSource: SubscriptionSource = .none

    /// Pending downgrade info (e.g., user switched from Premium to Pro but Premium is still active)
    var pendingDowngradeTier: SubscriptionTier?  // The tier they're switching TO
    var pendingDowngradeDate: Date?               // When the switch happens

    // Paywall presentation
    var showPaywall = false
    var paywallHighlightedTier: SubscriptionTier = .pro
    var paywallReason: String?

    /// True when subscription is managed via Stripe (web) — iOS should not show StoreKit purchase buttons
    var isManagedViaWeb: Bool {
        subscriptionSource == .stripe && currentTier != .free
    }

    // MARK: - Init

    init() {
        // Start listening for transaction updates immediately.
        // Uses [weak self] so the task naturally stops when the manager is deallocated.
        Task { [weak self] in
            for await result in Transaction.updates {
                guard case .verified(let transaction) = result else { continue }
                do {
                    await transaction.finish()
                } catch {
                    #if DEBUG
                    print("[SubscriptionManager] Failed to finish transaction: \(error)")
                    #endif
                }
                await self?.checkEntitlements()
            }
        }
    }

    // MARK: - Load Products

    func loadProducts() async {
        // Guard against concurrent calls (startup + paywall .task racing)
        guard !isLoadingProducts else { return }
        isLoadingProducts = true
        errorMessage = nil
        defer { isLoadingProducts = false }

        // Retry up to 2 times with a short delay
        for attempt in 0..<3 {
            do {
                let storeProducts = try await Product.products(for: SubscriptionTier.allProductIds)
                products = storeProducts.sorted { a, b in
                    let tierA = SubscriptionTier.tier(for: a.id)
                    let tierB = SubscriptionTier.tier(for: b.id)
                    if tierA.rank != tierB.rank { return tierA.rank < tierB.rank }
                    return a.id.contains("month")
                }
                #if DEBUG
                print("[SubscriptionManager] Loaded \(products.count) products: \(products.map(\.id))")
                #endif
                return // Success — exit
            } catch {
                #if DEBUG
                print("[SubscriptionManager] Failed to load products (attempt \(attempt + 1)): \(error)")
                #endif
                if attempt < 2 {
                    try? await Task.sleep(for: .seconds(Double(attempt + 1)))
                }
            }
        }
        errorMessage = "Could not load subscription options. Tap to retry."
    }

    // MARK: - Check Entitlements

    func checkEntitlements() async {
        var highestTier: SubscriptionTier = .free
        var activeProductId: String?

        for await result in Transaction.currentEntitlements {
            guard case .verified(let transaction) = result else { continue }

            // Only count active subscriptions (not revoked/expired)
            if transaction.revocationDate == nil {
                let tier = SubscriptionTier.tier(for: transaction.productID)
                if tier.rank > highestTier.rank {
                    highestTier = tier
                    activeProductId = transaction.productID
                }
            }
        }

        // Check for pending downgrade via renewal info
        pendingDowngradeTier = nil
        pendingDowngradeDate = nil
        if let activeId = activeProductId {
            if let activeProduct = products.first(where: { $0.id == activeId }),
               let subInfo = activeProduct.subscription {
                if let statuses = try? await subInfo.status, let status = statuses.first {
                    // Extract expiration date from the transaction
                    let expirationDate: Date? = {
                        if case .verified(let tx) = status.transaction { return tx.expirationDate }
                        return nil
                    }()

                    if case .verified(let renewalInfo) = status.renewalInfo {
                        // If auto-renew product differs from current, it's a pending change
                        if let renewProduct = renewalInfo.autoRenewPreference {
                            let renewalTier = SubscriptionTier.tier(for: renewProduct)
                            if renewalTier.rank < highestTier.rank {
                                pendingDowngradeTier = renewalTier
                                pendingDowngradeDate = expirationDate
                            }
                        }
                        // If auto-renew is disabled, they're canceling
                        if renewalInfo.willAutoRenew == false {
                            pendingDowngradeTier = .free
                            pendingDowngradeDate = expirationDate
                        }
                    }
                }
            }
        }

        // If Apple StoreKit found a subscription, use it
        if highestTier != .free {
            currentTier = highestTier
            currentProductId = activeProductId
            subscriptionSource = .apple
            syncToAppStorage()
            syncTierToSupabase()
        } else {
            // No Apple subscription — check Supabase for a Stripe subscription
            await fetchSubscriptionSource()
            if subscriptionSource != .stripe {
                currentTier = .free
                subscriptionSource = .none
                syncToAppStorage()
            }
        }

        #if DEBUG
        print("[SubscriptionManager] Current tier: \(currentTier.displayName), source: \(subscriptionSource.rawValue)")
        #endif
    }

    // MARK: - Fetch Subscription Source from Supabase

    func fetchSubscriptionSource() async {
        do {
            let userId = try await SupabaseConfig.client.auth.session.user.id

            struct SubInfo: Decodable {
                let subscriptionTier: String?
                let subscriptionSource: String?
                enum CodingKeys: String, CodingKey {
                    case subscriptionTier = "subscription_tier"
                    case subscriptionSource = "subscription_source"
                }
            }

            let info: SubInfo = try await SupabaseConfig.client
                .from("profiles")
                .select("subscription_tier, subscription_source")
                .eq("id", value: userId.uuidString)
                .single()
                .execute()
                .value

            if let source = info.subscriptionSource {
                subscriptionSource = SubscriptionSource(rawValue: source) ?? .none
            }

            if subscriptionSource == .stripe, let tierStr = info.subscriptionTier {
                // Normalize case: Stripe webhook writes lowercase ("pro", "premium")
                // but SubscriptionTier rawValues are capitalized ("Pro", "Premium")
                let normalized = tierStr.prefix(1).uppercased() + tierStr.dropFirst().lowercased()
                currentTier = SubscriptionTier(rawValue: normalized) ?? .free
                syncToAppStorage()
            }
        } catch {
            #if DEBUG
            print("[SubscriptionManager] Failed to fetch subscription source: \(error)")
            #endif
        }
    }

    // MARK: - Purchase

    func purchase(_ product: Product) async {
        isPurchasing = true
        errorMessage = nil

        do {
            let result = try await product.purchase()

            switch result {
            case .success(let verification):
                guard case .verified(let transaction) = verification else {
                    errorMessage = "Purchase could not be verified."
                    isPurchasing = false
                    return
                }

                // Finish the transaction
                await transaction.finish()

                // Update tier
                await checkEntitlements()

                #if DEBUG
                print("[SubscriptionManager] Purchased: \(product.id)")
                #endif

            case .userCancelled:
                // User cancelled — no error message needed
                break

            case .pending:
                errorMessage = "Purchase is pending approval."

            @unknown default:
                errorMessage = "An unexpected result occurred."
            }
        } catch {
            errorMessage = ErrorHelper.friendlyMessage(for: error, context: .purchase)
            #if DEBUG
            print("[SubscriptionManager] Purchase error: \(error)")
            #endif
        }

        isPurchasing = false
    }

    // MARK: - Restore Purchases

    func restorePurchases() async {
        isPurchasing = true
        errorMessage = nil

        do {
            try await AppStore.sync()
            await checkEntitlements()
        } catch {
            errorMessage = ErrorHelper.friendlyMessage(for: error, context: .purchase)
        }

        isPurchasing = false
    }

    // MARK: - Paywall Presentation

    func presentPaywall(highlighting tier: SubscriptionTier = .pro, reason: String? = nil) {
        paywallHighlightedTier = tier
        paywallReason = reason
        showPaywall = true
    }

    // MARK: - Helpers

    /// Products filtered by tier
    func products(for tier: SubscriptionTier) -> [Product] {
        products.filter { SubscriptionTier.tier(for: $0.id) == tier }
    }

    /// Get the monthly product for a tier
    func monthlyProduct(for tier: SubscriptionTier) -> Product? {
        guard let id = tier.monthlyProductId else { return nil }
        return products.first { $0.id == id }
    }

    /// Get the yearly product for a tier
    func yearlyProduct(for tier: SubscriptionTier) -> Product? {
        guard let id = tier.yearlyProductId else { return nil }
        return products.first { $0.id == id }
    }

    // MARK: - Supabase Sync

    /// Sync the current subscription tier to Supabase. Only writes if source is Apple.
    private func syncTierToSupabase() {
        guard subscriptionSource == .apple else { return }
        Task {
            do {
                let userId = try await SupabaseConfig.client.auth.session.user.id
                try await SupabaseConfig.client
                    .from("profiles")
                    .update(["subscription_tier": currentTier.rawValue, "subscription_source": "apple"])
                    .eq("id", value: userId.uuidString)
                    .execute()
            } catch {
                #if DEBUG
                print("[SubscriptionManager] Failed to sync tier to Supabase: \(error)")
                #endif
            }
        }
    }

    // MARK: - AppStorage Sync

    /// Keep @AppStorage("subscriptionTier") in sync for backwards compat + App Group for Share Extension
    private func syncToAppStorage() {
        UserDefaults.standard.set(currentTier.rawValue, forKey: "subscriptionTier")
        let shared = UserDefaults(suiteName: "group.Steward.Steward-App")
        shared?.set(currentTier.rawValue, forKey: "subscriptionTier")
        let responseMode = UserDefaults.standard.string(forKey: "defaultResponseMode") ?? "notify"
        shared?.set(responseMode, forKey: "defaultResponseMode")
    }
}
