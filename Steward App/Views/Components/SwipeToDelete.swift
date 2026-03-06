import SwiftUI

/// A reusable swipe-to-delete wrapper for use inside ScrollView / VStack layouts.
/// Swipe left to reveal a red "Delete" button, then tap to confirm.
///
/// Key design choices:
/// - Uses `.simultaneousGesture` so it doesn't fight the parent ScrollView
/// - Only activates for primarily horizontal swipes (abs(x) > abs(y))
/// - Blocks the inner Button tap during and briefly after a swipe via `allowsHitTesting`
struct SwipeToDelete<Content: View>: View {
    let content: Content
    let onDelete: () -> Void

    @State private var offset: CGFloat = 0
    @State private var isSwiping = false
    @State private var didSwipe = false       // stays true briefly after swipe to block tap
    @State private var showConfirm = false

    private let deleteWidth: CGFloat = 80
    private let activationThreshold: CGFloat = 20

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
                // Block taps on the WatchCard button during/after swipe
                .allowsHitTesting(!didSwipe && offset == 0)
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
        DragGesture(minimumDistance: 15)
            .onChanged { value in
                let horizontal = abs(value.translation.width)
                let vertical = abs(value.translation.height)

                // Only activate for primarily horizontal swipes
                if !isSwiping {
                    guard horizontal > vertical, horizontal > activationThreshold else { return }
                    isSwiping = true
                    didSwipe = true
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
                isSwiping = false

                withAnimation(.spring(response: 0.35, dampingFraction: 0.75)) {
                    if -offset > deleteWidth / 2 {
                        // Snap open
                        offset = -deleteWidth
                    } else {
                        // Snap closed
                        offset = 0
                    }
                }

                // Clear the didSwipe flag after a short delay so the
                // Button tap that fires simultaneously gets blocked.
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
                    didSwipe = false
                }
            }
    }
}
