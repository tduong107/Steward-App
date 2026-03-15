import SwiftUI

struct TutorialCongratsOverlay: View {
    let step: TutorialStep
    let isFinalStep: Bool
    let onDismiss: () -> Void

    @State private var showCard = false
    @State private var showEmoji = false

    private var emoji: String {
        switch step {
        case .firstWatch: return "🎉"
        case .notifications: return "🔔"
        case .allComplete: return "🎊"
        }
    }

    private var title: String {
        switch step {
        case .firstWatch: return "First watch created!"
        case .notifications: return "Notifications enabled!"
        case .allComplete: return "You're all set!"
        }
    }

    private var subtitle: String {
        switch step {
        case .firstWatch: return "Steward is now watching the web for you.\nYou'll be notified when something changes."
        case .notifications: return "You'll never miss a price drop\nor restock again."
        case .allComplete: return "Setup complete! Steward is ready to\nwatch the web and keep you updated."
        }
    }

    private var buttonLabel: String {
        step == .allComplete ? "Let's go! 🚀" : "Awesome!"
    }

    private var confettiCount: Int {
        step == .allComplete ? 140 : 80
    }

    var body: some View {
        ZStack {
            // Dimmed background
            Color.black.opacity(0.6)
                .ignoresSafeArea()
                .onTapGesture { dismiss() }

            // Confetti layer
            confettiLayer
                .ignoresSafeArea()
                .allowsHitTesting(false)

            // Center card
            VStack(spacing: 20) {
                // Emoji
                Text(emoji)
                    .font(.system(size: 56))
                    .scaleEffect(showEmoji ? 1 : 0.3)
                    .animation(.spring(response: 0.5, dampingFraction: 0.6), value: showEmoji)

                // Title
                Text(title)
                    .font(Theme.serif(22, weight: .bold))
                    .foregroundStyle(.white)
                    .opacity(showCard ? 1 : 0)
                    .offset(y: showCard ? 0 : 20)

                // Subtitle
                Text(subtitle)
                    .font(Theme.body(14))
                    .foregroundStyle(.white.opacity(0.7))
                    .multilineTextAlignment(.center)
                    .lineSpacing(3)
                    .opacity(showCard ? 1 : 0)

                // Steward branding
                HStack(spacing: 4) {
                    StewardLogo(size: 14)
                    Text("Steward")
                        .font(Theme.body(10, weight: .medium))
                        .foregroundStyle(.white.opacity(0.5))
                }
                .opacity(showCard ? 1 : 0)

                // Dismiss button
                Button(action: dismiss) {
                    Text(buttonLabel)
                        .font(Theme.body(15, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Theme.accent)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                        .shadow(color: Theme.accent.opacity(0.3), radius: 12, y: 4)
                }
                .padding(.horizontal, 24)
                .opacity(showCard ? 1 : 0)
            }
            .padding(32)
            .frame(maxWidth: 320)
        }
        .onAppear {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.7)) {
                showCard = true
                showEmoji = true
            }
        }
    }

    private func dismiss() {
        withAnimation(.easeOut(duration: 0.2)) {
            showCard = false
            showEmoji = false
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) {
            onDismiss()
        }
    }

    // MARK: - Confetti

    private var confettiLayer: some View {
        TimelineView(.animation) { timeline in
            Canvas { context, size in
                let elapsed = timeline.date.timeIntervalSinceReferenceDate
                let particles = generateParticles(count: confettiCount, canvasSize: size, time: elapsed)

                for particle in particles {
                    let rect = CGRect(
                        x: particle.x - particle.size / 2,
                        y: particle.y - particle.size / 2,
                        width: particle.size,
                        height: particle.size * 0.6
                    )

                    context.fill(
                        Path(roundedRect: rect, cornerRadius: 1),
                        with: .color(particle.color.opacity(particle.opacity))
                    )
                }
            }
        }
    }

    private func generateParticles(count: Int, canvasSize: CGSize, time: Double) -> [TutorialConfettiParticle] {
        var particles: [TutorialConfettiParticle] = []
        let colors: [Color] = [
            Theme.accent, .yellow, .blue, .green, .orange, .purple, .pink, .cyan
        ]

        for i in 0..<count {
            let seed = Double(i)
            let phase = seed * 0.7
            let speed = 30 + (seed.truncatingRemainder(dividingBy: 7)) * 15
            let drift = sin(time * 2 + phase) * 20

            let x = (seed * 17).truncatingRemainder(dividingBy: canvasSize.width) + drift
            let rawY = ((time * speed + phase * 50).truncatingRemainder(dividingBy: (canvasSize.height + 100))) - 50
            let y = rawY < 0 ? rawY + canvasSize.height + 100 : rawY

            let colorIndex = Int(seed) % colors.count
            let size = 4 + (seed.truncatingRemainder(dividingBy: 5)) * 1.5

            let fadeStart = canvasSize.height * 0.7
            let opacity = y > fadeStart ? max(0, 1 - (y - fadeStart) / (canvasSize.height * 0.3)) : 1.0

            particles.append(TutorialConfettiParticle(
                x: x, y: y, size: size, color: colors[colorIndex], opacity: opacity
            ))
        }

        return particles
    }
}

// MARK: - Confetti Particle

private struct TutorialConfettiParticle {
    let x: Double
    let y: Double
    let size: Double
    let color: Color
    let opacity: Double
}
