import SwiftUI

/// Reusable branded logo mark that matches the Steward app icon (v8).
/// All coordinates are taken directly from the 1024×1024 SVG source and
/// scaled proportionally to the requested `size`.
struct StewardLogo: View {
    let size: CGFloat

    // Colors matching the icon SVG v8
    private let bgTop     = Color(red: 0.141, green: 0.239, blue: 0.188) // #243D30
    private let bgBottom  = Color(red: 0.059, green: 0.125, blue: 0.094) // #0F2018
    private let mint      = Color(red: 0.431, green: 0.906, blue: 0.718) // #6EE7B7
    private let mintLight = Color(red: 0.820, green: 0.980, blue: 0.898) // #D1FAE5
    private let darkGreen = Color(red: 0.165, green: 0.361, blue: 0.271) // #2A5C45

    /// Maps an SVG coordinate (0…1024) into the current view size.
    private var sc: CGFloat { size / 1024 }

    var body: some View {
        ZStack {
            // ── 1. Background rounded rect ───────────────────────────
            RoundedRectangle(cornerRadius: 224 * sc)
                .fill(
                    LinearGradient(
                        colors: [bgTop, bgBottom],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 224 * sc)
                        .stroke(mint.opacity(0.12), lineWidth: max(0.5, sc))
                )

            // ── 2. Subtle texture rings ──────────────────────────────
            // SVG: <circle r="420"> → diameter 840
            Circle()
                .stroke(Color.white.opacity(0.04), lineWidth: max(0.5, sc))
                .frame(width: 840 * sc, height: 840 * sc)

            // SVG: <circle r="360"> → diameter 720
            Circle()
                .stroke(Color.white.opacity(0.03), lineWidth: max(0.5, sc))
                .frame(width: 720 * sc, height: 720 * sc)

            // ── 3. Shield glow fill (outermost shield) ───────────────
            ShieldGlowShape()
                .fill(
                    RadialGradient(
                        colors: [mint, darkGreen],
                        center: UnitPoint(x: 0.5, y: 0.383),
                        startRadius: 0,
                        endRadius: size * 0.28
                    )
                )
                .opacity(0.15)

            // ── 4. Shield outline (middle shield) ────────────────────
            ShieldOutlineShape()
                .stroke(mint.opacity(0.2), lineWidth: max(0.75, 1.5 * sc))

            // ── 5. Inner shield highlight (smallest shield) ──────────
            InnerShieldShape()
                .stroke(mint.opacity(0.08), lineWidth: max(0.5, sc))

            // ── 6. S letterform shadow ───────────────────────────────
            SLetterShape()
                .stroke(
                    Color.white.opacity(0.12),
                    style: StrokeStyle(
                        lineWidth: 44 * sc,
                        lineCap: .round,
                        lineJoin: .round
                    )
                )

            // ── 7. S letterform — gradient stroke ────────────────────
            SLetterShape()
                .stroke(
                    LinearGradient(
                        colors: [.white, mintLight, mint],
                        startPoint: UnitPoint(x: 423.0 / 1024, y: 329.0 / 1024),
                        endPoint:   UnitPoint(x: 599.0 / 1024, y: 615.0 / 1024)
                    ),
                    style: StrokeStyle(
                        lineWidth: 38 * sc,
                        lineCap: .round,
                        lineJoin: .round
                    )
                )

            // ── 8. Sparkle accent ────────────────────────────────────
            // SVG: translate(590,318) inside translate(17,-5) → (607,313)
            // Offset from center (512,512): (95, -199)

            // Outer glow — SVG: <circle r="22">
            Circle()
                .fill(mint.opacity(0.15))
                .frame(width: 44 * sc, height: 44 * sc)
                .offset(x: 95 * sc, y: -199 * sc)

            // 4-point star — SVG: r=14
            SparkShape()
                .fill(
                    RadialGradient(
                        colors: [.white, mint],
                        center: .center,
                        startRadius: 0,
                        endRadius: 14 * sc
                    )
                )
                .frame(width: 28 * sc, height: 28 * sc)
                .offset(x: 95 * sc, y: -199 * sc)

            // ── 9. Decorative horizontal rules ───────────────────────
            // SVG: <rect x="430" y="688" w="164" h="2.5"> inside translate(17,-5)
            // Center → (529, 684.25); offset from 512 → (17, 172.25)
            RoundedRectangle(cornerRadius: 1.25 * sc)
                .fill(mint.opacity(0.25))
                .frame(width: 164 * sc, height: max(1, 2.5 * sc))
                .offset(x: 17 * sc, y: 172.25 * sc)

            // SVG: <rect x="468" y="700" w="88" h="1.5"> inside translate(17,-5)
            // Center → (529, 695.75); offset from 512 → (17, 183.75)
            RoundedRectangle(cornerRadius: 0.75 * sc)
                .fill(mint.opacity(0.12))
                .frame(width: 88 * sc, height: max(0.5, 1.5 * sc))
                .offset(x: 17 * sc, y: 183.75 * sc)
        }
        .frame(width: size, height: size)
    }
}

// MARK: - Shape helpers
// All shapes draw in a size×size rect, mapping SVG coords via rect.width/1024.

/// Shield glow fill — outermost shield path (SVG coords 304–720 × 210–730).
private struct ShieldGlowShape: Shape {
    func path(in rect: CGRect) -> Path {
        let s = rect.width / 1024
        var path = Path()
        path.move(to:    CGPoint(x: 512*s, y: 210*s))
        path.addCurve(to: CGPoint(x: 680*s, y: 310*s),
                      control1: CGPoint(x: 512*s, y: 210*s),
                      control2: CGPoint(x: 640*s, y: 258*s))
        path.addCurve(to: CGPoint(x: 720*s, y: 490*s),
                      control1: CGPoint(x: 720*s, y: 362*s),
                      control2: CGPoint(x: 720*s, y: 430*s))
        path.addCurve(to: CGPoint(x: 512*s, y: 730*s),
                      control1: CGPoint(x: 720*s, y: 590*s),
                      control2: CGPoint(x: 660*s, y: 670*s))
        path.addCurve(to: CGPoint(x: 304*s, y: 490*s),
                      control1: CGPoint(x: 364*s, y: 670*s),
                      control2: CGPoint(x: 304*s, y: 590*s))
        path.addCurve(to: CGPoint(x: 344*s, y: 310*s),
                      control1: CGPoint(x: 304*s, y: 430*s),
                      control2: CGPoint(x: 304*s, y: 362*s))
        path.addCurve(to: CGPoint(x: 512*s, y: 210*s),
                      control1: CGPoint(x: 384*s, y: 258*s),
                      control2: CGPoint(x: 512*s, y: 210*s))
        path.closeSubpath()
        return path
    }
}

/// Shield outline — middle shield path (SVG coords 316–708 × 228–714).
private struct ShieldOutlineShape: Shape {
    func path(in rect: CGRect) -> Path {
        let s = rect.width / 1024
        var path = Path()
        path.move(to:    CGPoint(x: 512*s, y: 228*s))
        path.addCurve(to: CGPoint(x: 670*s, y: 320*s),
                      control1: CGPoint(x: 512*s, y: 228*s),
                      control2: CGPoint(x: 632*s, y: 272*s))
        path.addCurve(to: CGPoint(x: 708*s, y: 488*s),
                      control1: CGPoint(x: 708*s, y: 368*s),
                      control2: CGPoint(x: 708*s, y: 432*s))
        path.addCurve(to: CGPoint(x: 512*s, y: 714*s),
                      control1: CGPoint(x: 708*s, y: 582*s),
                      control2: CGPoint(x: 652*s, y: 658*s))
        path.addCurve(to: CGPoint(x: 316*s, y: 488*s),
                      control1: CGPoint(x: 372*s, y: 658*s),
                      control2: CGPoint(x: 316*s, y: 582*s))
        path.addCurve(to: CGPoint(x: 354*s, y: 320*s),
                      control1: CGPoint(x: 316*s, y: 432*s),
                      control2: CGPoint(x: 316*s, y: 368*s))
        path.addCurve(to: CGPoint(x: 512*s, y: 228*s),
                      control1: CGPoint(x: 392*s, y: 272*s),
                      control2: CGPoint(x: 512*s, y: 228*s))
        path.closeSubpath()
        return path
    }
}

/// Inner shield highlight — smallest shield path (SVG coords 340–684 × 252–686).
private struct InnerShieldShape: Shape {
    func path(in rect: CGRect) -> Path {
        let s = rect.width / 1024
        var path = Path()
        path.move(to:    CGPoint(x: 512*s, y: 252*s))
        path.addCurve(to: CGPoint(x: 650*s, y: 332*s),
                      control1: CGPoint(x: 512*s, y: 252*s),
                      control2: CGPoint(x: 616*s, y: 290*s))
        path.addCurve(to: CGPoint(x: 684*s, y: 482*s),
                      control1: CGPoint(x: 684*s, y: 374*s),
                      control2: CGPoint(x: 684*s, y: 430*s))
        path.addCurve(to: CGPoint(x: 512*s, y: 686*s),
                      control1: CGPoint(x: 684*s, y: 566*s),
                      control2: CGPoint(x: 634*s, y: 634*s))
        path.addCurve(to: CGPoint(x: 340*s, y: 482*s),
                      control1: CGPoint(x: 390*s, y: 634*s),
                      control2: CGPoint(x: 340*s, y: 566*s))
        path.addCurve(to: CGPoint(x: 374*s, y: 332*s),
                      control1: CGPoint(x: 340*s, y: 430*s),
                      control2: CGPoint(x: 340*s, y: 374*s))
        path.addCurve(to: CGPoint(x: 512*s, y: 252*s),
                      control1: CGPoint(x: 408*s, y: 290*s),
                      control2: CGPoint(x: 512*s, y: 252*s))
        path.closeSubpath()
        return path
    }
}

/// S letterform with SVG translate(17, -5) pre-applied to all coordinates.
private struct SLetterShape: Shape {
    func path(in rect: CGRect) -> Path {
        let s = rect.width / 1024
        var path = Path()
        // Original SVG coords + translate(17, -5)
        path.move(to:    CGPoint(x: 593*s, y: 357*s))
        path.addCurve(to: CGPoint(x: 539*s, y: 329*s),
                      control1: CGPoint(x: 593*s, y: 357*s),
                      control2: CGPoint(x: 573*s, y: 333*s))
        path.addCurve(to: CGPoint(x: 457*s, y: 361*s),
                      control1: CGPoint(x: 505*s, y: 325*s),
                      control2: CGPoint(x: 471*s, y: 337*s))
        path.addCurve(to: CGPoint(x: 469*s, y: 433*s),
                      control1: CGPoint(x: 443*s, y: 385*s),
                      control2: CGPoint(x: 449*s, y: 415*s))
        path.addCurve(to: CGPoint(x: 547*s, y: 471*s),
                      control1: CGPoint(x: 489*s, y: 451*s),
                      control2: CGPoint(x: 521*s, y: 459*s))
        path.addCurve(to: CGPoint(x: 599*s, y: 529*s),
                      control1: CGPoint(x: 573*s, y: 483*s),
                      control2: CGPoint(x: 597*s, y: 501*s))
        path.addCurve(to: CGPoint(x: 559*s, y: 599*s),
                      control1: CGPoint(x: 601*s, y: 557*s),
                      control2: CGPoint(x: 583*s, y: 585*s))
        path.addCurve(to: CGPoint(x: 475*s, y: 607*s),
                      control1: CGPoint(x: 535*s, y: 613*s),
                      control2: CGPoint(x: 501*s, y: 615*s))
        path.addCurve(to: CGPoint(x: 423*s, y: 567*s),
                      control1: CGPoint(x: 449*s, y: 599*s),
                      control2: CGPoint(x: 429*s, y: 583*s))
        return path
    }
}

/// 4-point star / spark shape.
private struct SparkShape: Shape {
    func path(in rect: CGRect) -> Path {
        let cx = rect.midX
        let cy = rect.midY
        let r = min(rect.width, rect.height) / 2
        let inner = r * 0.25

        var path = Path()
        for i in 0..<4 {
            let angle = Double(i) * .pi / 2
            let outerX = cx + CGFloat(cos(angle - .pi / 2)) * r
            let outerY = cy + CGFloat(sin(angle - .pi / 2)) * r
            let innerAngle = angle + .pi / 4
            let innerX = cx + CGFloat(cos(innerAngle - .pi / 2)) * inner
            let innerY = cy + CGFloat(sin(innerAngle - .pi / 2)) * inner

            if i == 0 {
                path.move(to: CGPoint(x: outerX, y: outerY))
            } else {
                path.addLine(to: CGPoint(x: outerX, y: outerY))
            }
            path.addLine(to: CGPoint(x: innerX, y: innerY))
        }
        path.closeSubpath()
        return path
    }
}
