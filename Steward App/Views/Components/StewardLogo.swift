import SwiftUI

/// Reusable branded logo mark that matches the Steward app icon.
/// Renders the deep-green rounded rect with shield glow, elegant S, and sparkle.
struct StewardLogo: View {
    let size: CGFloat

    // Colors matching the icon SVG
    private let bgTop = Color(red: 0.141, green: 0.239, blue: 0.188)   // #243D30
    private let bgBottom = Color(red: 0.059, green: 0.125, blue: 0.094) // #0F2018
    private let mint = Color(red: 0.431, green: 0.906, blue: 0.718)     // #6EE7B7

    // Derived proportions
    private var cornerRadius: CGFloat { size * 0.22 }
    private var sWidth: CGFloat { size * 0.26 }
    private var sHeight: CGFloat { size * 0.44 }
    private var strokeWidth: CGFloat { max(1.5, size * 0.04) }
    private var sparkSize: CGFloat { size * 0.1 }
    private var sparkXOffset: CGFloat { size * 0.17 }
    private var sparkYOffset: CGFloat { size * -0.22 }

    var body: some View {
        ZStack {
            // Icon background gradient
            RoundedRectangle(cornerRadius: cornerRadius)
                .fill(
                    LinearGradient(
                        colors: [bgTop, bgBottom],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
                .frame(width: size, height: size)
                .overlay(
                    RoundedRectangle(cornerRadius: cornerRadius)
                        .stroke(mint.opacity(0.15), lineWidth: 0.5)
                )

            // Shield glow
            MiniShieldShape()
                .fill(
                    RadialGradient(
                        colors: [mint.opacity(0.14), bgBottom.opacity(0.05)],
                        center: .init(x: 0.5, y: 0.35),
                        startRadius: 0,
                        endRadius: size * 0.5
                    )
                )
                .frame(width: size, height: size)

            // Shield outline
            MiniShieldShape()
                .stroke(mint.opacity(0.2), lineWidth: max(0.5, size * 0.005))
                .frame(width: size * 0.92, height: size * 0.92)

            // Elegant "S" letterform
            SLetterMiniShape()
                .stroke(
                    LinearGradient(
                        colors: [.white, Color(red: 0.82, green: 0.98, blue: 0.90), mint],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    style: StrokeStyle(lineWidth: strokeWidth, lineCap: .round, lineJoin: .round)
                )
                .frame(width: sWidth, height: sHeight)

            // Sparkle accent
            SparkMiniShape()
                .fill(
                    RadialGradient(
                        colors: [.white, mint],
                        center: .center,
                        startRadius: 0,
                        endRadius: sparkSize * 0.5
                    )
                )
                .frame(width: sparkSize, height: sparkSize)
                .offset(x: sparkXOffset, y: sparkYOffset)
        }
        .frame(width: size, height: size)
    }
}

// MARK: - Mini Shield Shape (same as SplashScreen but reusable)

private struct MiniShieldShape: Shape {
    func path(in rect: CGRect) -> Path {
        let w = rect.width
        let h = rect.height
        let cx = w / 2
        return Path { p in
            p.move(to: CGPoint(x: cx, y: h * 0.2))
            p.addCurve(
                to: CGPoint(x: w * 0.7, y: h * 0.35),
                control1: CGPoint(x: cx + w * 0.12, y: h * 0.24),
                control2: CGPoint(x: w * 0.65, y: h * 0.28)
            )
            p.addCurve(
                to: CGPoint(x: w * 0.7, y: h * 0.5),
                control1: CGPoint(x: w * 0.73, y: h * 0.4),
                control2: CGPoint(x: w * 0.72, y: h * 0.45)
            )
            p.addCurve(
                to: CGPoint(x: cx, y: h * 0.72),
                control1: CGPoint(x: w * 0.68, y: h * 0.6),
                control2: CGPoint(x: w * 0.6, y: h * 0.67)
            )
            p.addCurve(
                to: CGPoint(x: w * 0.3, y: h * 0.5),
                control1: CGPoint(x: w * 0.4, y: h * 0.67),
                control2: CGPoint(x: w * 0.32, y: h * 0.6)
            )
            p.addCurve(
                to: CGPoint(x: w * 0.3, y: h * 0.35),
                control1: CGPoint(x: w * 0.28, y: h * 0.45),
                control2: CGPoint(x: w * 0.27, y: h * 0.4)
            )
            p.addCurve(
                to: CGPoint(x: cx, y: h * 0.2),
                control1: CGPoint(x: w * 0.35, y: h * 0.28),
                control2: CGPoint(x: cx - w * 0.12, y: h * 0.24)
            )
        }
    }
}

// MARK: - Mini S Letterform Shape

private struct SLetterMiniShape: Shape {
    func path(in rect: CGRect) -> Path {
        let w = rect.width
        let h = rect.height
        return Path { p in
            p.move(to: CGPoint(x: w * 0.88, y: h * 0.18))
            p.addCurve(
                to: CGPoint(x: w * 0.25, y: h * 0.09),
                control1: CGPoint(x: w * 0.82, y: h * 0.05),
                control2: CGPoint(x: w * 0.5, y: h * 0.0)
            )
            p.addCurve(
                to: CGPoint(x: w * 0.19, y: h * 0.38),
                control1: CGPoint(x: w * 0.06, y: h * 0.15),
                control2: CGPoint(x: w * 0.1, y: h * 0.28)
            )
            p.addCurve(
                to: CGPoint(x: w * 0.58, y: h * 0.47),
                control1: CGPoint(x: w * 0.27, y: h * 0.44),
                control2: CGPoint(x: w * 0.42, y: h * 0.44)
            )
            p.addCurve(
                to: CGPoint(x: w * 0.88, y: h * 0.63),
                control1: CGPoint(x: w * 0.75, y: h * 0.5),
                control2: CGPoint(x: w * 0.88, y: h * 0.55)
            )
            p.addCurve(
                to: CGPoint(x: w * 0.62, y: h * 0.84),
                control1: CGPoint(x: w * 0.88, y: h * 0.73),
                control2: CGPoint(x: w * 0.78, y: h * 0.82)
            )
            p.addCurve(
                to: CGPoint(x: w * 0.15, y: h * 0.82),
                control1: CGPoint(x: w * 0.46, y: h * 0.88),
                control2: CGPoint(x: w * 0.28, y: h * 0.87)
            )
        }
    }
}

// MARK: - Mini Spark Shape

private struct SparkMiniShape: Shape {
    func path(in rect: CGRect) -> Path {
        let cx = rect.midX
        let cy = rect.midY
        let r = min(rect.width, rect.height) / 2
        let inner = r * 0.25

        return Path { p in
            for i in 0..<4 {
                let angle = Double(i) * .pi / 2
                let outerX = cx + CGFloat(cos(angle - .pi / 2)) * r
                let outerY = cy + CGFloat(sin(angle - .pi / 2)) * r
                let innerAngle = angle + .pi / 4
                let innerX = cx + CGFloat(cos(innerAngle - .pi / 2)) * inner
                let innerY = cy + CGFloat(sin(innerAngle - .pi / 2)) * inner

                if i == 0 {
                    p.move(to: CGPoint(x: outerX, y: outerY))
                } else {
                    p.addLine(to: CGPoint(x: outerX, y: outerY))
                }
                p.addLine(to: CGPoint(x: innerX, y: innerY))
            }
            p.closeSubpath()
        }
    }
}
