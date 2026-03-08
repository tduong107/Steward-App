import UIKit
import SwiftUI
import UniformTypeIdentifiers

/// Share Extension entry point — presents a compact SwiftUI modal
/// that lets users create a watch directly from the share sheet.
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
                onComplete: { [weak self] _ in
                    self?.extensionContext?.completeRequest(returningItems: nil)
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
