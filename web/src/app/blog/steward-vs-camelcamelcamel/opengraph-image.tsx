import {
  renderArticleOgImage,
  ogImageSize,
  ogImageContentType,
} from '../_og/render'

export const alt =
  'Steward vs CamelCamelCamel: Not Just Amazon — comparison of price tracking apps'
export const size = ogImageSize
export const contentType = ogImageContentType

export default function OgImage() {
  return renderArticleOgImage({
    title: 'Steward vs CamelCamelCamel: Not Just Amazon',
    category: 'Comparison',
  })
}
