export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-[var(--color-bg)] px-6">
      {children}
    </div>
  )
}
