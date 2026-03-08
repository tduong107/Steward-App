import SwiftUI

struct JoinWatchSheet: View {
    let sharedWatch: SharedWatchData
    let onJoin: () -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var isJoining = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Hero
                VStack(spacing: 16) {
                    Image(systemName: "person.badge.plus")
                        .font(.system(size: 28))
                        .foregroundStyle(Theme.accent)
                        .frame(width: 64, height: 64)
                        .background(Theme.accentLight)
                        .clipShape(RoundedRectangle(cornerRadius: 20))
                        .overlay(
                            RoundedRectangle(cornerRadius: 20)
                                .stroke(Theme.accentMid, lineWidth: 1)
                        )

                    VStack(spacing: 6) {
                        Text("Join this watch")
                            .font(Theme.serif(19, weight: .bold))
                            .foregroundStyle(Theme.ink)

                        Text("\(sharedWatch.sharedByName) invited you to\nwatch this together.")
                            .font(Theme.body(13))
                            .foregroundStyle(Theme.inkMid)
                            .multilineTextAlignment(.center)
                    }
                }
                .padding(.top, 28)
                .padding(.bottom, 24)

                // Watch preview card
                HStack(spacing: 12) {
                    Text(sharedWatch.emoji)
                        .font(.system(size: 20))
                        .frame(width: 44, height: 44)
                        .background(Theme.bgDeep)
                        .clipShape(RoundedRectangle(cornerRadius: 12))

                    VStack(alignment: .leading, spacing: 2) {
                        Text(sharedWatch.name)
                            .font(Theme.body(14, weight: .semibold))
                            .foregroundStyle(Theme.ink)
                            .lineLimit(1)

                        Text(sharedWatch.condition)
                            .font(Theme.body(12))
                            .foregroundStyle(Theme.inkLight)
                            .lineLimit(2)
                    }

                    Spacer()
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 14)
                .background(Theme.bgCard)
                .clipShape(RoundedRectangle(cornerRadius: 14))
                .overlay(
                    RoundedRectangle(cornerRadius: 14)
                        .stroke(Theme.border, lineWidth: 1)
                )
                .padding(.horizontal, 24)

                // URL preview
                HStack(spacing: 8) {
                    Image(systemName: "globe")
                        .font(.system(size: 12))
                        .foregroundStyle(Theme.inkLight)

                    Text(sharedWatch.url)
                        .font(Theme.body(12))
                        .foregroundStyle(Theme.inkMid)
                        .lineLimit(1)
                        .truncationMode(.middle)
                }
                .padding(.horizontal, 24)
                .padding(.top, 12)

                Spacer()

                // Action buttons
                VStack(spacing: 10) {
                    Button {
                        isJoining = true
                        onJoin()
                        // Small delay then dismiss
                        Task {
                            try? await Task.sleep(for: .seconds(0.5))
                            dismiss()
                        }
                    } label: {
                        HStack(spacing: 6) {
                            if isJoining {
                                ProgressView()
                                    .controlSize(.small)
                                    .tint(.white)
                            } else {
                                Image(systemName: "plus.circle.fill")
                                    .font(.system(size: 14))
                            }
                            Text("Add to My Watches")
                                .font(Theme.body(14, weight: .bold))
                        }
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Theme.accent)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                        .shadow(color: Theme.accent.opacity(0.25), radius: 12, y: 4)
                    }
                    .disabled(isJoining)

                    Button {
                        dismiss()
                    } label: {
                        Text("Not now")
                            .font(Theme.body(14, weight: .semibold))
                            .foregroundStyle(Theme.inkMid)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                    }
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 34)
            }
            .background(Theme.bgCard)
            .navigationBarTitleDisplayMode(.inline)
        }
        .presentationDetents([.medium])
        .presentationDragIndicator(.visible)
    }
}
