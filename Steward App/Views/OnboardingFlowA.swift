import SwiftUI

/// Flow A — First App Open (pre-auth)
/// 4 slides: Hero → What It Does → How It Works → CTA
struct OnboardingFlowA: View {
    @State private var currentPage = 0
    var onFinish: () -> Void  // called when user taps Sign Up / Sign In or skips

    // Brand colours
    private let deepForest = Color(hex: "0F2018")
    private let forestMid  = Color(hex: "1C3D2E")
    private let forestLight = Color(hex: "243D30")
    private let stewardGreen = Color(hex: "2A5C45")
    private let mint = Color(hex: "6EE7B7")
    private let cream = Color(hex: "F7F6F3")

    private let totalPages = 4

    var body: some View {
        ZStack {
            // Background
            deepForest.ignoresSafeArea()

            // Page content
            TabView(selection: $currentPage) {
                heroSlide.tag(0)
                whatItDoesSlide.tag(1)
                howItWorksSlide.tag(2)
                ctaSlide.tag(3)
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
            .animation(.easeInOut(duration: 0.35), value: currentPage)

            // Dots + buttons overlay
            VStack {
                Spacer()

                // Page dots
                if currentPage < totalPages - 1 {
                    pageDots
                        .padding(.bottom, 20)
                }

                // Navigation buttons
                if currentPage < totalPages - 1 {
                    primaryButton(currentPage == 0 ? "Get started →" : "Continue →") {
                        withAnimation { currentPage += 1 }
                    }
                    .padding(.horizontal, 28)

                    if currentPage == 0 {
                        Button("Skip intro") {
                            withAnimation { currentPage = totalPages - 1 }
                        }
                        .font(.system(size: 13))
                        .foregroundStyle(.white.opacity(0.35))
                        .padding(.top, 8)
                    }
                }
            }
            .padding(.bottom, 50)
        }
    }

    // MARK: - Slide 1: Hero

    private var heroSlide: some View {
        ZStack {
            // Radial glow
            RadialGradient(
                colors: [stewardGreen.opacity(0.45), .clear],
                center: .init(x: 0.5, y: 0.35),
                startRadius: 0,
                endRadius: 200
            )
            .ignoresSafeArea()

            // Secondary glow top-right
            RadialGradient(
                colors: [mint.opacity(0.08), .clear],
                center: .init(x: 0.8, y: 0.1),
                startRadius: 0,
                endRadius: 200
            )
            .ignoresSafeArea()

            // Breathing rings
            breathingRings

            VStack(spacing: 0) {
                Spacer().frame(height: 150)

                // App icon
                StewardLogo(size: 120)
                    .shadow(color: stewardGreen.opacity(0.8), radius: 30)
                    .shadow(color: mint.opacity(0.3), radius: 8)

                Spacer().frame(height: 50)

                // Content
                VStack(spacing: 14) {
                    Text("YOUR PERSONAL AI CONCIERGE")
                        .font(.system(size: 11, weight: .medium))
                        .tracking(2.5)
                        .foregroundStyle(mint.opacity(0.8))

                    VStack(spacing: 4) {
                        Text("Never miss a")
                            .font(Theme.serif(38, weight: .bold))
                            .foregroundStyle(cream)
                        Text("deal")
                            .font(Font.custom("Georgia-BoldItalic", size: 38))
                            .foregroundStyle(mint)
                        + Text(" or restock")
                            .font(Theme.serif(38, weight: .bold))
                            .foregroundStyle(cream)
                    }
                    .multilineTextAlignment(.center)

                    Text("Steward keeps an eye on the things you want. Price drops, restocks, sold-out items. You just wait for the tap on your shoulder.")
                        .font(.system(size: 15, weight: .light))
                        .lineSpacing(4)
                        .foregroundStyle(cream.opacity(0.6))
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 12)
                }
                .padding(.horizontal, 32)

                Spacer()
            }
        }
    }

    // MARK: - Slide 2: What It Does

    private var whatItDoesSlide: some View {
        ZStack {
            RadialGradient(
                colors: [stewardGreen.opacity(0.3), .clear],
                center: .init(x: 0.8, y: 0.3),
                startRadius: 0,
                endRadius: 200
            )
            .ignoresSafeArea()

            VStack(alignment: .leading, spacing: 0) {
                Spacer().frame(height: 72)

                // Header
                VStack(alignment: .leading, spacing: 10) {
                    Text("WHAT STEWARD DOES")
                        .font(.system(size: 11, weight: .medium))
                        .tracking(2.2)
                        .foregroundStyle(mint.opacity(0.7))

                    Text("Your wishlist,\non autopilot")
                        .font(Theme.serif(28, weight: .bold))
                        .foregroundStyle(cream)
                        .lineSpacing(4)
                }
                .padding(.horizontal, 32)

                Spacer().frame(height: 32)

                // Feature cards
                VStack(spacing: 12) {
                    featureCard(emoji: "📉", title: "Price Drop Alerts", body: "Pick a target price. Steward watches. You get pinged the second it drops.")
                    featureCard(emoji: "🔔", title: "Back in Stock", body: "Sold out? Steward waits patiently. You get the tap the moment it is back.")
                    featureCard(emoji: "💸", title: "Cashback and Coupons", body: "Savings show up at checkout like magic. No coupon hunting required.")
                    featureCard(emoji: "✈️", title: "Any Website", body: "Shoes, flights, rentals, concert tickets. If it lives on the web, Steward can watch it.")
                }
                .padding(.horizontal, 24)

                Spacer()
            }
        }
    }

    // MARK: - Slide 3: How It Works

    private var howItWorksSlide: some View {
        ZStack {
            RadialGradient(
                colors: [stewardGreen.opacity(0.25), .clear],
                center: .init(x: 0.2, y: 0.7),
                startRadius: 0,
                endRadius: 250
            )
            .ignoresSafeArea()

            VStack(alignment: .leading, spacing: 0) {
                Spacer().frame(height: 72)

                VStack(alignment: .leading, spacing: 10) {
                    Text("HOW IT WORKS")
                        .font(.system(size: 11, weight: .medium))
                        .tracking(2.2)
                        .foregroundStyle(mint.opacity(0.7))

                    Text("Set up a watch\nin seconds")
                        .font(Theme.serif(28, weight: .bold))
                        .foregroundStyle(cream)
                        .lineSpacing(4)
                }
                .padding(.horizontal, 32)

                Spacer().frame(height: 36)

                // Steps
                VStack(spacing: 0) {
                    stepRow(number: 1, title: "Share or paste a link", body: "Drop any product link into Steward from Safari, Amazon, anywhere.", isLast: false)
                    stepRow(number: 2, title: "Tell the AI what to watch for", body: "\"Drop it below $80\" or \"tell me when it is back.\" Steward gets it.", isLast: false)
                    stepRow(number: 3, title: "Steward handles the rest", body: "It checks quietly in the background. When something changes, you will know.", isLast: true)
                }
                .padding(.horizontal, 32)

                Spacer().frame(height: 28)

                // Mockup notification card
                HStack(spacing: 12) {
                    Text("👟")
                        .font(.system(size: 22))

                    VStack(alignment: .leading, spacing: 2) {
                        Text("Nike Dunk Low Panda")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(cream)
                        Text("↓ Dropped to $89 · was $120")
                            .font(.system(size: 11))
                            .foregroundStyle(mint.opacity(0.7))
                    }

                    Spacer()

                    Text("VIEW DEAL")
                        .font(.system(size: 10, weight: .semibold))
                        .tracking(0.5)
                        .foregroundStyle(mint)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(mint.opacity(0.15))
                        .overlay(
                            RoundedRectangle(cornerRadius: 20)
                                .stroke(mint.opacity(0.25), lineWidth: 1)
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 20))
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 14)
                .background(.white.opacity(0.03))
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(.white.opacity(0.07), lineWidth: 1)
                )
                .clipShape(RoundedRectangle(cornerRadius: 16))
                .padding(.horizontal, 24)

                Spacer()
            }
        }
    }

    // MARK: - Slide 4: CTA

    private var ctaSlide: some View {
        ZStack {
            RadialGradient(
                colors: [stewardGreen.opacity(0.5), .clear],
                center: .init(x: 0.5, y: 0.4),
                startRadius: 0,
                endRadius: 220
            )
            .ignoresSafeArea()

            RadialGradient(
                colors: [mint.opacity(0.05), .clear],
                center: .init(x: 0.2, y: 0.8),
                startRadius: 0,
                endRadius: 200
            )
            .ignoresSafeArea()

            VStack(spacing: 0) {
                Spacer()

                // Icon
                StewardLogo(size: 64)
                    .shadow(color: stewardGreen.opacity(0.9), radius: 20)
                    .shadow(color: mint.opacity(0.25), radius: 6)

                Spacer().frame(height: 20)

                VStack(spacing: 4) {
                    Text("Start for ")
                        .font(Theme.serif(28, weight: .bold))
                        .foregroundStyle(cream)
                    + Text("free")
                        .font(Font.custom("Georgia-BoldItalic", size: 28))
                        .foregroundStyle(mint)
                    + Text(",")
                        .font(Theme.serif(28, weight: .bold))
                        .foregroundStyle(cream)

                    Text("upgrade anytime")
                        .font(Theme.serif(28, weight: .bold))
                        .foregroundStyle(cream)
                }
                .multilineTextAlignment(.center)

                Spacer().frame(height: 10)

                Text("No credit card needed. Jump in free and upgrade when your wishlist gets bigger.")
                    .font(.system(size: 13, weight: .light))
                    .lineSpacing(4)
                    .foregroundStyle(cream.opacity(0.6))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)

                Spacer().frame(height: 12)

                // Tier cards (vertical layout)
                VStack(spacing: 6) {
                    tierCard(icon: "🌱", label: "Free", value: "3 watches · checks once a day", perks: "AI chat setup, price history, activity feed, cashback", highlighted: false)
                    tierCard(icon: "⚡", label: "Pro", value: "15 watches · checks every 30 min", perks: "Everything in Free, plus faster checks and more watches", highlighted: false)
                    tierCard(icon: "✦", label: "Premium", value: "Unlimited watches · every 5 min", perks: "Everything in Pro, plus near real-time checks and unlimited watches", highlighted: true)
                }
                .padding(.horizontal, 32)

                Spacer()

                // CTA buttons
                VStack(spacing: 12) {
                    primaryButton("Create free account") {
                        onFinish()
                    }

                    Button {
                        onFinish()
                    } label: {
                        Text("I already have an account")
                            .font(.system(size: 14))
                            .foregroundStyle(.white.opacity(0.5))
                            .frame(maxWidth: .infinity)
                            .frame(height: 46)
                            .overlay(
                                RoundedRectangle(cornerRadius: 14)
                                    .stroke(.white.opacity(0.12), lineWidth: 1)
                            )
                    }
                }
                .padding(.horizontal, 28)
                .padding(.bottom, 50)
            }
        }
    }

    // MARK: - Reusable Components

    private var pageDots: some View {
        HStack(spacing: 6) {
            ForEach(0..<totalPages, id: \.self) { i in
                Capsule()
                    .fill(i == currentPage ? mint : .white.opacity(0.2))
                    .frame(width: i == currentPage ? 20 : 6, height: 6)
                    .animation(.easeOut(duration: 0.3), value: currentPage)
            }
        }
    }

    private func primaryButton(_ label: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(label)
                .font(.system(size: 15, weight: .semibold))
                .tracking(0.3)
                .foregroundStyle(deepForest)
                .frame(maxWidth: .infinity)
                .frame(height: 54)
                .background(mint)
                .clipShape(RoundedRectangle(cornerRadius: 16))
        }
    }

    private func featureCard(emoji: String, title: String, body: String) -> some View {
        HStack(alignment: .top, spacing: 16) {
            Text(emoji)
                .font(.system(size: 18))
                .frame(width: 40, height: 40)
                .background(mint.opacity(0.15))
                .clipShape(RoundedRectangle(cornerRadius: 12))

            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(Theme.serif(15, weight: .semibold))
                    .foregroundStyle(cream)

                Text(body)
                    .font(.system(size: 12.5, weight: .light))
                    .lineSpacing(2)
                    .foregroundStyle(cream.opacity(0.6))
            }
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(.white.opacity(0.04))
        .overlay(
            RoundedRectangle(cornerRadius: 18)
                .stroke(.white.opacity(0.07), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 18))
    }

    private func stepRow(number: Int, title: String, body: String, isLast: Bool) -> some View {
        HStack(alignment: .top, spacing: 20) {
            // Number + connector
            VStack(spacing: 6) {
                Text("\(number)")
                    .font(Theme.serif(13, weight: .semibold))
                    .foregroundStyle(mint)
                    .frame(width: 32, height: 32)
                    .background(stewardGreen)
                    .overlay(
                        Circle().stroke(mint.opacity(0.3), lineWidth: 1)
                    )
                    .clipShape(Circle())

                if !isLast {
                    Rectangle()
                        .fill(
                            LinearGradient(
                                colors: [mint.opacity(0.2), .clear],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        )
                        .frame(width: 1, height: 28)
                }
            }

            // Text
            VStack(alignment: .leading, spacing: 5) {
                Text(title)
                    .font(Theme.serif(16, weight: .semibold))
                    .foregroundStyle(cream)

                Text(body)
                    .font(.system(size: 13, weight: .light))
                    .lineSpacing(2)
                    .foregroundStyle(cream.opacity(0.6))
            }
            .padding(.top, 4)
        }
        .padding(.bottom, isLast ? 0 : 8)
    }

    private func tierCard(icon: String, label: String, value: String, perks: String, highlighted: Bool) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Text(icon)
                .font(.system(size: 16))
                .padding(.top, 1)

            VStack(alignment: .leading, spacing: 1) {
                Text(label.uppercased())
                    .font(.system(size: 9.5, weight: .semibold))
                    .tracking(1.2)
                    .foregroundStyle(mint)

                Text(value)
                    .font(Theme.serif(12.5, weight: .semibold))
                    .foregroundStyle(cream)

                Text(perks)
                    .font(.system(size: 10.5, weight: .light))
                    .lineSpacing(2)
                    .foregroundStyle(cream.opacity(0.6))
            }
        }
        .padding(.horizontal, 13)
        .padding(.vertical, 9)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(highlighted ? mint.opacity(0.07) : .white.opacity(0.04))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(highlighted ? mint.opacity(0.22) : .white.opacity(0.08), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private var breathingRings: some View {
        ZStack {
            ForEach(0..<4, id: \.self) { i in
                Circle()
                    .stroke(mint.opacity(0.08), lineWidth: 1)
                    .frame(width: CGFloat(200 + i * 70), height: CGFloat(200 + i * 70))
                    .modifier(BreathingModifier(delay: Double(i) * 0.5))
            }
        }
        .offset(y: -70)
    }
}

// MARK: - Breathing Animation Modifier

private struct BreathingModifier: ViewModifier {
    let delay: Double
    @State private var isAnimating = false

    func body(content: Content) -> some View {
        content
            .scaleEffect(isAnimating ? 1.03 : 1.0)
            .opacity(isAnimating ? 1.0 : 0.5)
            .onAppear {
                withAnimation(
                    .easeInOut(duration: 4)
                    .repeatForever(autoreverses: true)
                    .delay(delay)
                ) {
                    isAnimating = true
                }
            }
    }
}
