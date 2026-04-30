import {
  renderArticleOgImage,
  ogImageSize,
  ogImageContentType,
} from '../_og/render'

export const alt =
  'Best Restaurant Reservation Tracker — guide to getting hard-to-book tables on Resy and OpenTable'
export const size = ogImageSize
export const contentType = ogImageContentType

export default function OgImage() {
  return renderArticleOgImage({
    title: 'Best Restaurant Reservation Tracker',
    category: 'Guide',
  })
}
