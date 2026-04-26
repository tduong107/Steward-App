/**
 * Shared landing-page tokens. Pure data — no JSX, no client APIs —
 * so this can be imported by both Server Components and Client
 * Components without forcing a 'use client' boundary.
 */

export const S = {
  mint: '#6EE7B7',
  forest: '#0F2018',
  green: '#1C3D2E',
  green2: '#2A5C45',
  gold: '#F59E0B',
  cream: '#F7F6F3',
  bg: '#080A08',
  serif: 'Georgia, "Times New Roman", serif',
  textDim: 'rgba(247,246,243,0.55)',
  textFaint: 'rgba(247,246,243,0.35)',
  border: 'rgba(255,255,255,0.06)',
  borderMint: 'rgba(110,231,183,0.18)',
  cardBg: 'rgba(255,255,255,0.02)',
} as const

export const APP_STORE_URL =
  'https://apps.apple.com/us/app/steward-concierge/id6760180137'

export const NAV_LINKS = [
  ['#how-it-works', 'How it Works'],
  ['#why-steward', 'Why Steward'],
  ['#pricing', 'Pricing'],
] as const
