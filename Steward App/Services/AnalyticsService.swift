import Foundation
#if canImport(PostHog)
import PostHog
#endif

/// Centralized analytics service using PostHog.
/// Tracks user actions across the app for funnel analysis, retention, and conversion.
///
/// ## Compilation gate
/// The whole file is wrapped in `#if canImport(PostHog)`. When the PostHog
/// SPM package is linked into the Steward App target, every method calls
/// the real SDK. When it isn't linked (e.g. after a pbxproj revert that
/// drops the dependency but leaves this file in place), the methods become
/// no-ops and the build still succeeds. To re-enable real analytics, add
/// the `posthog-ios` package back via Xcode → File → Add Package
/// Dependencies (`https://github.com/PostHog/posthog-ios`, 3.0.0+) — no
/// code changes required here.
@MainActor
final class AnalyticsService {
    static let shared = AnalyticsService()

    private init() {}

    // MARK: - Setup

    /// Call once at app startup (in Steward_AppApp.swift)
    func configure() {
        #if canImport(PostHog)
        let config = PostHogConfig(
            apiKey: "phc_AVWWXk2iXjdwtnpdc9NnFAzHZwYgzz8zqNENfPpgRcM3",
            host: "https://us.i.posthog.com"
        )
        config.captureScreenViews = true // Auto-track screen views
        config.captureApplicationLifecycleEvents = true // App open, background, etc.
        config.flushAt = 5 // Send events in batches of 5
        config.flushIntervalSeconds = 30
        PostHogSDK.shared.setup(config)
        #endif
    }

    // MARK: - User Identity

    /// Identify the user after login/signup (links anonymous events to this user)
    func identify(userId: UUID, properties: [String: Any] = [:]) {
        #if canImport(PostHog)
        var props = properties
        props["platform"] = "ios"
        PostHogSDK.shared.identify(userId.uuidString, userProperties: props)
        #endif
    }

    /// Set user properties (tier, watch count, etc.)
    func setUserProperties(_ properties: [String: Any]) {
        #if canImport(PostHog)
        PostHogSDK.shared.identify(PostHogSDK.shared.getDistinctId(), userProperties: properties)
        #endif
    }

    /// Reset identity on logout
    func reset() {
        #if canImport(PostHog)
        PostHogSDK.shared.reset()
        #endif
    }

    // MARK: - Auth Events

    func trackSignUp(method: String) {
        #if canImport(PostHog)
        PostHogSDK.shared.capture("user_signed_up", properties: ["method": method, "platform": "ios"])
        #endif
    }

    func trackSignIn(method: String) {
        #if canImport(PostHog)
        PostHogSDK.shared.capture("user_signed_in", properties: ["method": method, "platform": "ios"])
        #endif
    }

    func trackOAuthInitiated(provider: String, isSignUp: Bool) {
        #if canImport(PostHog)
        let event = isSignUp ? "oauth_sign_up_initiated" : "oauth_sign_in_initiated"
        PostHogSDK.shared.capture(event, properties: ["provider": provider, "platform": "ios"])
        #endif
    }

    // MARK: - Watch Events

    func trackWatchCreated(watchId: UUID, name: String, actionType: String, watchMode: String, frequency: String) {
        #if canImport(PostHog)
        PostHogSDK.shared.capture("watch_created", properties: [
            "watch_id": watchId.uuidString,
            "watch_name": name,
            "action_type": actionType,
            "watch_mode": watchMode,
            "check_frequency": frequency,
            "platform": "ios",
        ])
        #endif
    }

    func trackWatchTriggeredCTAClicked(watchId: UUID, actionType: String) {
        #if canImport(PostHog)
        PostHogSDK.shared.capture("watch_triggered_cta_clicked", properties: [
            "watch_id": watchId.uuidString,
            "action_type": actionType,
            "platform": "ios",
        ])
        #endif
    }

    func trackWatchPaused(watchId: UUID) {
        #if canImport(PostHog)
        PostHogSDK.shared.capture("watch_paused", properties: ["watch_id": watchId.uuidString, "platform": "ios"])
        #endif
    }

    func trackWatchResumed(watchId: UUID) {
        #if canImport(PostHog)
        PostHogSDK.shared.capture("watch_resumed", properties: ["watch_id": watchId.uuidString, "platform": "ios"])
        #endif
    }

    func trackWatchDeleted(watchId: UUID) {
        #if canImport(PostHog)
        PostHogSDK.shared.capture("watch_deleted", properties: ["watch_id": watchId.uuidString, "platform": "ios"])
        #endif
    }

    func trackWatchShared(watchId: UUID) {
        #if canImport(PostHog)
        PostHogSDK.shared.capture("watch_shared", properties: ["watch_id": watchId.uuidString, "platform": "ios"])
        #endif
    }

    // MARK: - AI Chat Events

    func trackAIChatMessageSent(messageLength: Int, hasURL: Bool, hasImage: Bool) {
        #if canImport(PostHog)
        PostHogSDK.shared.capture("ai_chat_message_sent", properties: [
            "message_length": messageLength,
            "has_url": hasURL,
            "has_image": hasImage,
            "platform": "ios",
        ])
        #endif
    }

    // MARK: - Share Extension

    func trackShareExtensionUsed(domain: String) {
        #if canImport(PostHog)
        PostHogSDK.shared.capture("share_extension_used", properties: [
            "domain": domain,
            "platform": "ios",
        ])
        #endif
    }

    // MARK: - Subscription Events

    func trackPaywallViewed(currentTier: String, reason: String? = nil) {
        #if canImport(PostHog)
        var props: [String: Any] = ["current_tier": currentTier, "platform": "ios"]
        if let reason { props["trigger_reason"] = reason }
        PostHogSDK.shared.capture("paywall_viewed", properties: props)
        #endif
    }

    func trackSubscriptionStarted(tier: String, price: String, billing: String) {
        #if canImport(PostHog)
        PostHogSDK.shared.capture("subscription_started", properties: [
            "tier": tier,
            "price": price,
            "billing": billing,
            "platform": "ios",
        ])
        #endif
    }

    func trackSubscriptionUpgradeStarted(fromTier: String, toTier: String) {
        #if canImport(PostHog)
        PostHogSDK.shared.capture("subscription_upgrade_started", properties: [
            "from_tier": fromTier,
            "to_tier": toTier,
            "platform": "ios",
        ])
        #endif
    }

    // MARK: - Engagement Events

    func trackNotificationTapped(type: String, watchId: String? = nil) {
        #if canImport(PostHog)
        var props: [String: Any] = ["notification_type": type, "platform": "ios"]
        if let watchId { props["watch_id"] = watchId }
        PostHogSDK.shared.capture("notification_tapped", properties: props)
        #endif
    }

    func trackActionCompleted(watchId: UUID, actionType: String) {
        #if canImport(PostHog)
        PostHogSDK.shared.capture("action_completed", properties: [
            "watch_id": watchId.uuidString,
            "action_type": actionType,
            "platform": "ios",
        ])
        #endif
    }

    func trackAppSession(sessionNumber: Int, daysSinceSignup: Int) {
        #if canImport(PostHog)
        PostHogSDK.shared.capture("app_session", properties: [
            "session_number": sessionNumber,
            "days_since_signup": daysSinceSignup,
            "platform": "ios",
        ])
        #endif
    }

    // MARK: - Settings

    func trackSettingsChanged(setting: String, value: Any) {
        #if canImport(PostHog)
        PostHogSDK.shared.capture("settings_changed", properties: [
            "setting_name": setting,
            "setting_value": "\(value)",
            "platform": "ios",
        ])
        #endif
    }

    // MARK: - Super Properties (set once, sent with every event)

    func updateSuperProperties(tier: String, watchCount: Int) {
        setUserProperties([
            "subscription_tier": tier,
            "watch_count": watchCount,
            "platform": "ios",
        ])
    }
}
