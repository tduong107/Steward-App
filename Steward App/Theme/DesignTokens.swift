import SwiftUI

enum Theme {
    // MARK: - Colors
    static let bg          = Color(hex: "F7F6F3")
    static let bgCard      = Color.white
    static let bgDeep      = Color(hex: "EFEDE8")
    static let border      = Color(hex: "E8E5DF")
    static let borderMid   = Color(hex: "D8D4CC")
    static let ink         = Color(hex: "1A1814")
    static let inkMid      = Color(hex: "6B6760")
    static let inkLight    = Color(hex: "A09D98")
    static let accent      = Color(hex: "2A5C45")
    static let accentLight = Color(hex: "EAF2ED")
    static let accentMid   = Color(hex: "C4DDD0")
    static let gold        = Color(hex: "B07D3A")
    static let goldLight   = Color(hex: "FBF4E8")
    static let red         = Color(hex: "C0392B")
    static let redLight    = Color(hex: "FDECEA")
    static let blue        = Color(hex: "1E4A8A")
    static let blueLight   = Color(hex: "EAF0FA")

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
