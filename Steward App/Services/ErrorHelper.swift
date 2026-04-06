import Foundation

/// Maps raw technical errors to user-friendly messages with actionable next steps.
/// Use this everywhere an error might be shown to the user.
enum ErrorHelper {

    /// Convert any error into a friendly, actionable message for the user
    static func friendlyMessage(for error: Error, context: ErrorContext = .general) -> String {
        let raw = error.localizedDescription.lowercased()

        // ── Auth / Session errors ──
        if raw.contains("jwt expired") || raw.contains("pgrst303") || raw.contains("token") && raw.contains("expired") {
            return "Your session has expired. Try again — if it persists, close and reopen Steward to refresh your login."
        }
        if raw.contains("invalid login") || raw.contains("invalid_credentials") || raw.contains("invalid credentials") {
            return "Incorrect phone number or password. Please check and try again."
        }
        if raw.contains("already") && (raw.contains("registered") || raw.contains("exists")) {
            return "An account with this phone number already exists. Try signing in instead."
        }
        if raw.contains("rate limit") || raw.contains("too many") || raw.contains("429") {
            return "Too many attempts. Please wait a moment and try again."
        }
        if raw.contains("otp") || (raw.contains("verification") && raw.contains("code")) || (raw.contains("token") && raw.contains("invalid")) {
            return "Invalid verification code. Please check and try again."
        }
        if raw.contains("password") && (raw.contains("short") || raw.contains("weak") || raw.contains("length")) {
            return "Password must be at least 6 characters."
        }
        if raw.contains("not authorized") || raw.contains("unauthorized") || raw.contains("401") {
            return "You're not signed in or your session expired. Please sign in again."
        }

        // ── Network errors ──
        if raw.contains("offline") || raw.contains("internet") || raw.contains("network") && raw.contains("unavailable") {
            return "No internet connection. Check your network and try again."
        }
        if raw.contains("timed out") || raw.contains("timeout") || raw.contains("request timed") {
            return "The request took too long. Check your connection and try again."
        }
        if raw.contains("could not connect") || raw.contains("cannot connect") || raw.contains("connection") && raw.contains("refused") {
            return "Couldn't connect to the server. Please check your internet and try again."
        }
        if raw.contains("ssl") || raw.contains("certificate") {
            return "Secure connection failed. Please check your network and try again."
        }

        // ── Supabase / Database errors ──
        if raw.contains("pgrst") || raw.contains("relation") || raw.contains("column") && raw.contains("does not exist") {
            return "Something went wrong on our end. Please try again — if the issue persists, contact support."
        }
        if raw.contains("duplicate key") || raw.contains("unique constraint") {
            return "This item already exists. Try refreshing your watches."
        }
        if raw.contains("row not found") || raw.contains("no rows") || raw.contains("not found") {
            return "This item was not found. It may have been deleted. Try refreshing."
        }

        // ── Purchase errors ──
        if raw.contains("cancelled") || raw.contains("canceled") || raw.contains("user cancel") {
            return "Purchase was cancelled."
        }
        if raw.contains("billing") || raw.contains("payment") {
            return "There was a billing issue. Please check your payment method in Settings and try again."
        }
        if raw.contains("not available") && raw.contains("subscription") {
            return "This subscription is currently unavailable. Please try again later."
        }

        // ── Speech recognition ──
        if raw.contains("speech") || raw.contains("recognition") {
            return "Voice input isn't available right now. Please type your message instead."
        }

        // ── Context-specific fallbacks ──
        switch context {
        case .auth:
            return "Sign-in failed. Please try again."
        case .chat:
            return "Something went wrong. Tap to retry, or try describing your request differently."
        case .sync:
            return "Couldn't sync your watches. Pull down to refresh, or check your internet connection."
        case .share:
            return "Couldn't create the watch. Tap Try Again — if it persists, open Steward and try sharing again."
        case .purchase:
            return "Purchase couldn't be completed. Please try again."
        case .general:
            return "Something went wrong. Please try again."
        }
    }

    enum ErrorContext {
        case auth
        case chat
        case sync
        case share
        case purchase
        case general
    }
}
