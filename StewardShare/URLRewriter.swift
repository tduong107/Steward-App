import Foundation

/// Result of rewriting a URL to its public equivalent.
struct RewriteResult {
    let rewrittenURL: String    // Public URL to actually monitor
    let originalURL: String     // Preserve original for display
    let extraContext: String    // Rich context for the AI (venue name, date, etc.)
    let siteName: String        // Human-readable site name
    let wasRewritten: Bool      // Whether the URL was actually changed
}

/// Categories of websites, used to show contextually-relevant suggestion chips in the share extension.
enum SiteCategory: String {
    case restaurant   // Resy, OpenTable, Yelp, Tock, SevenRooms
    case ticketing    // Ticketmaster, Eventbrite, StubHub, SeatGeek
    case ecommerce    // Amazon, eBay, Walmart, Target, etc.
    case general      // Everything else
}

/// Rewrites auth-walled or app-deep-link URLs to their public equivalents
/// and extracts rich context (venue name, date, party size, event name) for the AI.
enum URLRewriter {

    /// Determines the site category from a URL, used for context-aware share extension suggestions.
    /// Uses `siteName` from `RewriteResult` when available, otherwise falls back to host-based matching.
    static func categorize(_ urlString: String, rewriteResult: RewriteResult?) -> SiteCategory {
        // If URLRewriter already identified the site, use that
        if let siteName = rewriteResult?.siteName.lowercased() {
            switch siteName {
            case "resy", "opentable":
                return .restaurant
            case "ticketmaster":
                return .ticketing
            default:
                break
            }
        }

        guard let url = URL(string: urlString),
              let host = url.host?.lowercased() else {
            return .general
        }

        // Restaurant / Booking platforms
        let restaurantDomains = ["resy.com", "opentable.com", "exploretock.com",
                                 "sevenrooms.com", "yelp.com/reservations"]
        if restaurantDomains.contains(where: { host.contains($0) || urlString.lowercased().contains($0) }) {
            return .restaurant
        }

        // Ticketing / Events
        let ticketingDomains = ["ticketmaster.com", "eventbrite.com", "axs.com",
                                "stubhub.com", "seatgeek.com", "vividseats.com",
                                "dice.fm", "livenation.com"]
        if ticketingDomains.contains(where: { host.contains($0) }) {
            return .ticketing
        }

        // E-commerce
        let ecommerceDomains = ["amazon.", "ebay.com", "walmart.com", "target.com",
                                "bestbuy.com", "nike.com", "adidas.com", "apple.com/shop",
                                "newegg.com", "bhphotovideo.com", "costco.com",
                                "etsy.com", "nordstrom.com", "macys.com", "zappos.com"]
        if ecommerceDomains.contains(where: { host.contains($0) || urlString.lowercased().contains($0) }) {
            return .ecommerce
        }

        return .general
    }

    /// Attempts to rewrite a URL to its public equivalent.
    /// Returns nil if the site is not recognized or doesn't need rewriting.
    static func rewrite(_ urlString: String) -> RewriteResult? {
        guard let url = URL(string: urlString) else { return nil }
        let host = url.host?.lowercased() ?? ""

        if host.contains("resy.com") {
            return rewriteResy(url, original: urlString)
        }
        if host.contains("opentable.com") {
            return rewriteOpenTable(url, original: urlString)
        }
        if host.contains("ticketmaster.com") || host.contains("ticketmaster.") {
            return rewriteTicketmaster(url, original: urlString)
        }

        return nil
    }

    // MARK: - Resy

    /// Resy URLs from the app:
    ///   - resy.com/cities/ny/carbone?date=2026-03-15&seats=2  (public — already good)
    ///   - resy.com/cities/ny/venues/3003                       (venue ID — less useful)
    /// We normalize to the /cities/{city}/{slug} pattern and extract context.
    private static func rewriteResy(_ url: URL, original: String) -> RewriteResult {
        let pathComponents = url.pathComponents.filter { $0 != "/" }
        let params = URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems ?? []

        // Extract query params
        let date = params.first(where: { $0.name == "date" })?.value
        let seats = params.first(where: { $0.name == "seats" || $0.name == "party_size" })?.value

        // Try to extract restaurant name from path
        // Patterns: /cities/{city}/{restaurant} or /cities/{city}/venues/{id}
        var restaurantSlug: String?
        var city: String?

        if pathComponents.count >= 3 && pathComponents[0].lowercased() == "cities" {
            city = pathComponents[1]
            let candidate = pathComponents[2]
            if candidate.lowercased() != "venues" {
                restaurantSlug = candidate
            } else if pathComponents.count >= 4 {
                // /cities/ny/venues/3003 — we have venue ID but no slug
                // Keep the URL as-is, the public page should still render
                restaurantSlug = nil
            }
        }

        // Build human-readable restaurant name
        let restaurantName = restaurantSlug.map { slug in
            slug.replacingOccurrences(of: "-", with: " ")
                .split(separator: " ")
                .map { $0.prefix(1).uppercased() + $0.dropFirst() }
                .joined(separator: " ")
        }

        // Build the canonical public URL (preserve original query params)
        // The original URL pattern is already the public page, so we keep it
        let rewrittenURL = original

        // Build rich context for AI
        var contextParts: [String] = []
        contextParts.append("Site: Resy (restaurant reservation platform)")
        if let name = restaurantName {
            contextParts.append("Restaurant: \(name)")
        }
        if let city = city {
            contextParts.append("City: \(city.uppercased())")
        }
        if let date = date {
            contextParts.append("Requested date: \(date)")
        }
        if let seats = seats {
            contextParts.append("Party size: \(seats)")
        }
        contextParts.append("Watch suggestion: Monitor for reservation availability at this restaurant. The public page shows open time slots without requiring login.")

        return RewriteResult(
            rewrittenURL: rewrittenURL,
            originalURL: original,
            extraContext: contextParts.joined(separator: "\n"),
            siteName: "Resy",
            wasRewritten: false  // URL itself doesn't change for standard Resy links
        )
    }

    // MARK: - OpenTable

    /// OpenTable URLs:
    ///   - opentable.com/r/carbone-new-york            (public — already good)
    ///   - opentable.com/booking/experiences/...         (booking deep link — needs rewrite)
    ///   - opentable.com/restref/client/?rid=123&...     (reservation reference)
    private static func rewriteOpenTable(_ url: URL, original: String) -> RewriteResult {
        let pathComponents = url.pathComponents.filter { $0 != "/" }
        let params = URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems ?? []

        var restaurantSlug: String?
        let rewrittenURL = original
        let wasRewritten = false

        // /r/{restaurant-slug} — already public
        if pathComponents.count >= 2 && pathComponents[0].lowercased() == "r" {
            restaurantSlug = pathComponents[1]
        }
        // /booking/... → try to extract restaurant ID and construct /r/ URL
        else if pathComponents.first?.lowercased() == "booking" {
            if let _ = params.first(where: { $0.name == "rid" || $0.name == "restaurantId" })?.value {
                // We can't easily convert RID to slug, but keep the original URL
                // The public booking page may still be accessible
                restaurantSlug = nil
            }
        }
        // /restref/client/ — restaurant reference link
        else if pathComponents.contains("restref") {
            let _ = params.first(where: { $0.name == "rid" })?.value
        }

        let restaurantName = restaurantSlug.map { slug in
            slug.replacingOccurrences(of: "-", with: " ")
                .split(separator: " ")
                .map { $0.prefix(1).uppercased() + $0.dropFirst() }
                .joined(separator: " ")
        }

        let date = params.first(where: { $0.name == "dateTime" || $0.name == "date" || $0.name == "startDate" })?.value
        let seats = params.first(where: { $0.name == "covers" || $0.name == "partySize" || $0.name == "party_size" })?.value

        var contextParts: [String] = []
        contextParts.append("Site: OpenTable (restaurant reservation platform)")
        if let name = restaurantName {
            contextParts.append("Restaurant: \(name)")
        }
        if let date = date {
            contextParts.append("Requested date: \(date)")
        }
        if let seats = seats {
            contextParts.append("Party size: \(seats)")
        }
        contextParts.append("Watch suggestion: Monitor for reservation availability at this restaurant. OpenTable public pages show available time slots.")

        return RewriteResult(
            rewrittenURL: rewrittenURL,
            originalURL: original,
            extraContext: contextParts.joined(separator: "\n"),
            siteName: "OpenTable",
            wasRewritten: wasRewritten
        )
    }

    // MARK: - Ticketmaster

    /// Ticketmaster URLs:
    ///   - ticketmaster.com/event/{eventId}                     (public — already good)
    ///   - ticketmaster.com/{event-name}/event/{eventId}        (public with SEO slug)
    ///   - ticketmaster.com/checkout/...                         (checkout — needs rewrite)
    ///   - ticketmaster.com/artist/{artistId}                   (public artist page)
    private static func rewriteTicketmaster(_ url: URL, original: String) -> RewriteResult {
        let pathComponents = url.pathComponents.filter { $0 != "/" }

        var eventId: String?
        var eventSlug: String?
        var rewrittenURL = original
        var wasRewritten = false

        // Find "event" segment and extract the ID after it
        if let eventIdx = pathComponents.firstIndex(where: { $0.lowercased() == "event" }) {
            let nextIdx = pathComponents.index(after: eventIdx)
            if nextIdx < pathComponents.endIndex {
                eventId = pathComponents[nextIdx]
            }
            // Check for SEO slug before "event"
            if eventIdx > 0 {
                eventSlug = pathComponents[eventIdx - 1]
            }
        }
        // /checkout/ or /cart/ — try to find event ID in query params
        else if pathComponents.contains("checkout") || pathComponents.contains("cart") {
            let params = URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems ?? []
            eventId = params.first(where: { $0.name == "eventId" || $0.name == "event_id" })?.value
            if let eid = eventId {
                // Rewrite to public event page
                rewrittenURL = "https://www.ticketmaster.com/event/\(eid)"
                wasRewritten = true
            }
        }

        let eventName = eventSlug.map { slug in
            slug.replacingOccurrences(of: "-", with: " ")
                .split(separator: " ")
                .map { $0.prefix(1).uppercased() + $0.dropFirst() }
                .joined(separator: " ")
        }

        var contextParts: [String] = []
        contextParts.append("Site: Ticketmaster (ticket sales platform)")
        if let name = eventName {
            contextParts.append("Event: \(name)")
        }
        if let eid = eventId {
            contextParts.append("Event ID: \(eid)")
        }
        contextParts.append("Watch suggestion: Monitor for ticket availability or price changes. Ticketmaster event pages are public and show ticket availability.")

        return RewriteResult(
            rewrittenURL: rewrittenURL,
            originalURL: original,
            extraContext: contextParts.joined(separator: "\n"),
            siteName: "Ticketmaster",
            wasRewritten: wasRewritten
        )
    }
}
