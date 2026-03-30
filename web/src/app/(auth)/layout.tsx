import Image from 'next/image'
import Link from 'next/link'

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
    </div>
  )
}
