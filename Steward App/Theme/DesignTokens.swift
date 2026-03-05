import SwiftUI

enum Theme {
    private static var isDark: Bool {
        UserDefaults.standard.bool(forKey: "isDarkMode")
    }

    // MARK: - Adaptive Colors
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
    static var gold: Color        { isDark ? Color(hex: "C08D4A") : Color(hex: "B07D3A") }
    static var goldLight: Color   { isDark ? Color(hex: "2A2418") : Color(hex: "FBF4E8") }
    static var red: Color         { isDark ? Color(hex: "D04939") : Color(hex: "C0392B") }
    static var redLight: Color    { isDark ? Color(hex: "2A1814") : Color(hex: "FDECEA") }
    static var blue: Color        { isDark ? Color(hex: "3A6AAA") : Color(hex: "1E4A8A") }
    static var blueLight: Color   { isDark ? Color(hex: "141E2A") : Color(hex: "EAF0FA") }

    // MARK: - Fonts
    static func serif(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        .system(size: size, weight: weight, design: .serif)
    }

    static func body(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        .system(size: size, weight: weight)
    }

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
