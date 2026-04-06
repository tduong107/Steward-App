import SwiftUI
import Combine

/// Flow A — Pre-auth onboarding
/// 3 auto-cycling pages with a single centralized timer
struct OnboardingFlowA: View {
    @State private var currentPage = 0
    @State private var cycleId = UUID() // Changes on each page transition to cancel stale animations
    var onFinish: (_ wantsSignIn: Bool) -> Void

    private let deepForest = Color(hex: "0F2018")
    private let stewardGreen = Color(hex: "2A5C45")
    private let mint = Color(hex: "6EE7B7")
    private let cream = Color(hex: "F7F6F3")
    private let gold = Color(hex: "F59E0B")
    private let totalPages = 3

    // Page durations: page 1 is driven by typewriter callback, pages 2 & 3 by timer
    private let pageDurations: [Double] = [99, 5.5, 5.5] // page 0 = effectively infinite (typewriter drives it)

    var body: some View {
        ZStack {
            deepForest.ignoresSafeArea()

            TabView(selection: $currentPage) {
                monitorPage.tag(0)
                pricePage.tag(1)
                notifPage.tag(2)
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
            .animation(.easeInOut(duration: 0.6), value: currentPage)

            // Bottom
            VStack(spacing: 0) {
                Spacer()
                LinearGradient(colors: [.clear, deepForest.opacity(0.95), deepForest], startPoint: .top, endPoint: .bottom)
                    .frame(height: 180).allowsHitTesting(false)

                VStack(spacing: 10) {
                    HStack(spacing: 8) {
                        ForEach(0..<totalPages, id: \.self) { i in
                            Capsule()
                                .fill(i == currentPage ? mint : cream.opacity(0.2))
                                .frame(width: i == currentPage ? 24 : 8, height: 8)
                                .animation(.easeOut(duration: 0.3), value: currentPage)
                        }
                    }
                    .padding(.bottom, 20)

                    Button { onFinish(false) } label: {
                        Text("Create Account").font(.system(size: 15, weight: .bold)).foregroundStyle(deepForest)
                            .frame(maxWidth: 340).frame(height: 54).background(mint)
                            .clipShape(RoundedRectangle(cornerRadius: 14))
                    }
                    Button { onFinish(true) } label: {
                        Text("Sign in").font(.system(size: 15, weight: .bold)).foregroundStyle(cream)
                            .frame(maxWidth: 340).frame(height: 54)
                            .overlay(RoundedRectangle(cornerRadius: 14).stroke(cream.opacity(0.15), lineWidth: 1.5))
                    }
                }
                .padding(.horizontal, 28).padding(.bottom, 40)
            }
        }
        .onAppear { scheduleAdvance() }
        .onChange(of: currentPage) { _, _ in
            cycleId = UUID()
            scheduleAdvance()
        }
    }

    private func scheduleAdvance() {
        let id = cycleId
        let delay = pageDurations[currentPage]
        DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
            guard cycleId == id else { return } // Stale — user swiped or page already changed
            withAnimation { currentPage = (currentPage + 1) % totalPages }
        }
    }

    // MARK: - Page 1: Monitor Anything

    private var monitorPage: some View {
        ZStack {
            RadialGradient(colors: [stewardGreen.opacity(0.55), .clear], center: .init(x: 0.25, y: 0.35), startRadius: 0, endRadius: 300).ignoresSafeArea()
            VStack(spacing: 0) {
                Spacer().frame(height: 100)
                (Text("Monitor\n").font(Font.custom("Georgia-Bold", size: 48)).foregroundColor(cream)
                 + Text("anything").font(Font.custom("Georgia-BoldItalic", size: 48)).foregroundColor(mint))
                .multilineTextAlignment(.center)
                Text("Prices, restocks, reservations, and more.")
                    .font(.system(size: 15, weight: .light)).foregroundStyle(cream.opacity(0.6)).padding(.top, 14)
                Spacer().frame(height: 36)
                TypewriterCard(mint: mint, cream: cream, deepForest: deepForest, stewardGreen: stewardGreen, isActive: currentPage == 0) {
                    withAnimation { currentPage = 1 }
                }
                Spacer()
            }
            .padding(.horizontal, 28)
        }
    }

    // MARK: - Page 2: Never Miss a Drop

    private var pricePage: some View {
        ZStack {
            RadialGradient(colors: [stewardGreen.opacity(0.5), .clear], center: .init(x: 0.5, y: 0.4), startRadius: 0, endRadius: 300).ignoresSafeArea()
            VStack(spacing: 0) {
                Spacer().frame(height: 100)
                (Text("Never miss\na ").font(Font.custom("Georgia-Bold", size: 48)).foregroundColor(cream)
                 + Text("drop").font(Font.custom("Georgia-BoldItalic", size: 48)).foregroundColor(mint))
                .multilineTextAlignment(.center)
                Text("Price drops, restocks, and openings.")
                    .font(.system(size: 15, weight: .light)).foregroundStyle(cream.opacity(0.6)).padding(.top, 14)
                Spacer().frame(height: 36)
                PriceCard(mint: mint, cream: cream, gold: gold, stewardGreen: stewardGreen, deepForest: deepForest, isActive: currentPage == 1)
                Spacer()
            }
            .padding(.horizontal, 28)
        }
    }

    // MARK: - Page 3: Steward Does the Watching

    private var notifPage: some View {
        ZStack {
            RadialGradient(colors: [stewardGreen.opacity(0.5), .clear], center: .init(x: 0.6, y: 0.3), startRadius: 0, endRadius: 300).ignoresSafeArea()
            VStack(spacing: 0) {
                Spacer().frame(height: 100)
                (Text("Steward does\nthe ").font(Font.custom("Georgia-Bold", size: 48)).foregroundColor(cream)
                 + Text("watching").font(Font.custom("Georgia-BoldItalic", size: 48)).foregroundColor(mint))
                .multilineTextAlignment(.center)
                Text("While you live your life.")
                    .font(.system(size: 15, weight: .light)).foregroundStyle(cream.opacity(0.6)).padding(.top, 14)
                Spacer().frame(height: 36)
                NotifStack(mint: mint, cream: cream, gold: gold, isActive: currentPage == 2)
                Spacer()
            }
            .padding(.horizontal, 28)
        }
    }
}

// MARK: - Page 1: Typewriter Card

private struct TypewriterCard: View {
    let mint: Color, cream: Color, deepForest: Color, stewardGreen: Color
    let isActive: Bool
    var onConfirmComplete: (() -> Void)? = nil

    @State private var displayText = ""
    @State private var phraseIndex = 0
    @State private var phase: Phase = .idle
    @State private var taskId = UUID()

    enum Phase { case idle, typing, paused, confirming }

    private let phrases = [
        "nike.com/dunk-low-panda",
        "resy.com/cities/la/bestia",
        "recreation.gov/camping",
        "google.com/flights/NYC-TYO",
        "ticketmaster.com/bad-bunny"
    ]

    var body: some View {
        ZStack {
            // Input layer
            HStack(spacing: 0) {
                Text(displayText)
                    .font(.system(size: 14, design: .monospaced))
                    .foregroundStyle(cream)
                    .lineLimit(1)

                if phase == .typing {
                    Rectangle().fill(mint).frame(width: 2, height: 17)
                        .opacity(1)
                }

                Spacer()

                Circle().fill(mint).frame(width: 34, height: 34)
                    .overlay(Image(systemName: "arrow.up").font(.system(size: 14, weight: .bold)).foregroundStyle(deepForest))
                    .scaleEffect(phase == .paused ? 1.15 : 1.0)
                    .shadow(color: phase == .paused ? mint.opacity(0.5) : .clear, radius: 10)
            }
            .padding(16)
            .opacity(phase == .confirming ? 0 : 1)

            // Confirm layer
            HStack(spacing: 12) {
                Image(systemName: "checkmark")
                    .font(.system(size: 14, weight: .bold)).foregroundStyle(deepForest)
                    .frame(width: 36, height: 36).background(mint).clipShape(Circle())
                    .scaleEffect(phase == .confirming ? 1 : 0)

                Text("Now watching!")
                    .font(.system(size: 15, weight: .semibold)).foregroundStyle(mint)
                    .opacity(phase == .confirming ? 1 : 0)
                    .offset(x: phase == .confirming ? 0 : -10)
            }
            .opacity(phase == .confirming ? 1 : 0)
        }
        .animation(.spring(response: 0.4, dampingFraction: 0.7), value: phase)
        .frame(maxWidth: 340)
        .background(
            ZStack {
                RoundedRectangle(cornerRadius: 18).fill(Color.white.opacity(0.04))
                    .overlay(RoundedRectangle(cornerRadius: 18).stroke(Color.white.opacity(0.08), lineWidth: 1))
                    .opacity(phase == .confirming ? 0 : 1)
                RoundedRectangle(cornerRadius: 18)
                    .fill(LinearGradient(colors: [stewardGreen.opacity(0.95), Color(hex: "1C3D2E").opacity(0.92)], startPoint: .topLeading, endPoint: .bottomTrailing))
                    .overlay(RoundedRectangle(cornerRadius: 18).stroke(mint.opacity(0.25), lineWidth: 1))
                    .opacity(phase == .confirming ? 1 : 0)
            }
            .animation(.easeInOut(duration: 0.3), value: phase)
        )
        .clipShape(RoundedRectangle(cornerRadius: 18))
        .onChange(of: isActive) { _, active in
            if active { startCycle() } else { cancelCycle() }
        }
        .onAppear { if isActive { startCycle() } }
    }

    private func cancelCycle() {
        taskId = UUID()
        phase = .idle
        displayText = ""
    }

    private func startCycle() {
        cancelCycle()
        let id = UUID()
        taskId = id
        phase = .typing
        typeNext(phrase: phrases[phraseIndex], index: 0, id: id)
    }

    private func typeNext(phrase: String, index: Int, id: UUID) {
        guard taskId == id else { return }
        if index > phrase.count { return }

        if index == phrase.count {
            phase = .paused
            after(0.5, id: id) {
                phase = .confirming
                // Advance page after showing confirmation
                after(1.0, id: id) {
                    onConfirmComplete?()
                    // Reset for next time this page becomes active
                    after(0.5, id: id) {
                        phraseIndex = (phraseIndex + 1) % phrases.count
                        cancelCycle()
                    }
                }
            }
            return
        }

        displayText = String(phrase.prefix(index + 1))
        after(Double.random(in: 0.03...0.06), id: id) {
            typeNext(phrase: phrase, index: index + 1, id: id)
        }
    }

    private func after(_ delay: Double, id: UUID, action: @escaping () -> Void) {
        DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
            guard taskId == id else { return }
            action()
        }
    }
}

// MARK: - Page 2: Price Drop Card

private struct PriceCard: View {
    let mint: Color, cream: Color, gold: Color, stewardGreen: Color, deepForest: Color
    let isActive: Bool

    @State private var showDrop = false
    @State private var showBadge = false
    @State private var showNotif = false
    @State private var chartProgress: CGFloat = 0
    @State private var animId = UUID()

    // Price going DOWN over time: starts high ($120 area), drops to low ($89 area)
    private let pts: [CGFloat] = [65, 62, 58, 60, 55, 50, 45, 38, 35, 28, 15]

    var body: some View {
        ZStack(alignment: .bottom) {
            // Card content
            VStack(alignment: .leading, spacing: 0) {
                HStack {
                    Text("PRICE WATCH").font(.system(size: 10, weight: .semibold)).tracking(1.5).foregroundStyle(mint.opacity(0.5))
                    Spacer()
                    if showBadge {
                        Text("SAVE 26%").font(.system(size: 9, weight: .heavy)).foregroundStyle(gold)
                            .padding(.horizontal, 10).padding(.vertical, 3)
                            .background(gold.opacity(0.15)).overlay(Capsule().stroke(gold.opacity(0.3), lineWidth: 1)).clipShape(Capsule())
                            .transition(.scale.combined(with: .opacity))
                    }
                }

                HStack(spacing: 10) {
                    Text("👟").font(.system(size: 24))
                    VStack(alignment: .leading, spacing: 1) {
                        Text("Nike Dunk Low Panda").font(.system(size: 13, weight: .medium)).foregroundStyle(cream)
                        Text("nike.com").font(.system(size: 11)).foregroundStyle(cream.opacity(0.4))
                    }
                }.padding(.top, 10)

                HStack(alignment: .firstTextBaseline, spacing: 10) {
                    Text(showDrop ? "$89" : "$120")
                        .font(Font.custom("Georgia-Bold", size: 34)).foregroundStyle(mint)
                        .contentTransition(.numericText()).animation(.easeInOut(duration: 0.5), value: showDrop)
                    if showDrop {
                        Text("$120").font(.system(size: 15)).foregroundStyle(cream.opacity(0.3)).strikethrough().transition(.opacity)
                    }
                }.padding(.top, 8)

                // Chart
                GeometryReader { geo in
                    let w = geo.size.width
                    let h: CGFloat = 80
                    let step = w / CGFloat(pts.count - 1)
                    ZStack(alignment: .bottomLeading) {
                        Path { p in
                            p.move(to: CGPoint(x: 0, y: h - pts[0]))
                            for i in 1..<pts.count { p.addLine(to: CGPoint(x: step * CGFloat(i), y: h - pts[i])) }
                            p.addLine(to: CGPoint(x: w, y: h)); p.addLine(to: CGPoint(x: 0, y: h)); p.closeSubpath()
                        }
                        .fill(LinearGradient(colors: [mint.opacity(0.25), mint.opacity(0)], startPoint: .top, endPoint: .bottom))
                        .opacity(Double(chartProgress))

                        Path { p in
                            p.move(to: CGPoint(x: 0, y: h - pts[0]))
                            for i in 1..<pts.count { p.addLine(to: CGPoint(x: step * CGFloat(i), y: h - pts[i])) }
                        }
                        .trim(from: 0, to: chartProgress)
                        .stroke(mint, style: StrokeStyle(lineWidth: 2.5, lineCap: .round, lineJoin: .round))
                    }
                }
                .frame(height: 80).padding(.top, 8)

                HStack {
                    ForEach(["Jan", "Feb", "Mar", "Apr", "Now"], id: \.self) { l in
                        Text(l).font(.system(size: 10)).foregroundStyle(cream.opacity(0.3))
                        if l != "Now" { Spacer() }
                    }
                }.padding(.top, 6)
            }
            .padding(20)

            // Price dropped overlay — covers bottom half of card
            if showNotif {
                priceDropOverlay
            }
        }
        .background(Color.white.opacity(0.04))
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(Color.white.opacity(0.08), lineWidth: 1))
        .clipShape(RoundedRectangle(cornerRadius: 18))
        .frame(maxWidth: 340)
        .onChange(of: isActive) { _, active in
            if active { run() } else { reset() }
        }
        .onAppear { if isActive { run() } }
    }

    private var priceDropOverlay: some View {
        VStack(spacing: 8) {
            Image(systemName: "bell.fill")
                .font(.system(size: 20))
                .foregroundStyle(mint)

            Text("Price dropped!")
                .font(.system(size: 17, weight: .bold))
                .foregroundStyle(.white)

            Text("Nike Dunk Low is now $89")
                .font(.system(size: 14))
                .foregroundStyle(.white.opacity(0.85))

            HStack(spacing: 6) {
                Text("Tap to buy now")
                    .font(.system(size: 15, weight: .bold))
                Image(systemName: "arrow.right")
                    .font(.system(size: 13, weight: .bold))
            }
            .foregroundStyle(deepForest)
            .padding(.horizontal, 24)
            .padding(.vertical, 12)
            .background(mint)
            .clipShape(Capsule())
            .padding(.top, 4)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 24)
        .background(
            LinearGradient(colors: [stewardGreen, Color(hex: "1C3D2E")], startPoint: .top, endPoint: .bottom)
        )
        .transition(.move(edge: .bottom).combined(with: .opacity))
    }

    private func run() {
        reset()
        let id = UUID(); animId = id
        withAnimation(.easeInOut(duration: 2.2)) { chartProgress = 1.0 }
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.8) { guard animId == id else { return }; withAnimation { showDrop = true } }
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.1) { guard animId == id else { return }; withAnimation(.spring(response: 0.4)) { showBadge = true } }
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.5) { guard animId == id else { return }; withAnimation(.easeOut(duration: 0.4)) { showNotif = true } }
    }

    private func reset() {
        animId = UUID(); showDrop = false; showBadge = false; showNotif = false; chartProgress = 0
    }
}

// MARK: - Page 3: Notification Stack

private struct NotifStack: View {
    let mint: Color, cream: Color, gold: Color
    let isActive: Bool

    @State private var show: [Bool] = [false, false, false, false]
    @State private var animId = UUID()

    var body: some View {
        VStack(spacing: 8) {
            row(emoji: "🏕", title: "Campsite Available!", desc: "Upper Pines, Yosemite · Jun 14-16", badge: "Book now", bc: Color(hex: "34D399"), hl: true, vis: show[0])
            row(emoji: "🍽", title: "Reservation Open", desc: "Fri 7pm at Bestia · 2 guests", badge: "Open!", bc: mint, hl: false, vis: show[1])
            row(emoji: "✈️", title: "Flight Price Dropped", desc: "LAX → Tokyo $489 (was $720)", badge: "↓ $231", bc: gold, hl: false, vis: show[2])
            row(emoji: "🎫", title: "Tickets Available", desc: "Bad Bunny · Sat 8pm · Floor seats", badge: "Get tix", bc: mint, hl: false, vis: show[3])
        }
        .frame(maxWidth: 340)
        .onChange(of: isActive) { _, active in
            if active { animateIn() } else { animId = UUID(); show = [false, false, false, false] }
        }
    }

    private func animateIn() {
        let id = UUID(); animId = id; show = [false, false, false, false]
        for i in 0..<4 {
            let delay = 0.3 + Double(i) * 0.3
            DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
                guard animId == id else { return }
                withAnimation(.spring(response: 0.6, dampingFraction: 0.8)) { show[i] = true }
            }
        }
    }

    private func row(emoji: String, title: String, desc: String, badge: String, bc: Color, hl: Bool, vis: Bool) -> some View {
        HStack(spacing: 12) {
            Text(emoji).font(.system(size: 22))
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.system(size: 13, weight: .semibold)).foregroundStyle(cream)
                Text(desc).font(.system(size: 11.5)).foregroundStyle(cream.opacity(0.5))
            }
            Spacer()
            Text(badge).font(.system(size: 9, weight: .bold)).foregroundStyle(bc)
                .padding(.horizontal, 8).padding(.vertical, 3)
                .background(bc.opacity(0.15)).overlay(Capsule().stroke(bc.opacity(0.3), lineWidth: 1)).clipShape(Capsule())
        }
        .padding(14)
        .background(hl ? mint.opacity(0.07) : Color.white.opacity(0.04))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(hl ? mint.opacity(0.2) : Color.white.opacity(0.08), lineWidth: 1))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .opacity(vis ? 1 : 0)
        .offset(x: vis ? 0 : 60)
    }
}
