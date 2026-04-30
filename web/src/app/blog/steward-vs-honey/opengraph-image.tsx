import {
  renderArticleOgImage,
  ogImageSize,
  ogImageContentType,
} from '../_og/render'

export const alt =
  'Steward vs Honey: Beyond Coupon Codes — comparison of price tracking apps'
export const size = ogImageSize
export const contentType = ogImageContentType

export default function OgImage() {
  return renderArticleOgImage({
    title: 'Steward vs Honey: Beyond Coupon Codes',
    category: 'Comparison',
  })
}
