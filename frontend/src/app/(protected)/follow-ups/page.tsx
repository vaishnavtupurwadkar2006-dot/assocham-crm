'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Calendar, AlertCircle, Clock, CheckCircle } from 'lucide-react'
import { getFollowUps } from '@/lib/api'
import type { FollowUpItem } from '@/types'

export default function FollowUpsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['followups'],
    queryFn: getFollowUps,
    refetchInterval: 60_000,
  })

  const fu = data?.data

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 bg-zinc-100 dark:bg-zinc-800 rounded w-1/4" />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm" />
        ))}
      </div>
    )
  }

  const overdue = fu?.overdue || []
  const dueToday = fu?.due_today || []
  const dueWeek = fu?.due_this_week || []
  const total = overdue.length + dueToday.length + dueWeek.length

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-zinc-900 dark:text-white font-semibold text-lg md:text-xl">Follow-Up Manager</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-xs md:text-sm font-medium">{total} follow-up{total !== 1 ? 's' : ''} requiring attention</p>
      </div>

      {total === 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-5 py-12 text-center shadow-sm">
          <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-450 mx-auto mb-3" />
          <p className="text-zinc-900 dark:text-white font-bold">All caught up!</p>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1 font-semibold">No follow-ups due right now.</p>
        </div>
      )}

      {overdue.length > 0 && (
        <Section
          title="Overdue"
          icon={<AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-450" />}
          items={overdue}
          color="red"
        />
      )}
      {dueToday.length > 0 && (
        <Section
          title="Due Today"
          icon={<Clock className="w-4 h-4 text-amber-600 dark:text-amber-450" />}
          items={dueToday}
          color="yellow"
        />
      )}
      {dueWeek.length > 0 && (
        <Section
          title="Due This Week"
          icon={<Calendar className="w-4 h-4 text-indigo-650 dark:text-indigo-400" />}
          items={dueWeek}
          color="blue"
        />
      )}
    </div>
  )
}

function Section({
  title, icon, items, color,
}: {
  title: string
  icon: React.ReactNode
  items: FollowUpItem[]
  color: 'red' | 'yellow' | 'blue'
}) {
  const border = { 
    red: 'border-rose-200 dark:border-rose-900/30', 
    yellow: 'border-amber-200 dark:border-amber-900/30', 
    blue: 'border-indigo-150 dark:border-indigo-900/30' 
  }[color]
  
  const headerText = { 
    red: 'text-rose-700 dark:text-rose-400', 
    yellow: 'text-amber-700 dark:text-amber-400', 
    blue: 'text-indigo-700 dark:text-indigo-400' 
  }[color]

  return (
    <div className={`bg-white dark:bg-zinc-900 border rounded-lg overflow-hidden shadow-sm transition-colors ${border}`}>
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20">
        {icon}
        <h2 className={`font-bold text-xs uppercase tracking-wider ${headerText}`}>{title}</h2>
        <span className={`ml-auto text-xs font-extrabold ${headerText}`}>{items.length}</span>
      </div>
      <div className="divide-y divide-zinc-100 dark:divide-zinc-850">
        {items.map(item => (
          <Link
            key={item.contact_id}
            href={`/contacts/${item.contact_id}`}
            className="flex items-center gap-4 px-5 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition group"
          >
            <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center flex-shrink-0">
              <span className="text-zinc-600 dark:text-zinc-300 text-xs font-bold">
                {(item.name || item.company || '?').charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-zinc-900 dark:text-white text-sm font-semibold truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                {item.name || '—'}
              </p>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs truncate font-medium">{item.company}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-zinc-800 dark:text-zinc-200 text-xs font-semibold">
                {new Date(item.followup_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              <p className={`text-xs mt-0.5 font-medium ${item.is_overdue ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-zinc-400 dark:text-zinc-500'}`}>
                {item.is_overdue
                  ? `${Math.abs(item.days_until)} day${Math.abs(item.days_until) !== 1 ? 's' : ''} overdue`
                  : item.days_until === 0 ? 'Today'
                  : `In ${item.days_until} day${item.days_until !== 1 ? 's' : ''}`}
              </p>
            </div>
            {item.phone && (
              <a
                href={`tel:${item.phone}`}
                onClick={e => e.stopPropagation()}
                className="ml-2 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-250 dark:hover:border-emerald-900 text-zinc-700 dark:text-zinc-300 hover:text-emerald-650 dark:hover:text-emerald-450 text-xs font-bold rounded-lg transition"
              >
                Call
              </a>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
