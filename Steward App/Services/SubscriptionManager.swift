import Foundation
import StoreKit
import SwiftUI
import Observation

@Observable
@MainActor
final class SubscriptionManager {

    // MARK: - Published State

    var currentTier: SubscriptionTier = .free
    var products: [Product] = []
    var isPurchasing = false
    var errorMessage: String?

    // Paywall presentation
    var showPaywall = false
    var paywallHighlightedTier: SubscriptionTier = .pro
    var paywallReason: String?

    // MARK: - Init

    init() {
        // Start listening for transaction updates immediately.
        // Uses [weak self] so the task naturally stops when the manager is deallocated.
        Task { [weak self] in
            for await result in Transaction.updates {
                guard case .verified(let transaction) = result else { continue }
                await transaction.finish()
                await self?.checkEntitlements()
            }
        }
    }

    // MARK: - Load Products

    func loadProducts() async {
        do {
            let storeProducts = try await Product.products(for: SubscriptionTier.allProductIds)
            // Sort: Pro monthly, Pro yearly, Premium monthly, Premium yearly
            products = storeProducts.sorted { a, b in
                let tierA = SubscriptionTier.tier(for: a.id)
                let tierB = SubscriptionTier.tier(for: b.id)
                if tierA.rank != tierB.rank { return tierA.rank < tierB.rank }
                // Monthly before yearly within same tier
                return a.id.contains("month")
            }
            #if DEBUG
            print("[SubscriptionManager] Loaded \(products.count) products: \(products.map(\.id))")
            #endif
        } catch {
            #if DEBUG
            print("[SubscriptionManager] Failed to load products: \(error)")
            #endif
            errorMessage = "Could not load subscription options."
        }
    }

    // MARK: - Check Entitlements

    func checkEntitlements() async {
        var highestTier: SubscriptionTier = .free

        for await result in Transaction.currentEntitlements {
            guard case .verified(let transaction) = result else { continue }

            // Only count active subscriptions (not revoked/expired)
            if transaction.revocationDate == nil {
                let tier = SubscriptionTier.tier(for: transaction.productID)
                if tier.rank > highestTier.rank {
                    highestTier = tier
                }
            }
        }

        currentTier = highestTier
        syncToAppStorage()
        syncTierToSupabase()

        #if DEBUG
        print("[SubscriptionManager] Current tier: \(currentTier.displayName)")
        #endif
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
            errorMessage = "Purchase failed: \(error.localizedDescription)"
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
            errorMessage = "Could not restore purchases: \(error.localizedDescription)"
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

    /// Sync the current subscription tier to Supabase so the web app can read it
    private func syncTierToSupabase() {
        Task {
            do {
                let userId = try await SupabaseConfig.client.auth.session.user.id
                try await SupabaseConfig.client
                    .from("profiles")
                    .update(["subscription_tier": currentTier.rawValue])
                    .eq("id", value: userId.uuidString)
                    .execute()
                #if DEBUG
                print("[SubscriptionManager] Synced tier to Supabase: \(currentTier.rawValue)")
                #endif
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
        let shared = UserDefaults(suiteName: "group.Steward.Steward-App")
        UserDefaults.standard.set(currentTier.rawValue, forKey: "subscriptionTier")
        // Also sync to App Group so Share Extension can read the tier
        shared?.set(currentTier.rawValue, forKey: "subscriptionTier")
        // Sync response mode default so Share Extension applies it to new watches
        let responseMode = UserDefaults.standard.string(forKey: "defaultResponseMode") ?? "notify"
        shared?.set(responseMode, forKey: "defaultResponseMode")
    }
}
