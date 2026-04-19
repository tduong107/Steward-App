import SwiftUI

/// A drop-in replacement for `AsyncImage` that caches downloaded images in memory.
/// Avoids re-downloading product thumbnails on every view appear.
struct CachedAsyncImage<Content: View, Placeholder: View>: View {
    let url: URL?
    let content: (Image) -> Content
    let placeholder: () -> Placeholder

    @State private var uiImage: UIImage?
    @State private var failed = false

    init(
        url: URL?,
        @ViewBuilder content: @escaping (Image) -> Content,
        @ViewBuilder placeholder: @escaping () -> Placeholder
    ) {
        self.url = url
        self.content = content
        self.placeholder = placeholder
    }

    var body: some View {
        Group {
            if let uiImage {
                content(Image(uiImage: uiImage))
            } else {
                placeholder()
            }
        }
        .task(id: url) {
            guard let url, !failed else { return }
            // Check cache first
            if let cached = ImageCache.shared[url] {
                uiImage = cached
                return
            }
            // Download once, cache, and display
            do {
                let (data, _) = try await URLSession.shared.data(from: url)
                guard let image = UIImage(data: data) else { failed = true; return }
                ImageCache.shared[url] = image
                uiImage = image
            } catch {
                failed = true
            }
        }
    }
}

/// Thread-safe in-memory image cache using NSCache (auto-evicts under memory pressure).
final class ImageCache: @unchecked Sendable {
    static let shared = ImageCache()

    private let cache = NSCache<NSURL, UIImage>()

    private init() {
        cache.countLimit = 100
        cache.totalCostLimit = 50 * 1024 * 1024 // 50 MB
    }

    subscript(url: URL) -> UIImage? {
        get { cache.object(forKey: url as NSURL) }
        set {
            if let newValue {
                let cost = newValue.jpegData(compressionQuality: 1)?.count ?? 0
                cache.setObject(newValue, forKey: url as NSURL, cost: cost)
            } else {
                cache.removeObject(forKey: url as NSURL)
            }
        }
    }
}
