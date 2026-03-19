'use client'

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

interface PriceHistoryChartProps {
  data: { date: string; price: number }[]
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatPrice(value: number): string {
  return `$${value.toFixed(2)}`
}

interface CustomTooltipProps {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length || !label) return null

  return (
    <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg-card)] px-3 py-2 shadow-md">
      <p className="text-xs text-[var(--color-ink-mid)]">{formatDate(label)}</p>
      <p className="text-sm font-semibold text-[var(--color-ink)]">
        {formatPrice(payload[0].value)}
      </p>
    </div>
  )
}

export function PriceHistoryChart({ data }: PriceHistoryChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-card)]">
        <div className="text-center">
          <p className="text-2xl">📊</p>
          <p className="mt-1 text-sm text-[var(--color-ink-mid)]">No price history yet</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-48 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-card)] p-3">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.2} />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-border)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 11, fill: 'var(--color-ink-light)' }}
            axisLine={{ stroke: 'var(--color-border)' }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={formatPrice}
            tick={{ fontSize: 11, fill: 'var(--color-ink-light)' }}
            axisLine={false}
            tickLine={false}
            width={55}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="price"
            stroke="var(--color-accent)"
            strokeWidth={2}
            fill="url(#priceGradient)"
            dot={false}
            activeDot={{
              r: 4,
              fill: 'var(--color-accent)',
              stroke: 'var(--color-bg-card)',
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
