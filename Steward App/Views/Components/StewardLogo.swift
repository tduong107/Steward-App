import SwiftUI

/// Reusable branded logo mark that renders the Steward app icon at any size.
/// Uses the raster asset from the new brand identity (Lora serif S, shield, spark).
struct StewardLogo: View {
    let size: CGFloat

    var body: some View {
        Image("StewardLogoImage")
            .resizable()
            .interpolation(.high)
            .aspectRatio(contentMode: .fit)
            .frame(width: size, height: size)
            .clipShape(RoundedRectangle(cornerRadius: size * 0.2188)) // 224/1024 ratio from SVG
    }
}
