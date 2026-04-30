import Foundation

/// Country reference data for the auth phone-input picker. Mirrors the
/// web app's `web/src/lib/countries.ts` so iOS and web ship the same
/// curated set of Twilio-deliverable regions. When you add a country
/// here, mirror it to the TypeScript file (and vice-versa) so both
/// platforms stay in sync.
///
/// Excluded from the list:
/// - Regions requiring sender-ID pre-registration we haven't done
///   (India DLT, Indonesia masking).
/// - Sanctioned / unreachable regions Twilio won't deliver to.
/// - Microstates with negligible likelihood of relevance.
struct Country: Identifiable, Hashable, Codable {
    /// ISO 3166-1 alpha-2 country code (`"US"`, `"GB"`, `"ES"`).
    let code: String
    /// Human-readable country name (English).
    let name: String
    /// E.164 dial code with leading `+` (`"+1"`, `"+44"`, `"+34"`).
    let dial: String
    /// Country flag emoji.
    let flag: String

    /// `Identifiable` conformance — ISO code is unique per row.
    var id: String { code }

    /// Combine this country's dial code with a local-number string and
    /// produce the E.164 string that Supabase expects. Strips any
    /// non-digit characters from `localNumber` (users may type spaces,
    /// dashes, parentheses).
    ///
    /// Example: `Country(dial: "+34", …).buildE164(localNumber: "634 695 622")`
    /// returns `"+34634695622"`.
    func buildE164(localNumber: String) -> String {
        let digits = localNumber.filter { $0.isNumber }
        return "\(dial)\(digits)"
    }
}

extension Country {
    /// Default country shown when the picker first appears. US matches
    /// the existing user base.
    static let `default`: Country = Country(
        code: "US", name: "United States", dial: "+1", flag: "🇺🇸"
    )

    /// Heuristic minimum length for the LOCAL portion (after country code).
    /// Used to enable/disable the submit button. Permissive — Supabase
    /// and Twilio do the authoritative validation server-side.
    ///
    /// - US/Canada (+1): 10 digits.
    /// - Most European mobiles: 8-10 digits after country code.
    /// - Iceland (+354), Norway (+47): 7-8 digits.
    ///
    /// 7 is the floor that catches the shortest realistic mobile
    /// numbers without bouncing legitimate ones.
    static let minLocalDigits: Int = 7

    /// Curated list of countries where Twilio reliably delivers SMS
    /// one-time-codes for Supabase phone auth. US first (default), then
    /// alphabetical by `name`.
    static let all: [Country] = [
        // Default first
        Country(code: "US", name: "United States", dial: "+1", flag: "🇺🇸"),
        // Alphabetical
        Country(code: "AR", name: "Argentina", dial: "+54", flag: "🇦🇷"),
        Country(code: "AU", name: "Australia", dial: "+61", flag: "🇦🇺"),
        Country(code: "AT", name: "Austria", dial: "+43", flag: "🇦🇹"),
        Country(code: "BE", name: "Belgium", dial: "+32", flag: "🇧🇪"),
        Country(code: "BR", name: "Brazil", dial: "+55", flag: "🇧🇷"),
        Country(code: "CA", name: "Canada", dial: "+1", flag: "🇨🇦"),
        Country(code: "CL", name: "Chile", dial: "+56", flag: "🇨🇱"),
        Country(code: "CO", name: "Colombia", dial: "+57", flag: "🇨🇴"),
        Country(code: "CZ", name: "Czechia", dial: "+420", flag: "🇨🇿"),
        Country(code: "DK", name: "Denmark", dial: "+45", flag: "🇩🇰"),
        Country(code: "EG", name: "Egypt", dial: "+20", flag: "🇪🇬"),
        Country(code: "FI", name: "Finland", dial: "+358", flag: "🇫🇮"),
        Country(code: "FR", name: "France", dial: "+33", flag: "🇫🇷"),
        Country(code: "DE", name: "Germany", dial: "+49", flag: "🇩🇪"),
        Country(code: "GR", name: "Greece", dial: "+30", flag: "🇬🇷"),
        Country(code: "HK", name: "Hong Kong", dial: "+852", flag: "🇭🇰"),
        Country(code: "HU", name: "Hungary", dial: "+36", flag: "🇭🇺"),
        Country(code: "IE", name: "Ireland", dial: "+353", flag: "🇮🇪"),
        Country(code: "IL", name: "Israel", dial: "+972", flag: "🇮🇱"),
        Country(code: "IT", name: "Italy", dial: "+39", flag: "🇮🇹"),
        Country(code: "JP", name: "Japan", dial: "+81", flag: "🇯🇵"),
        Country(code: "MY", name: "Malaysia", dial: "+60", flag: "🇲🇾"),
        Country(code: "MX", name: "Mexico", dial: "+52", flag: "🇲🇽"),
        Country(code: "NL", name: "Netherlands", dial: "+31", flag: "🇳🇱"),
        Country(code: "NZ", name: "New Zealand", dial: "+64", flag: "🇳🇿"),
        Country(code: "NO", name: "Norway", dial: "+47", flag: "🇳🇴"),
        Country(code: "PE", name: "Peru", dial: "+51", flag: "🇵🇪"),
        Country(code: "PH", name: "Philippines", dial: "+63", flag: "🇵🇭"),
        Country(code: "PL", name: "Poland", dial: "+48", flag: "🇵🇱"),
        Country(code: "PT", name: "Portugal", dial: "+351", flag: "🇵🇹"),
        Country(code: "RO", name: "Romania", dial: "+40", flag: "🇷🇴"),
        Country(code: "SA", name: "Saudi Arabia", dial: "+966", flag: "🇸🇦"),
        Country(code: "SG", name: "Singapore", dial: "+65", flag: "🇸🇬"),
        Country(code: "ZA", name: "South Africa", dial: "+27", flag: "🇿🇦"),
        Country(code: "KR", name: "South Korea", dial: "+82", flag: "🇰🇷"),
        Country(code: "ES", name: "Spain", dial: "+34", flag: "🇪🇸"),
        Country(code: "SE", name: "Sweden", dial: "+46", flag: "🇸🇪"),
        Country(code: "CH", name: "Switzerland", dial: "+41", flag: "🇨🇭"),
        Country(code: "TW", name: "Taiwan", dial: "+886", flag: "🇹🇼"),
        Country(code: "TH", name: "Thailand", dial: "+66", flag: "🇹🇭"),
        Country(code: "TR", name: "Turkey", dial: "+90", flag: "🇹🇷"),
        Country(code: "AE", name: "United Arab Emirates", dial: "+971", flag: "🇦🇪"),
        Country(code: "GB", name: "United Kingdom", dial: "+44", flag: "🇬🇧"),
        Country(code: "VN", name: "Vietnam", dial: "+84", flag: "🇻🇳"),
    ]
}
