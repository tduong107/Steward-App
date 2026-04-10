import Foundation
import PostHog

/// Centralized analytics service using PostHog.
/// Tracks user actions across the app for funnel analysis, retention, and conversion.
@MainActor
final class AnalyticsService {
    static let shared = AnalyticsService()

    private init() {}

    // MARK: - Setup

    /// Call once at app startup (in Steward_AppApp.swift)
    func configure() {
        let config = PostHogConfig(apiKey: "phc_AVWWXk2iXjdwtnpdc9NnFAzHZwYgzz8zqNENfPpgRcM3")
        config.host = "https://us.i.posthog.com"
        config.captureScreenViews = true // Auto-track screen views
        config.captureApplicationLifecycleEvents = true // App open, background, etc.
        config.flushAt = 5 // Send events in batches of 5
        config.flushIntervalSeconds = 30
        PostHogSDK.shared.setup(config)
    }

    // MARK: - User Identity

    /// Identify the user after login/signup (links anonymous events to this user)
    func identify(userId: UUID, properties: [String: Any] = [:]) {
        var props = properties
        props["platform"] = "ios"
        PostHogSDK.shared.identify(userId.uuidString, userProperties: props)
    }

    /// Set user properties (tier, watch count, etc.)
    func setUserProperties(_ properties: [String: Any]) {
        PostHogSDK.shared.identify(PostHogSDK.shared.getDistinctId(), userProperties: properties)
    }

    /// Reset identity on logout
    func reset() {
        PostHogSDK.shared.reset()
    }

    // MARK: - Auth Events

    func trackSignUp(method: String) {
        PostHogSDK.shared.capture("user_signed_up", properties: ["method": method, "platform": "ios"])
    }

    func trackSignIn(method: String) {
        PostHogSDK.shared.capture("user_signed_in", properties: ["method": method, "platform": "ios"])
    }

    func trackOAuthInitiated(provider: String, isSignUp: Bool) {
        let event = isSignUp ? "oauth_sign_up_initiated" : "oauth_sign_in_initiated"
        PostHogSDK.shared.capture(event, properties: ["provider": provider, "platform": "ios"])
    }

    // MARK: - Watch Events

    func trackWatchCreated(watchId: UUID, name: String, actionType: String, watchMode: String, frequency: String) {
        PostHogSDK.shared.capture("watch_created", properties: [
            "watch_id": watchId.uuidString,
            "watch_name": name,
            "action_type": actionType,
            "watch_mode": watchMode,
            "check_frequency": frequency,
            "platform": "ios",
        ])
    }

    func trackWatchTriggeredCTAClicked(watchId: UUID, actionType: String) {
        PostHogSDK.shared.capture("watch_triggered_cta_clicked", properties: [
            "watch_id": watchId.uuidString,
            "action_type": actionType,
            "platform": "ios",
        ])
    }

    func trackWatchPaused(watchId: UUID) {
        PostHogSDK.shared.capture("watch_paused", properties: ["watch_id": watchId.uuidString, "platform": "ios"])
    }

    func trackWatchResumed(watchId: UUID) {
        PostHogSDK.shared.capture("watch_resumed", properties: ["watch_id": watchId.uuidString, "platform": "ios"])
    }

    func trackWatchDeleted(watchId: UUID) {
        PostHogSDK.shared.capture("watch_deleted", properties: ["watch_id": watchId.uuidString, "platform": "ios"])
    }

    func trackWatchShared(watchId: UUID) {
        PostHogSDK.shared.capture("watch_shared", properties: ["watch_id": watchId.uuidString, "platform": "ios"])
    }

    // MARK: - AI Chat Events

    func trackAIChatMessageSent(messageLength: Int, hasURL: Bool, hasImage: Bool) {
        PostHogSDK.shared.capture("ai_chat_message_sent", properties: [
            "message_length": messageLength,
            "has_url": hasURL,
            "has_image": hasImage,
            "platform": "ios",
        ])
    }

    // MARK: - Share Extension

    func trackShareExtensionUsed(domain: String) {
        PostHogSDK.shared.capture("share_extension_used", properties: [
            "domain": domain,
            "platform": "ios",
        ])
    }

    // MARK: - Subscription Events

    func trackPaywallViewed(currentTier: String, reason: String? = nil) {
        var props: [String: Any] = ["current_tier": currentTier, "platform": "ios"]
        if let reason { props["trigger_reason"] = reason }
        PostHogSDK.shared.capture("paywall_viewed", properties: props)
    }

    func trackSubscriptionStarted(tier: String, price: String, billing: String) {
        PostHogSDK.shared.capture("subscription_started", properties: [
            "tier": tier,
            "price": price,
            "billing": billing,
            "platform": "ios",
        ])
    }

    func trackSubscriptionUpgradeStarted(fromTier: String, toTier: String) {
        PostHogSDK.shared.capture("subscription_upgrade_started", properties: [
            "from_tier": fromTier,
            "to_tier": toTier,
            "platform": "ios",
        ])
    }

    // MARK: - Engagement Events

    func trackNotificationTapped(type: String, watchId: String? = nil) {
        var props: [String: Any] = ["notification_type": type, "platform": "ios"]
        if let watchId { props["watch_id"] = watchId }
        PostHogSDK.shared.capture("notification_tapped", properties: props)
    }

    func trackActionCompleted(watchId: UUID, actionType: String) {
        PostHogSDK.shared.capture("action_completed", properties: [
            "watch_id": watchId.uuidString,
            "action_type": actionType,
            "platform": "ios",
        ])
    }

    func trackAppSession(sessionNumber: Int, daysSinceSignup: Int) {
        PostHogSDK.shared.capture("app_session", properties: [
            "session_number": sessionNumber,
            "days_since_signup": daysSinceSignup,
            "platform": "ios",
        ])
    }

    // MARK: - Settings

    func trackSettingsChanged(setting: String, value: Any) {
        PostHogSDK.shared.capture("settings_changed", properties: [
            "setting_name": setting,
            "setting_value": "\(value)",
            "platform": "ios",
        ])
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
