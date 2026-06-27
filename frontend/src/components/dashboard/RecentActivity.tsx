'use client'

import Link from 'next/link'
import { ArrowRight, CreditCard, UserPlus, Globe } from 'lucide-react'
import type { RecentContactItem } from '@/types'

const SOURCE_ICON: Record<string, React.ReactNode> = {
  'Business Card': <CreditCard className="w-3.5 h-3.5" />,
  'Manual Entry': <UserPlus className="w-3.5 h-3.5" />,
  'Excel Import': <Globe className="w-3.5 h-3.5" />,
}

function sourceIcon(src?: string) {
  return src ? (SOURCE_ICON[src] || <UserPlus className="w-3.5 h-3.5" />) : <UserPlus className="w-3.5 h-3.5" />
}

function relativeDate(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return `${diff}d ago`
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

interface RecentActivityProps {
  items: RecentContactItem[]
  isLoading?: boolean
}

export default function RecentActivity({ items, isLoading }: RecentActivityProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm transition-colors flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
        <h3 className="text-zinc-850 dark:text-white font-semibold text-sm">Recent Contacts</h3>
        <Link href="/contacts" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-xs font-semibold flex items-center gap-1 transition">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="divide-y divide-zinc-100 dark:divide-zinc-800 flex-1">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-5 py-3.5 animate-pulse flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-1/3" />
                  <div className="h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded w-1/4" />
                </div>
              </div>
            ))
          : items.length === 0
          ? (
              <div className="px-5 py-8 text-center text-zinc-400 dark:text-zinc-500 text-xs font-medium">
                No contacts yet. Import your first business card!
              </div>
            )
          : items.map(item => (
              <Link
                key={item.contact_id}
                href={`/contacts/${item.contact_id}`}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition group"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center flex-shrink-0">
                  <span className="text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                    {(item.name || item.company || '?').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-zinc-900 dark:text-white text-sm font-semibold truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                    {item.name || '—'}
                  </p>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs truncate font-medium">{item.company}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {item.source_type && (
                    <span className="flex items-center gap-1 text-zinc-400 dark:text-zinc-500 text-xs font-medium">
                      {sourceIcon(item.source_type)}
                    </span>
                  )}
                  <span className="text-zinc-400 dark:text-zinc-500 text-xs font-medium">{relativeDate(item.date_added)}</span>
                </div>
              </Link>
            ))
        }
      </div>
    </div>
  )
}
