'use client'

import Link from 'next/link'
import { Calendar, AlertCircle, Clock, ArrowRight } from 'lucide-react'
import type { FollowUpSummary } from '@/types'

interface FollowUpWidgetProps {
  data?: FollowUpSummary
  isLoading?: boolean
}

export default function FollowUpWidget({ data, isLoading }: FollowUpWidgetProps) {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 animate-pulse space-y-3 shadow-sm h-full">
        <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-1/3" />
        {[1, 2, 3].map(i => <div key={i} className="h-12 bg-zinc-100 dark:bg-zinc-800 rounded-lg" />)}
      </div>
    )
  }

  const overdue = data?.overdue || []
  const dueToday = data?.due_today || []
  const dueWeek = data?.due_this_week || []
  const total = overdue.length + dueToday.length + dueWeek.length

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm transition-colors flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
        <h3 className="text-zinc-850 dark:text-white font-semibold text-sm flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          Follow-Ups
        </h3>
        <Link href="/follow-ups" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-xs font-semibold flex items-center gap-1">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="p-5 space-y-4 flex-1">
        {total === 0 ? (
          <p className="text-zinc-400 dark:text-zinc-500 text-xs font-medium text-center py-8">No follow-ups due.</p>
        ) : (
          <div className="space-y-3">
            {overdue.length > 0 && (
              <Section
                icon={<AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
                label="Overdue"
                count={overdue.length}
                color="red"
                items={overdue.slice(0, 3)}
              />
            )}
            {dueToday.length > 0 && (
              <Section
                icon={<Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
                label="Due Today"
                count={dueToday.length}
                color="yellow"
                items={dueToday.slice(0, 3)}
              />
            )}
            {dueWeek.length > 0 && (
              <Section
                icon={<Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                label="This Week"
                count={dueWeek.length}
                color="blue"
                items={dueWeek.slice(0, 3)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Section({ icon, label, count, color, items }: {
  icon: React.ReactNode
  label: string
  count: number
  color: 'red' | 'yellow' | 'blue'
  items: { contact_id: string; name?: string; company?: string; followup_date: string }[]
}) {
  const bg = { 
    red: 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30', 
    yellow: 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30', 
    blue: 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/30' 
  }[color]
  
  const text = { 
    red: 'text-rose-700 dark:text-rose-400', 
    yellow: 'text-amber-700 dark:text-amber-400', 
    blue: 'text-indigo-700 dark:text-indigo-400' 
  }[color]

  return (
    <div className={`rounded-lg border p-3 transition-colors ${bg}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className={`text-xs font-bold uppercase tracking-wider ${text}`}>{label}</span>
        </div>
        <span className={`text-xs font-extrabold ${text}`}>{count}</span>
      </div>
      <div className="space-y-1.5">
        {items.map(item => (
          <Link
            key={item.contact_id}
            href={`/contacts/${item.contact_id}`}
            className="flex items-center justify-between group"
          >
            <span className="text-zinc-700 dark:text-zinc-355 text-xs group-hover:text-zinc-950 dark:group-hover:text-white transition truncate max-w-[160px] font-medium">
              {item.name || item.company || item.contact_id}
            </span>
            <span className="text-zinc-400 dark:text-zinc-500 text-[10px] font-medium flex-shrink-0 ml-2">
              {new Date(item.followup_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
