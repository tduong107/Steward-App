// Twitter/X uses og:image as a fallback, but defining a dedicated
// twitter-image yields better preview behavior on iOS Twitter, X
// for web, and some embedders. Identical layout to opengraph-image.
export {
  default,
  alt,
  size,
  contentType,
} from './opengraph-image'
