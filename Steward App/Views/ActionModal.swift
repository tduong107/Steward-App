import SwiftUI

struct ActionModal: View {
    let watch: Watch
    @Environment(WatchViewModel.self) private var viewModel

    var body: some View {
        ZStack(alignment: .bottom) {
            Color.black.opacity(0.45)
                .ignoresSafeArea()
                .onTapGesture {
                    if viewModel.actionState != .running {
                        viewModel.dismissAction()
                    }
                }

            VStack(spacing: 0) {
                RoundedRectangle(cornerRadius: 2)
                    .fill(Theme.border)
                    .frame(width: 40, height: 4)
                    .padding(.top, 12)
                    .padding(.bottom, 24)

                switch viewModel.actionState {
                case .idle:
                    idleContent
                case .running:
                    runningContent
                case .done:
                    doneContent
                }
            }
            .background(Theme.bgCard)
            .clipShape(RoundedRectangle(cornerRadius: Theme.radiusXL))
            .shadow(color: .black.opacity(0.15), radius: 24, y: -4)
            .transition(.move(edge: .bottom))
        }
        .ignoresSafeArea(edges: .bottom)
    }

    // MARK: - Idle State

    private var idleContent: some View {
        VStack(spacing: 20) {
            // Icon
            VStack(spacing: 14) {
                Image(systemName: "sparkle")
                    .font(.system(size: 28))
                    .foregroundStyle(Theme.accent)
                    .frame(width: 64, height: 64)
                    .background(Theme.accentLight)
                    .clipShape(RoundedRectangle(cornerRadius: 20))
                    .overlay(
                        RoundedRectangle(cornerRadius: 20)
                            .stroke(Theme.accentMid, lineWidth: 1)
                    )

                Text("Steward is ready to act")
                    .font(Theme.serif(19, weight: .bold))
                    .foregroundStyle(Theme.ink)

                Text("Confirm and I'll handle this for you")
                    .font(Theme.body(13))
                    .foregroundStyle(Theme.inkMid)
            }

            // Info card
            VStack(spacing: 0) {
                infoRow(label: "Page", value: watch.name, isLast: false)
                infoRow(label: "Change detected", value: watch.changeNote ?? "", isLast: false, highlight: true)
                infoRow(label: "Action", value: watch.actionLabel, isLast: true)
            }
            .background(Theme.bg)
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .stroke(Theme.border, lineWidth: 1)
            )
            .padding(.horizontal, 24)

            // Buttons
            HStack(spacing: 10) {
                Button {
                    viewModel.dismissAction()
                } label: {
                    Text("Not now")
                        .font(Theme.body(14, weight: .semibold))
                        .foregroundStyle(Theme.inkMid)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Theme.bg)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                        .overlay(
                            RoundedRectangle(cornerRadius: 14)
                                .stroke(Theme.border, lineWidth: 1)
                        )
                }

                Button {
                    viewModel.runAction()
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: "sparkle")
                            .font(.system(size: 12))
                        Text("Confirm Action")
                            .font(Theme.body(14, weight: .bold))
                    }
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(Theme.accent)
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                    .shadow(color: Theme.accent.opacity(0.25), radius: 12, y: 4)
                }
                .frame(maxWidth: .infinity)
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 40)
        }
    }

    // MARK: - Running State

    private var runningContent: some View {
        VStack(spacing: 20) {
            ProgressView()
                .controlSize(.large)
                .tint(Theme.accent)
                .scaleEffect(1.4)
                .padding(.top, 24)

            Text("Steward is working…")
                .font(Theme.serif(17, weight: .semibold))
                .foregroundStyle(Theme.ink)

            VStack(spacing: 4) {
                Text("Navigating to \(watch.url)")
                    .font(Theme.body(13))
                    .foregroundStyle(Theme.inkLight)

                Text("Completing action on your behalf")
                    .font(Theme.body(13))
                    .foregroundStyle(Theme.inkLight)
            }
            .padding(.bottom, 40)
        }
    }

    // MARK: - Done State

    private var doneContent: some View {
        VStack(spacing: 16) {
            Image(systemName: "checkmark")
                .font(.system(size: 26, weight: .semibold))
                .foregroundStyle(Theme.accent)
                .frame(width: 64, height: 64)
                .background(Theme.accentLight)
                .clipShape(Circle())
                .overlay(
                    Circle()
                        .stroke(Theme.accentMid, lineWidth: 1.5)
                )
                .padding(.top, 20)

            Text("Done — consider it handled.")
                .font(Theme.serif(18, weight: .bold))
                .foregroundStyle(Theme.ink)

            Text("Steward successfully completed \"\(watch.actionLabel)\"")
                .font(Theme.body(13))
                .foregroundStyle(Theme.inkMid)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 24)

            Button {
                viewModel.dismissAction()
            } label: {
                Text("Back to home")
                    .font(Theme.body(14, weight: .bold))
                    .foregroundStyle(Theme.accent)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(Theme.accentLight)
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                    .overlay(
                        RoundedRectangle(cornerRadius: 14)
                            .stroke(Theme.accentMid, lineWidth: 1)
                    )
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 40)
        }
    }

    // MARK: - Info Row

    private func infoRow(label: String, value: String, isLast: Bool, highlight: Bool = false) -> some View {
        VStack(spacing: 0) {
            HStack {
                Text(label)
                    .font(Theme.body(12))
                    .foregroundStyle(Theme.inkLight)

                Spacer()

                Text(value)
                    .font(Theme.body(12, weight: .semibold))
                    .foregroundStyle(highlight ? Theme.accent : Theme.ink)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 10)

            if !isLast {
                Divider().foregroundStyle(Theme.border)
            }
        }
    }
}
