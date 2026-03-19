import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-[var(--radius-md)] bg-[var(--color-bg-deep)]',
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
