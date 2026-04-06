import SwiftUI

enum Theme {
    private static var isDark: Bool {
        UserDefaults.standard.bool(forKey: "isDarkMode")
    }

    // MARK: - Adaptive Colors (Brand Guide 2025)
    // Deep Forest #0F2018 — Backgrounds & dark surfaces
    // Steward Green #2A5C45 — Primary brand colour
    // Mint Spark #6EE7B7 — Highlights & AI moments
    // Savings Gold #F59E0B — Deals, cashback & savings
    // Warm Cream #F7F6F3 — Light backgrounds

    static var bg: Color          { isDark ? Color(hex: "141412") : Color(hex: "F7F6F3") }
    static var bgCard: Color      { isDark ? Color(hex: "1E1E1C") : Color.white }
    static var bgDeep: Color      { isDark ? Color(hex: "0F0F0E") : Color(hex: "EFEDE8") }
    static var border: Color      { isDark ? Color(hex: "2C2C28") : Color(hex: "E8E5DF") }
    static var borderMid: Color   { isDark ? Color(hex: "3C3C38") : Color(hex: "D8D4CC") }
    static var ink: Color         { isDark ? Color(hex: "EDEDEA") : Color(hex: "1A1814") }
    static var inkMid: Color      { isDark ? Color(hex: "9C9A95") : Color(hex: "6B6760") }
    static var inkLight: Color    { isDark ? Color(hex: "68665F") : Color(hex: "A09D98") }
    static var accent: Color      { isDark ? Color(hex: "3A7C5A") : Color(hex: "2A5C45") }
    static var accentLight: Color { isDark ? Color(hex: "1A2E22") : Color(hex: "EAF2ED") }
    static var accentMid: Color   { isDark ? Color(hex: "2A4A38") : Color(hex: "C4DDD0") }
    static var gold: Color        { isDark ? Color(hex: "F5AE2B") : Color(hex: "F59E0B") }
    static var goldLight: Color   { isDark ? Color(hex: "2A2418") : Color(hex: "FEF3C7") }
    static var green: Color       { isDark ? Color(hex: "3AAA6A") : Color(hex: "27AE60") }
    static var greenLight: Color  { isDark ? Color(hex: "142A1A") : Color(hex: "EAFAEF") }
    static var red: Color         { isDark ? Color(hex: "D04939") : Color(hex: "C0392B") }
    static var redLight: Color    { isDark ? Color(hex: "2A1814") : Color(hex: "FDECEA") }
    static var blue: Color        { isDark ? Color(hex: "3A6AAA") : Color(hex: "1E4A8A") }
    static var blueLight: Color   { isDark ? Color(hex: "141E2A") : Color(hex: "EAF0FA") }

    // Brand-specific named colors
    static let mintSpark  = Color(hex: "6EE7B7")
    static let deepForest = Color(hex: "0F2018")

    // MARK: - Typography (Brand Guide: Georgia display, system body)

    /// Georgia — Display / Headlines
    /// Elegant, editorial, rooted in tradition. Used for titles, hero text, key callouts.
    static func serif(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        switch weight {
        case .bold, .heavy, .black, .semibold:
            return Font.custom("Georgia-Bold", size: size)
        case .light, .ultraLight, .thin:
            return Font.custom("Georgia", size: size)
        default:
            return Font.custom("Georgia", size: size)
        }
    }

    /// System font — Body / UI Text
    /// Clean and highly legible at small sizes. Carries brand communications at every scale.
    static func body(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        .system(size: size, weight: weight)
    }

    // MARK: - Type Scale (Brand Guide)
    // H1: 36pt Bold  |  H2: 24pt Bold  |  H3: 16pt Bold
    // Body: 13pt Regular  |  Caption: 10pt

    // MARK: - Corner Radii
    static let radiusSm: CGFloat = 8
    static let radiusMd: CGFloat = 13
    static let radiusLg: CGFloat = 18
    static let radiusXL: CGFloat = 28
}

// MARK: - Hex Color Extension
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r, g, b: Double
        switch hex.count {
        case 6:
            r = Double((int >> 16) & 0xFF) / 255
            g = Double((int >> 8) & 0xFF) / 255
            b = Double(int & 0xFF) / 255
        default:
            r = 1; g = 1; b = 1
        }
        self.init(red: r, green: g, blue: b)
    }
}

extension Theme {
    /// Formats a price as a currency string using the user's selected currency
    /// Maps a color name string (from DealRating.colorName) to a Theme color
    static func colorFor(_ name: String) -> Color {
        switch name {
        case "accent": return accent
        case "green": return green
        case "gold": return gold
        case "orange": return gold
        case "red": return red
        case "blue": return blue
        default: return inkMid
        }
    }

    static func formatPrice(_ price: Double) -> String {
        let code = UserDefaults.standard.string(forKey: "currencyCode") ?? "USD"
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = code
        formatter.maximumFractionDigits = price.truncatingRemainder(dividingBy: 1) == 0 ? 0 : 2
        return formatter.string(from: NSNumber(value: price)) ?? "$\(String(format: "%.2f", price))"
    }
}
