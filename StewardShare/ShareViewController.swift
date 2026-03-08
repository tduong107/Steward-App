import UIKit
import SwiftUI
import UniformTypeIdentifiers

/// Share Extension entry point — presents a compact SwiftUI modal
/// that saves the shared URL to App Groups for the main app to pick up.
class ShareViewController: UIViewController {

    override func viewDidLoad() {
        super.viewDidLoad()

        guard let extensionItem = extensionContext?.inputItems.first as? NSExtensionItem,
              let attachments = extensionItem.attachments else {
            close()
            return
        }

        let hostingController = UIHostingController(
            rootView: ShareExtensionView(
                attachments: attachments,
                onComplete: { [weak self] url in
                    self?.saveAndDismiss(url: url)
                },
                onCancel: { [weak self] in
                    self?.close()
                }
            )
        )

        addChild(hostingController)
        view.addSubview(hostingController.view)
        hostingController.view.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            hostingController.view.topAnchor.constraint(equalTo: view.topAnchor),
            hostingController.view.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            hostingController.view.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            hostingController.view.trailingAnchor.constraint(equalTo: view.trailingAnchor),
        ])
        hostingController.didMove(toParent: self)

        view.backgroundColor = .clear
        hostingController.view.backgroundColor = .clear
    }

    // MARK: - Actions

    private func saveAndDismiss(url: String) {
        if let defaults = UserDefaults(suiteName: "group.Steward.Steward-App") {
            defaults.set(url, forKey: "pendingSharedURL")
            defaults.set(Date().timeIntervalSince1970, forKey: "pendingSharedURLTimestamp")
        }
        extensionContext?.completeRequest(returningItems: nil)
    }

    private func close() {
        extensionContext?.cancelRequest(
            withError: NSError(
                domain: "com.steward.share",
                code: 0,
                userInfo: [NSLocalizedDescriptionKey: "Share cancelled"]
            )
        )
    }
}
