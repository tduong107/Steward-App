import SwiftUI
import WebKit

// MARK: - In-App Browser Sheet

struct InAppBrowser: View {
    let initialURL: URL
    let onUseURL: (String) -> Void
    @Environment(\.dismiss) private var dismiss

    @State private var currentURL: String = ""
    @State private var currentTitle: String = ""
    @State private var isLoading = true
    @State private var canGoBack = false
    @State private var canGoForward = false

    // WebView coordinator for navigation callbacks
    @State private var webViewStore = WebViewStore()

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // URL bar
                urlBar

                // WebView
                WebViewRepresentable(
                    url: initialURL,
                    store: webViewStore,
                    onURLChange: { url in
                        currentURL = url
                    },
                    onTitleChange: { title in
                        currentTitle = title
                    },
                    onLoadingChange: { loading in
                        isLoading = loading
                    },
                    onNavigationChange: { back, forward in
                        canGoBack = back
                        canGoForward = forward
                    }
                )

                // Bottom toolbar
                bottomToolbar
            }
            .background(Theme.bg)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") {
                        dismiss()
                    }
                    .font(Theme.body(14, weight: .medium))
                    .foregroundStyle(Theme.accent)
                }
            }
        }
    }

    // MARK: - URL Bar

    private var urlBar: some View {
        HStack(spacing: 8) {
            if isLoading {
                ProgressView()
                    .controlSize(.small)
            } else {
                Image(systemName: "lock.fill")
                    .font(.system(size: 10))
                    .foregroundStyle(Theme.inkLight)
            }

            Text(displayHost)
                .font(Theme.body(12))
                .foregroundStyle(Theme.ink)
                .lineLimit(1)
                .truncationMode(.middle)

            Spacer()
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 8)
        .background(Theme.bgDeep)
        .clipShape(RoundedRectangle(cornerRadius: 10))
        .padding(.horizontal, 16)
        .padding(.vertical, 8)
        .overlay(alignment: .bottom) {
            if isLoading {
                ProgressView()
                    .progressViewStyle(.linear)
                    .tint(Theme.accent)
            }
        }
    }

    private var displayHost: String {
        URL(string: currentURL)?.host ?? currentURL
    }

    // MARK: - Bottom Toolbar

    private var bottomToolbar: some View {
        VStack(spacing: 0) {
            Divider().foregroundStyle(Theme.border)

            // "Use this URL" button
            Button {
                onUseURL(currentURL.isEmpty ? initialURL.absoluteString : currentURL)
                dismiss()
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 16))
                    Text("Use this URL")
                        .font(Theme.body(14, weight: .bold))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(Theme.accent)
                .foregroundStyle(.white)
                .clipShape(RoundedRectangle(cornerRadius: 14))
            }
            .padding(.horizontal, 16)
            .padding(.top, 10)

            // Navigation controls
            HStack(spacing: 24) {
                Button {
                    webViewStore.webView?.goBack()
                } label: {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundStyle(canGoBack ? Theme.ink : Theme.inkLight.opacity(0.4))
                }
                .disabled(!canGoBack)

                Button {
                    webViewStore.webView?.goForward()
                } label: {
                    Image(systemName: "chevron.right")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundStyle(canGoForward ? Theme.ink : Theme.inkLight.opacity(0.4))
                }
                .disabled(!canGoForward)

                Spacer()

                Button {
                    webViewStore.webView?.reload()
                } label: {
                    Image(systemName: "arrow.clockwise")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundStyle(Theme.ink)
                }
            }
            .padding(.horizontal, 24)
            .padding(.vertical, 10)
            .padding(.bottom, 4)
        }
        .background(Theme.bgCard)
    }
}

// MARK: - WebView Store (shared reference to WKWebView)

@Observable
class WebViewStore {
    var webView: WKWebView?
}

// MARK: - WKWebView Representable

struct WebViewRepresentable: UIViewRepresentable {
    let url: URL
    let store: WebViewStore
    let onURLChange: (String) -> Void
    let onTitleChange: (String) -> Void
    let onLoadingChange: (Bool) -> Void
    let onNavigationChange: (Bool, Bool) -> Void

    func makeCoordinator() -> Coordinator {
        Coordinator(
            onURLChange: onURLChange,
            onTitleChange: onTitleChange,
            onLoadingChange: onLoadingChange,
            onNavigationChange: onNavigationChange
        )
    }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = true

        // Store reference for back/forward/reload
        DispatchQueue.main.async {
            store.webView = webView
        }

        webView.load(URLRequest(url: url))
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}

    class Coordinator: NSObject, WKNavigationDelegate {
        let onURLChange: (String) -> Void
        let onTitleChange: (String) -> Void
        let onLoadingChange: (Bool) -> Void
        let onNavigationChange: (Bool, Bool) -> Void

        init(
            onURLChange: @escaping (String) -> Void,
            onTitleChange: @escaping (String) -> Void,
            onLoadingChange: @escaping (Bool) -> Void,
            onNavigationChange: @escaping (Bool, Bool) -> Void
        ) {
            self.onURLChange = onURLChange
            self.onTitleChange = onTitleChange
            self.onLoadingChange = onLoadingChange
            self.onNavigationChange = onNavigationChange
        }

        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            onLoadingChange(true)
            if let url = webView.url?.absoluteString {
                onURLChange(url)
            }
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            onLoadingChange(false)
            if let url = webView.url?.absoluteString {
                onURLChange(url)
            }
            onTitleChange(webView.title ?? "")
            onNavigationChange(webView.canGoBack, webView.canGoForward)
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            onLoadingChange(false)
            onNavigationChange(webView.canGoBack, webView.canGoForward)
        }
    }
}
