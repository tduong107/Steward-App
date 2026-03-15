import SwiftUI

/// A reusable swipe-to-delete wrapper for use inside ScrollView / VStack layouts.
/// Swipe left to reveal a red "Delete" button, then tap to confirm.
///
/// Uses `.simultaneousGesture` so that vertical scrolling is never blocked.
/// Direction is locked on the first significant movement — vertical yields to
/// the parent ScrollView, horizontal activates the swipe.
struct SwipeToDelete<Content: View>: View {
    let content: Content
    let onDelete: () -> Void

    @State private var offset: CGFloat = 0
    @State private var isSwiping = false
    @State private var isVerticalScroll = false
    @State private var showConfirm = false

    private let deleteWidth: CGFloat = 80
    private let directionThreshold: CGFloat = 10

    init(onDelete: @escaping () -> Void, @ViewBuilder content: () -> Content) {
        self.onDelete = onDelete
        self.content = content()
    }

    var body: some View {
        ZStack(alignment: .trailing) {
            // Delete button behind the card (only rendered when visible)
            if offset < -5 {
                deleteButton
            }

            // Main content on top, offset by drag
            content
                .offset(x: offset)
                // Block taps whenever swiping or the card is offset
                .allowsHitTesting(!isSwiping && offset == 0)
                .overlay {
                    // When swiped open, tapping the card area closes the swipe
                    if offset < 0 && !isSwiping {
                        Color.clear
                            .contentShape(Rectangle())
                            .onTapGesture {
                                withAnimation(.spring(response: 0.3)) {
                                    offset = 0
                                }
                            }
                    }
                }
        }
        .contentShape(Rectangle())
        // simultaneousGesture lets the parent ScrollView's vertical drag
        // coexist with our horizontal swipe — no more scroll blocking.
        .simultaneousGesture(swipeGesture)
        .clipped()
        .alert("Delete Watch", isPresented: $showConfirm) {
            Button("Cancel", role: .cancel) {
                withAnimation(.spring(response: 0.3)) {
                    offset = 0
                }
            }
            Button("Delete", role: .destructive) {
                withAnimation(.spring(response: 0.3)) {
                    offset = 0
                }
                onDelete()
            }
        } message: {
            Text("Are you sure you want to delete this watch? This action cannot be undone.")
        }
    }

    // MARK: - Delete Button

    private var deleteButton: some View {
        HStack(spacing: 0) {
            Spacer()

            Button {
                showConfirm = true
            } label: {
                VStack(spacing: 4) {
                    Image(systemName: "trash.fill")
                        .font(.system(size: 16))
                    Text("Delete")
                        .font(Theme.body(11, weight: .medium))
                }
                .foregroundStyle(.white)
                .frame(width: deleteWidth)
                .frame(maxHeight: .infinity)
            }
            .buttonStyle(.plain)
        }
        .frame(maxHeight: .infinity)
        .background(Theme.red)
        .clipShape(RoundedRectangle(cornerRadius: Theme.radiusLg))
    }

    // MARK: - Swipe Gesture

    private var swipeGesture: some Gesture {
        DragGesture(minimumDistance: 8)
            .onChanged { value in
                // Once locked as a vertical scroll, ignore all horizontal movement
                // so the ScrollView handles it without any resistance.
                if isVerticalScroll { return }

                let horizontal = abs(value.translation.width)
                let vertical = abs(value.translation.height)

                // First significant movement locks the direction for this gesture
                if !isSwiping {
                    let distance = max(horizontal, vertical)
                    guard distance > directionThreshold else { return }

                    if vertical > horizontal {
                        // Vertical — hand off to ScrollView entirely
                        isVerticalScroll = true
                        return
                    }
                    // Horizontal — activate swipe mode
                    isSwiping = true
                }

                let translation = value.translation.width

                if translation < 0 {
                    // Swiping left — cap with rubber-band effect
                    offset = max(translation, -deleteWidth * 1.3)
                } else if offset < 0 {
                    // Swiping right from open position
                    offset = min(0, -deleteWidth + translation)
                }
            }
            .onEnded { _ in
                if isSwiping {
                    withAnimation(.spring(response: 0.35, dampingFraction: 0.75)) {
                        if -offset > deleteWidth / 2 {
                            offset = -deleteWidth
                        } else {
                            offset = 0
                        }
                    }
                }

                // Reset flags after animation settles
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
                    isSwiping = false
                    isVerticalScroll = false
                }
            }
    }
}
