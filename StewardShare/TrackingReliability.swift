import Foundation

/// Retailers that are known to be unreliable for price tracking because they
/// combine aggressive anti-bot protection with absence from Google Shopping,
/// which makes every one of our fallback paths fail.
///
/// Used to warn the user *before* they create a watch we can't actually monitor.
///
/// NOTE: This file is intentionally duplicated between the main app target and
/// the Share Extension target (StewardShare) because the Share Extension is a
/// separate compilation unit. Keep both copies in sync.
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
        let match = unreliableHosts.first(where: { stripped == $0 || stripped.hasSuffix(".\($0)") })
        guard let rootDomain = match,
              let firstSegment = rootDomain.split(separator: ".").first else {
            return "This retailer"
        }
        let name = String(firstSegment)
        return name.prefix(1).uppercased() + name.dropFirst()
    }

    /// One-sentence user-facing explanation shown in warning UI.
    static func warningMessage(for url: String) -> String {
        let name = siteName(url: url)
        return "\(name) blocks price-tracking tools and isn't indexed by Google Shopping, so checks will likely fail. For better results, try \"Best Price Anywhere\" with the product name — we'll find it on other retailers."
    }
}
