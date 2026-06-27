'use client'

import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: number | string
  subtitle?: string
  icon: React.ReactNode
  trend?: { value: number; label: string }
  color?: 'blue' | 'green' | 'yellow' | 'purple' | 'red' | 'cyan'
}

const COLOR_MAP = {
  blue:   { icon: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400' },
  green:  { icon: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' },
  yellow: { icon: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400' },
  purple: { icon: 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400' },
  red:    { icon: 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400' },
  cyan:   { icon: 'bg-cyan-50 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-400' },
}

export default function StatCard({ title, value, subtitle, icon, trend, color = 'blue' }: StatCardProps) {
  const colors = COLOR_MAP[color]
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 shadow-sm transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-zinc-950 dark:text-white mt-1">{value}</p>
          {subtitle && <p className="text-zinc-500 dark:text-zinc-400 text-[11px] mt-1 font-medium">{subtitle}</p>}
          {trend && (
            <p className={cn('text-xs mt-1 font-medium flex items-center gap-1', trend.value >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
              <span>{trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}</span>
              <span className="text-zinc-400 dark:text-zinc-500 font-normal">{trend.label}</span>
            </p>
          )}
        </div>
        <div className={cn('w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0', colors.icon)}>
          {icon}
        </div>
      </div>
    </div>
  )
}
