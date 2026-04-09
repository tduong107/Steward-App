import Image from 'next/image'
import Link from 'next/link'

const APP_STORE_URL = 'https://apps.apple.com/us/app/steward-concierge/id6760180137'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-12" style={{ background: 'radial-gradient(ellipse 80% 70% at 50% 40%, rgba(15,32,24,0.7) 0%, #080A08 70%)' }}>
      {/* Logo */}
      <Link href="/" className="flex flex-col items-center mb-8 group">
        <Image
          src="/steward-logo.png"
          alt="Steward"
          width={72}
          height={72}
          className="rounded-2xl mb-4 transition-transform duration-300 group-hover:scale-105"
        />
        <h1 className="text-2xl font-bold tracking-[0.25em] uppercase text-[#F7F6F3] font-[var(--font-serif)]">
          Steward
        </h1>
        <p className="text-sm text-[#6EE7B7]/60 mt-1">Your personal AI concierge</p>
      </Link>

      {children}

      {/* iOS App CTA */}
      <div className="mt-8 flex flex-col items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="h-px w-8 bg-[#2A5C45]/40" />
          <span className="text-xs text-[#F7F6F3]/25">or</span>
          <div className="h-px w-8 bg-[#2A5C45]/40" />
        </div>
        <a
          href={APP_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-3 rounded-xl border border-[#2A5C45]/30 bg-[#1C3D2E]/20 px-5 py-3 transition-all duration-300 hover:border-[#6EE7B7]/30 hover:bg-[#1C3D2E]/40"
        >
          <svg className="h-5 w-5 text-[#6EE7B7]/60 group-hover:text-[#6EE7B7] transition-colors" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          <div className="flex flex-col">
            <span className="text-[10px] text-[#F7F6F3]/30 leading-tight">Get it on the</span>
            <span className="text-sm font-semibold text-[#F7F6F3]/70 group-hover:text-[#F7F6F3] transition-colors leading-tight">App Store</span>
          </div>
        </a>
      </div>
    </div>
  )
}
