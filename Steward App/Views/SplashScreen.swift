import SwiftUI

struct SplashScreen: View {
    @State private var iconScale: CGFloat = 0.45
    @State private var iconOpacity: Double = 0
    @State private var wordmarkOpacity: Double = 0

    // Ring pulse animation states
    @State private var ring1Opacity: Double = 0
    @State private var ring1Scale: CGFloat = 0.88
    @State private var ring2Opacity: Double = 0
    @State private var ring2Scale: CGFloat = 0.88
    @State private var ring3Opacity: Double = 0
    @State private var ring3Scale: CGFloat = 0.88

    // Brand Guide colors
    private let deepForest = Color(hex: "0F2018")
    private let bgTop      = Color(hex: "243D30")
    private let mint        = Color(hex: "6EE7B7")

    var body: some View {
        ZStack {
            // Background gradient — Deep Forest
            LinearGradient(
                colors: [bgTop, deepForest],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            // ── Pulsing rings (matching launch animation) ──────────
            RoundedRectangle(cornerRadius: 66)
                .stroke(mint.opacity(0.10), lineWidth: 1)
                .frame(width: 296, height: 296)
                .scaleEffect(ring1Scale)
                .opacity(ring1Opacity)

            RoundedRectangle(cornerRadius: 60)
                .stroke(mint.opacity(0.10), lineWidth: 1)
                .frame(width: 332, height: 332)
                .scaleEffect(ring2Scale)
                .opacity(ring2Opacity)

            RoundedRectangle(cornerRadius: 54)
                .stroke(mint.opacity(0.10), lineWidth: 1)
                .frame(width: 368, height: 368)
                .scaleEffect(ring3Scale)
                .opacity(ring3Opacity)

            VStack(spacing: 28) {
                // Icon — pops in with spring bounce
                ZStack {
                    // Drop shadow / glow
                    RoundedRectangle(cornerRadius: 44)
                        .fill(Color(hex: "2A5C45").opacity(0.8))
                        .frame(width: 260, height: 260)
                        .blur(radius: 44)

                    RoundedRectangle(cornerRadius: 44)
                        .fill(mint.opacity(0.22))
                        .frame(width: 260, height: 260)
                        .blur(radius: 12)

                    StewardLogo(size: 260)
                }
                .scaleEffect(iconScale)
                .opacity(iconOpacity)

                // Wordmark — fades in after icon settles
                VStack(spacing: 5) {
                    Text("STEWARD")
                        .font(.custom("Georgia-Bold", size: 20))
                        .tracking(7)
                        .foregroundStyle(.white)

                    Text("YOUR AI CONCIERGE")
                        .font(.system(size: 9.5, weight: .regular))
                        .tracking(4)
                        .foregroundStyle(mint.opacity(0.75))
                        .textCase(.uppercase)
                }
                .opacity(wordmarkOpacity)
            }
            .offset(y: -10)
        }
        .onAppear {
            // Icon pop — cubic-bezier(0.34, 1.56, 0.64, 1) ≈ spring with bounce
            withAnimation(.spring(response: 0.85, dampingFraction: 0.55).delay(0.2)) {
                iconScale = 1.0
                iconOpacity = 1.0
            }

            // Wordmark fade — 0.6s ease at t=2.1s
            withAnimation(.easeOut(duration: 0.6).delay(2.1)) {
                wordmarkOpacity = 1.0
            }

            // Ring pulses — staggered, repeating
            startRingPulse()
        }
    }

    private func startRingPulse() {
        // Ring 1: starts immediately
        withAnimation(.easeOut(duration: 3.6).repeatForever(autoreverses: false)) {
            ring1Opacity = 0.75
            ring1Scale = 1.08
        }
        // Ring 2: starts at 1.0s delay
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            withAnimation(.easeOut(duration: 3.6).repeatForever(autoreverses: false)) {
                ring2Opacity = 0.75
                ring2Scale = 1.08
            }
        }
        // Ring 3: starts at 2.0s delay
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
            withAnimation(.easeOut(duration: 3.6).repeatForever(autoreverses: false)) {
                ring3Opacity = 0.75
                ring3Scale = 1.08
            }
        }
    }
}
