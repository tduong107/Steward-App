import {
  renderArticleOgImage,
  ogImageSize,
  ogImageContentType,
} from '../_og/render'

export const alt =
  'Best Campsite Tracker: Yosemite & National Parks — guide to snagging sold-out reservations'
export const size = ogImageSize
export const contentType = ogImageContentType

export default function OgImage() {
  return renderArticleOgImage({
    title: 'Best Campsite Tracker: Yosemite & National Parks',
    category: 'Guide',
  })
}
