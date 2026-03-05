import SwiftUI

struct SplashScreen: View {
    @State private var iconScale: CGFloat = 0.7
    @State private var iconOpacity: Double = 0
    @State private var textOpacity: Double = 0
    @State private var taglineOpacity: Double = 0
    @State private var sparkRotation: Double = 0

    // Colors matching the icon SVG
    private let bgTop = Color(red: 0.141, green: 0.239, blue: 0.188)   // #243D30
    private let bgBottom = Color(red: 0.059, green: 0.125, blue: 0.094) // #0F2018
    private let mint = Color(red: 0.431, green: 0.906, blue: 0.718)     // #6EE7B7
    private let accentGreen = Color(red: 0.165, green: 0.361, blue: 0.271) // #2A5C45

    var body: some View {
        ZStack {
            // Background gradient matching the icon
            LinearGradient(
                colors: [bgTop, bgBottom],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            // Concentric rings (subtle)
            Circle()
                .stroke(mint.opacity(0.04), lineWidth: 1)
                .frame(width: 376, height: 376)

            Circle()
                .stroke(mint.opacity(0.05), lineWidth: 1)
                .frame(width: 296, height: 296)

            Circle()
                .stroke(mint.opacity(0.035), lineWidth: 0.75)
                .frame(width: 220, height: 220)

            VStack(spacing: 24) {
                // Icon
                ZStack {
                    // Shadow / glow
                    RoundedRectangle(cornerRadius: 44)
                        .fill(Color.black.opacity(0.3))
                        .frame(width: 200, height: 200)
                        .blur(radius: 24)
                        .offset(y: 12)

                    // Icon background
                    RoundedRectangle(cornerRadius: 44)
                        .fill(
                            LinearGradient(
                                colors: [bgTop, bgBottom],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        )
                        .frame(width: 200, height: 200)
                        .overlay(
                            RoundedRectangle(cornerRadius: 44)
                                .stroke(mint.opacity(0.1), lineWidth: 1)
                        )

                    // Shield glow
                    shieldShape
                        .fill(
                            RadialGradient(
                                colors: [mint.opacity(0.12), accentGreen.opacity(0.05)],
                                center: .init(x: 0.5, y: 0.35),
                                startRadius: 0,
                                endRadius: 100
                            )
                        )
                        .frame(width: 200, height: 200)

                    // Shield outline
                    shieldShape
                        .stroke(mint.opacity(0.2), lineWidth: 1)
                        .frame(width: 190, height: 190)

                    // Elegant "S" letterform
                    SLetterShape()
                        .stroke(
                            LinearGradient(
                                colors: [.white, Color(red: 0.82, green: 0.98, blue: 0.90), mint],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            style: StrokeStyle(lineWidth: 8.5, lineCap: .round, lineJoin: .round)
                        )
                        .frame(width: 52, height: 88)

                    // Sparkle at top right
                    SparkShape()
                        .fill(
                            RadialGradient(
                                colors: [.white, mint],
                                center: .center,
                                startRadius: 0,
                                endRadius: 6
                            )
                        )
                        .frame(width: 12, height: 12)
                        .background(
                            Circle()
                                .fill(mint.opacity(0.18))
                                .frame(width: 16, height: 16)
                        )
                        .offset(x: 28, y: -36)
                        .rotationEffect(.degrees(sparkRotation))

                    // Underline rules beneath the S
                    VStack(spacing: 3) {
                        RoundedRectangle(cornerRadius: 0.5)
                            .fill(mint.opacity(0.25))
                            .frame(width: 32, height: 1)

                        RoundedRectangle(cornerRadius: 0.375)
                            .fill(mint.opacity(0.12))
                            .frame(width: 18, height: 0.75)
                    }
                    .offset(y: 52)
                }
                .scaleEffect(iconScale)
                .opacity(iconOpacity)

                // Wordmark
                VStack(spacing: 16) {
                    Text("STEWARD")
                        .font(.system(size: 30, weight: .regular, design: .serif))
                        .tracking(11)
                        .foregroundStyle(.white.opacity(0.95))
                        .opacity(textOpacity)

                    // Divider with center dot
                    HStack(spacing: 0) {
                        Rectangle()
                            .fill(
                                LinearGradient(
                                    colors: [mint.opacity(0), mint.opacity(0.45)],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .frame(width: 80, height: 0.75)

                        Circle()
                            .fill(mint.opacity(0.6))
                            .frame(width: 5, height: 5)
                            .padding(.horizontal, 8)

                        Rectangle()
                            .fill(
                                LinearGradient(
                                    colors: [mint.opacity(0.45), mint.opacity(0)],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .frame(width: 80, height: 0.75)
                    }
                    .opacity(taglineOpacity)

                    Text("YOUR PERSONAL AI CONCIERGE")
                        .font(.system(size: 10.5, weight: .regular, design: .serif))
                        .tracking(3.5)
                        .foregroundStyle(mint.opacity(0.48))
                        .opacity(taglineOpacity)
                }
            }
            .offset(y: -20)
        }
        .onAppear {
            withAnimation(.easeOut(duration: 0.6)) {
                iconScale = 1.0
                iconOpacity = 1.0
            }
            withAnimation(.easeOut(duration: 0.5).delay(0.3)) {
                textOpacity = 1.0
            }
            withAnimation(.easeOut(duration: 0.5).delay(0.5)) {
                taglineOpacity = 1.0
            }
            withAnimation(.linear(duration: 8).repeatForever(autoreverses: false)) {
                sparkRotation = 360
            }
        }
    }

    // Shield shape path
    private var shieldShape: some Shape {
        ShieldShape()
    }
}

// MARK: - Shield Shape
private struct ShieldShape: Shape {
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

// MARK: - S Letterform Shape
private struct SLetterShape: Shape {
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

// MARK: - Spark / Star Shape
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
