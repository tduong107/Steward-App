import Foundation

/// Retailers that are known to be unreliable for price tracking because they
/// combine aggressive anti-bot protection with absence from Google Shopping,
/// which makes every one of our fallback paths fail.
///
/// Used to warn the user *before* they create a watch we can't actually monitor.
///
/// ## Why these specifically
/// - **Temu**: heavy Cloudflare + device fingerprinting blocks direct fetch;
///   `goods_id` URLs are not indexed by Google Shopping; Claude Web Search
///   returns no structured data. Seen in production (watch id
///   `50624759-23f0-4337-95f6-94b7fdfaeb89`) with 100% failure rate since creation.
/// - **Shein**: same anti-bot posture as Temu; prices are heavily geo-rotated
///   so even a one-off fetch produces misleading results.
/// - **Wish**: similar anti-bot behavior; inventory churns fast enough that
///   tracked URLs go stale within days.
/// - **AliExpress**: blocks scrapers and region-locks pricing; "price" has
///   no single answer.
///
/// When adding a new entry here, also add it to the server-side blocked-domain
/// list in `supabase/functions/check-watch/index.ts` so the backend matches.
enum TrackingReliability {

    /// Root domains (no subdomain prefix) where tracking is known to fail.
    private static let unreliableHosts: Set<String> = [
        "temu.com",
        "shein.com",
        "wish.com",
        "aliexpress.com",
        "aliexpress.us",
    ]

    /// Returns true when the URL's host matches a known tracking-unreliable
    /// retailer. Case-insensitive; handles `www.` and country subdomains.
    static func isUnreliable(url: String) -> Bool {
        guard let host = URL(string: url)?.host?.lowercased() else { return false }
        let stripped = host.hasPrefix("www.") ? String(host.dropFirst(4)) : host
        if unreliableHosts.contains(stripped) { return true }
        // Match country subdomains like "us.shein.com" or "fr.aliexpress.com"
        return unreliableHosts.contains(where: { stripped.hasSuffix(".\($0)") })
    }

    /// Returns a friendly brand name (e.g. "Temu") for display in warnings.
    /// Falls back to "This retailer" if the URL is malformed.
    static func siteName(url: String) -> String {
        guard let host = URL(string: url)?.host?.lowercased() else { return "This retailer" }
        let stripped = host.hasPrefix("www.") ? String(host.dropFirst(4)) : host
        // Find the matching root domain (handles country subdomains)
        let match = unreliableHosts.first(where: { stripped == $0 || stripped.hasSuffix(".\($0)") })
        guard let rootDomain = match,
              let firstSegment = rootDomain.split(separator: ".").first else {
            return "This retailer"
        }
        let name = String(firstSegment)
        return name.prefix(1).uppercased() + name.dropFirst()
    }

    /// One-sentence user-facing explanation shown in warning UI.
    /// Safe to use even when `isUnreliable` is false — will read as generic.
    static func warningMessage(for url: String) -> String {
        let name = siteName(url: url)
        return "\(name) blocks price-tracking tools and isn't indexed by Google Shopping, so checks will likely fail. For better results, try \"Best Price Anywhere\" with the product name — we'll find it on other retailers."
    }
}
