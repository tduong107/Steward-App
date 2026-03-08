import SwiftUI

struct SplashScreen: View {
    @State private var iconScale: CGFloat = 0.7
    @State private var iconOpacity: Double = 0
    @State private var textOpacity: Double = 0
    @State private var taglineOpacity: Double = 0

    // Colors matching the icon SVG v8
    private let bgTop = Color(red: 0.141, green: 0.239, blue: 0.188)   // #243D30
    private let bgBottom = Color(red: 0.059, green: 0.125, blue: 0.094) // #0F2018
    private let mint = Color(red: 0.431, green: 0.906, blue: 0.718)     // #6EE7B7

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
                // Icon — uses the shared StewardLogo component
                ZStack {
                    // Shadow / glow
                    RoundedRectangle(cornerRadius: 44)
                        .fill(Color.black.opacity(0.3))
                        .frame(width: 200, height: 200)
                        .blur(radius: 24)
                        .offset(y: 12)

                    StewardLogo(size: 200)
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
        }
    }
}
