import SwiftUI

/// Reusable branded logo mark that matches the Steward app icon (v8).
/// Renders the deep-green rounded rect with shield glow, elegant S, and sparkle.
struct StewardLogo: View {
    let size: CGFloat

    // Colors matching the icon SVG v8
    private let bgTop = Color(red: 0.141, green: 0.239, blue: 0.188)   // #243D30
    private let bgBottom = Color(red: 0.059, green: 0.125, blue: 0.094) // #0F2018
    private let mint = Color(red: 0.431, green: 0.906, blue: 0.718)     // #6EE7B7
    private let mintLight = Color(red: 0.820, green: 0.980, blue: 0.898) // #D1FAE5

    // Derived proportions (based on 1024×1024 canvas)
    private var cornerRadius: CGFloat { size * 0.22 }
    private var strokeWidth: CGFloat { max(1.5, size * 0.037) }
    private var shadowStrokeWidth: CGFloat { max(2.0, size * 0.043) }
    private var sparkSize: CGFloat { size * 0.11 }

    var body: some View {
        ZStack {
            // ── Background gradient ──
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
                        .stroke(mint.opacity(0.12), lineWidth: 0.5)
                )

            // ── Subtle texture rings ──
            Circle()
                .stroke(Color.white.opacity(0.04), lineWidth: 0.5)
                .frame(width: size * 0.82, height: size * 0.82)
            Circle()
                .stroke(Color.white.opacity(0.03), lineWidth: 0.5)
                .frame(width: size * 0.70, height: size * 0.70)

            // ── Shield glow fill ──
            ShieldShape()
                .fill(
                    RadialGradient(
                        colors: [mint.opacity(0.12), bgBottom.opacity(0.03)],
                        center: .init(x: 0.5, y: 0.35),
                        startRadius: 0,
                        endRadius: size * 0.5
                    )
                )
                .frame(width: size * 0.82, height: size * 0.82)

            // ── Shield outline ──
            ShieldShape()
                .stroke(mint.opacity(0.2), lineWidth: max(0.5, size * 0.005))
                .frame(width: size * 0.77, height: size * 0.77)

            // ── Inner shield highlight ──
            ShieldShape()
                .stroke(mint.opacity(0.08), lineWidth: max(0.5, size * 0.003))
                .frame(width: size * 0.68, height: size * 0.68)

            // ── "S" letterform (offset to match SVG translate(17,-5)) ──
            // Shadow layer
            SLetterShape()
                .stroke(
                    Color.white.opacity(0.12),
                    style: StrokeStyle(lineWidth: shadowStrokeWidth, lineCap: .round, lineJoin: .round)
                )
                .frame(width: size * 0.30, height: size * 0.40)
                .offset(x: size * 0.017, y: size * -0.005)

            // Main S stroke
            SLetterShape()
                .stroke(
                    LinearGradient(
                        colors: [.white, mintLight, mint],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    style: StrokeStyle(lineWidth: strokeWidth, lineCap: .round, lineJoin: .round)
                )
                .frame(width: size * 0.30, height: size * 0.40)
                .offset(x: size * 0.017, y: size * -0.005)

            // ── Sparkle accent ──
            // Outer glow
            Circle()
                .fill(mint.opacity(0.15))
                .frame(width: sparkSize * 0.8, height: sparkSize * 0.8)
                .offset(x: size * 0.105, y: size * -0.21)

            // Star shape
            SparkShape()
                .fill(
                    RadialGradient(
                        colors: [.white, mint],
                        center: .center,
                        startRadius: 0,
                        endRadius: sparkSize * 0.5
                    )
                )
                .frame(width: sparkSize, height: sparkSize)
                .offset(x: size * 0.105, y: size * -0.21)

            // ── Decorative rules beneath S ──
            RoundedRectangle(cornerRadius: size * 0.002)
                .fill(mint.opacity(0.25))
                .frame(width: size * 0.16, height: max(1, size * 0.0025))
                .offset(x: size * 0.017, y: size * 0.18)

            RoundedRectangle(cornerRadius: size * 0.001)
                .fill(mint.opacity(0.12))
                .frame(width: size * 0.086, height: max(0.5, size * 0.0015))
                .offset(x: size * 0.017, y: size * 0.195)
        }
        .frame(width: size, height: size)
    }
}

// MARK: - Shield Shape (matches SVG v8 shield path)

private struct ShieldShape: Shape {
    func path(in rect: CGRect) -> Path {
        let w = rect.width
        let h = rect.height
        let cx = w / 2

        return Path { p in
            // Top center
            p.move(to: CGPoint(x: cx, y: h * 0.205))

            // Top-right curve
            p.addCurve(
                to: CGPoint(x: w * 0.664, y: h * 0.303),
                control1: CGPoint(x: cx, y: h * 0.205),
                control2: CGPoint(x: w * 0.625, y: h * 0.252)
            )
            // Right side curve down
            p.addCurve(
                to: CGPoint(x: w * 0.703, y: h * 0.479),
                control1: CGPoint(x: w * 0.703, y: h * 0.354),
                control2: CGPoint(x: w * 0.703, y: h * 0.420)
            )
            // Right to bottom curve
            p.addCurve(
                to: CGPoint(x: cx, y: h * 0.713),
                control1: CGPoint(x: w * 0.703, y: h * 0.576),
                control2: CGPoint(x: w * 0.645, y: h * 0.654)
            )
            // Bottom to left curve
            p.addCurve(
                to: CGPoint(x: w * 0.297, y: h * 0.479),
                control1: CGPoint(x: w * 0.355, y: h * 0.654),
                control2: CGPoint(x: w * 0.297, y: h * 0.576)
            )
            // Left side curve up
            p.addCurve(
                to: CGPoint(x: w * 0.336, y: h * 0.303),
                control1: CGPoint(x: w * 0.297, y: h * 0.420),
                control2: CGPoint(x: w * 0.297, y: h * 0.354)
            )
            // Top-left curve back to top
            p.addCurve(
                to: CGPoint(x: cx, y: h * 0.205),
                control1: CGPoint(x: w * 0.375, y: h * 0.252),
                control2: CGPoint(x: cx, y: h * 0.205)
            )
        }
    }
}

// MARK: - S Letterform Shape (matches SVG v8 S path normalized)

private struct SLetterShape: Shape {
    func path(in rect: CGRect) -> Path {
        let w = rect.width
        let h = rect.height

        // SVG S path spans roughly x:406..582 (176px) and y:334..620 (286px)
        // Normalized to 0..1 within the bounding box
        return Path { p in
            // Start at top-right of S
            p.move(to: CGPoint(x: w * 0.966, y: h * 0.098))

            // Top curve (right to left)
            p.addCurve(
                to: CGPoint(x: w * 0.659, y: h * 0.0),
                control1: CGPoint(x: w * 0.852, y: h * 0.014),
                control2: CGPoint(x: w * 0.466, y: h * -0.014)
            )

            // Left shoulder curve
            p.addCurve(
                to: CGPoint(x: w * 0.193, y: h * 0.112),
                control1: CGPoint(x: w * 0.466, y: h * 0.028),
                control2: CGPoint(x: w * 0.273, y: h * 0.042)
            )

            // Down into mid-curve
            p.addCurve(
                to: CGPoint(x: w * 0.261, y: h * 0.364),
                control1: CGPoint(x: w * 0.114, y: h * 0.196),
                control2: CGPoint(x: w * 0.148, y: h * 0.301)
            )

            // Mid crossing
            p.addCurve(
                to: CGPoint(x: w * 0.705, y: h * 0.497),
                control1: CGPoint(x: w * 0.375, y: h * 0.427),
                control2: CGPoint(x: w * 0.557, y: h * 0.455)
            )

            // Down to lower belly
            p.addCurve(
                to: CGPoint(x: w * 1.0, y: h * 0.699),
                control1: CGPoint(x: w * 0.852, y: h * 0.538),
                control2: CGPoint(x: w * 0.989, y: h * 0.601)
            )

            // Lower right curve
            p.addCurve(
                to: CGPoint(x: w * 0.773, y: h * 0.944),
                control1: CGPoint(x: w * 1.011, y: h * 0.797),
                control2: CGPoint(x: w * 0.909, y: h * 0.895)
            )

            // Bottom tail (right to left)
            p.addCurve(
                to: CGPoint(x: w * 0.295, y: h * 0.972),
                control1: CGPoint(x: w * 0.636, y: h * 0.993),
                control2: CGPoint(x: w * 0.443, y: h * 1.0)
            )

            // End at bottom-left
            p.addCurve(
                to: CGPoint(x: w * 0.0, y: h * 0.832),
                control1: CGPoint(x: w * 0.148, y: h * 0.944),
                control2: CGPoint(x: w * 0.034, y: h * 0.888)
            )
        }
    }
}

// MARK: - 4-Point Spark Shape

private struct SparkShape: Shape {
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
