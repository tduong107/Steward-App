import SwiftUI

struct CelebrationOverlay: View {
    let milestone: SavingsMilestone
    let totalSavings: Double
    let onDismiss: () -> Void

    @State private var showCard = false
    @State private var showAmount = false
    @State private var confettiPhase: CGFloat = 0

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
                // Milestone emoji
                Text(milestone.emoji)
                    .font(.system(size: 56))
                    .scaleEffect(showCard ? 1 : 0.3)
                    .animation(.spring(response: 0.5, dampingFraction: 0.6), value: showCard)

                // Title
                Text("Milestone Reached!")
                    .font(Theme.serif(22, weight: .bold))
                    .foregroundStyle(.white)
                    .opacity(showCard ? 1 : 0)
                    .offset(y: showCard ? 0 : 20)

                // Savings amount
                VStack(spacing: 4) {
                    Text("You've saved")
                        .font(Theme.body(13))
                        .foregroundStyle(.white.opacity(0.7))

                    Text(formatPrice(totalSavings))
                        .font(Theme.serif(36, weight: .bold))
                        .foregroundStyle(Theme.accent)
                        .scaleEffect(showAmount ? 1 : 0.5)
                        .opacity(showAmount ? 1 : 0)

                    Text("across your price watches")
                        .font(Theme.body(13))
                        .foregroundStyle(.white.opacity(0.7))
                }
                .opacity(showCard ? 1 : 0)

                // Milestone label
                Text(milestone.label)
                    .font(Theme.body(12, weight: .semibold))
                    .foregroundStyle(Theme.accent)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 6)
                    .background(Theme.accent.opacity(0.15))
                    .clipShape(Capsule())
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
                    Text("Amazing!")
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
            }
            withAnimation(.spring(response: 0.5, dampingFraction: 0.7).delay(0.2)) {
                showAmount = true
            }
        }
    }

    private func dismiss() {
        withAnimation(.easeOut(duration: 0.2)) {
            showCard = false
            showAmount = false
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
                let particles = generateParticles(count: 80, canvasSize: size, time: elapsed)

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

    private func generateParticles(count: Int, canvasSize: CGSize, time: Double) -> [ConfettiParticle] {
        var particles: [ConfettiParticle] = []
        let colors: [Color] = [
            Theme.accent, .yellow, .blue, .green, .orange, .purple, .pink, .cyan
        ]

        for i in 0..<count {
            // Use index as seed for deterministic positioning
            let seed = Double(i)
            let phase = seed * 0.7
            let speed = 30 + (seed.truncatingRemainder(dividingBy: 7)) * 15
            let drift = sin(time * 2 + phase) * 20

            let x = (seed * 17).truncatingRemainder(dividingBy: canvasSize.width) + drift
            let rawY = ((time * speed + phase * 50).truncatingRemainder(dividingBy: (canvasSize.height + 100))) - 50
            let y = rawY < 0 ? rawY + canvasSize.height + 100 : rawY

            let colorIndex = Int(seed) % colors.count
            let size = 4 + (seed.truncatingRemainder(dividingBy: 5)) * 1.5

            // Fade out near bottom
            let fadeStart = canvasSize.height * 0.7
            let opacity = y > fadeStart ? max(0, 1 - (y - fadeStart) / (canvasSize.height * 0.3)) : 1.0

            particles.append(ConfettiParticle(
                x: x,
                y: y,
                size: size,
                color: colors[colorIndex],
                opacity: opacity
            ))
        }

        return particles
    }

    private func formatPrice(_ price: Double) -> String {
        "$\(String(format: "%.2f", price))"
    }
}

// MARK: - Confetti Particle

private struct ConfettiParticle {
    let x: Double
    let y: Double
    let size: Double
    let color: Color
    let opacity: Double
}
