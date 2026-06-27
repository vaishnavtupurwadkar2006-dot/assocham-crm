'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { AlertTriangle, Mail, Phone, Linkedin, Tag, Copy } from 'lucide-react'
import { getDataQuality } from '@/lib/api'
import { useState } from 'react'

export default function DataQualityPage() {
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

  const { data: qualityRes, isLoading } = useQuery({
    queryKey: ['data-quality'],
    queryFn: getDataQuality,
    refetchInterval: 120_000,
  })

  const q = qualityRes?.data

  const ISSUES = [
    {
      key: 'missing_email',
      label: 'Missing Email',
      icon: <Mail className="w-5 h-5" />,
      count: q?.missing_email ?? 0,
      color: 'red' as const,
    },
    {
      key: 'missing_phone',
      label: 'Missing Phone',
      icon: <Phone className="w-5 h-5" />,
      count: q?.missing_phone ?? 0,
      color: 'orange' as const,
    },
    {
      key: 'missing_linkedin',
      label: 'Missing LinkedIn',
      icon: <Linkedin className="w-5 h-5" />,
      count: q?.missing_linkedin ?? 0,
      color: 'blue' as const,
    },
    {
      key: 'missing_sector',
      label: 'Missing Sector',
      icon: <Tag className="w-5 h-5" />,
      count: q?.missing_sector ?? 0,
      color: 'yellow' as const,
    },
    {
      key: 'potential_duplicates',
      label: 'Potential Duplicates',
      icon: <Copy className="w-5 h-5" />,
      count: q?.potential_duplicates ?? 0,
      color: 'purple' as const,
    },
  ]

  const colorMap = {
    red: 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-400',
    orange: 'bg-amber-50 dark:bg-amber-955/20 border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-400',
    blue: 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/40 text-indigo-750 dark:text-indigo-400',
    yellow: 'bg-amber-50 dark:bg-amber-955/20 border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-400',
    purple: 'bg-purple-50 dark:bg-purple-955/20 border-purple-200 dark:border-purple-900/40 text-purple-750 dark:text-purple-400',
  }

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse max-w-7xl mx-auto">
        <div className="h-8 bg-zinc-100 dark:bg-zinc-800 rounded w-1/4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-24 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-zinc-900 dark:text-white font-semibold text-lg md:text-xl">Data Quality</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-xs md:text-sm font-medium">Identify and fix gaps in your contact database.</p>
      </div>

      {/* Issue cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {ISSUES.map(issue => (
          <div
            key={issue.key}
            className={`border rounded-lg p-4 cursor-pointer transition hover:scale-[1.02] shadow-sm ${colorMap[issue.color]} ${activeFilter === issue.key ? 'ring-2 ring-indigo-500/50 dark:ring-indigo-400/50' : ''}`}
            onClick={() => setActiveFilter(activeFilter === issue.key ? null : issue.key)}
          >
            <div className="mb-2 opacity-80">{issue.icon}</div>
            <p className="text-2xl font-bold">{issue.count}</p>
            <p className="text-xs mt-0.5 opacity-80 font-bold uppercase tracking-wider">{issue.label}</p>
          </div>
        ))}
      </div>

      {/* Incomplete contacts list */}
      {q && q.incomplete_contacts.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm overflow-hidden transition-colors">
          <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-505 dark:text-amber-400" />
            <h2 className="text-zinc-900 dark:text-white font-semibold text-sm">
              Contacts Missing Multiple Fields
            </h2>
            <span className="ml-auto text-xs font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider">{q.incomplete_contacts.length} contacts</span>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
            {q.incomplete_contacts.map(c => (
              <div key={c.contact_id} className="flex items-center gap-4 px-5 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition">
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/contacts/${c.contact_id}`}
                    className="text-zinc-900 dark:text-white text-sm font-semibold hover:text-indigo-650 dark:hover:text-indigo-400 transition truncate block"
                  >
                    {c.name || '—'}
                  </Link>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs truncate font-medium">{c.company}</p>
                </div>
                <div className="flex flex-wrap gap-1.5 justify-end">
                  {c.missing_fields.map(f => (
                    <span key={f} className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full">
                      {f}
                    </span>
                  ))}
                </div>
                <Link
                  href={`/contacts/${c.contact_id}/edit`}
                  className="flex-shrink-0 px-3 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-lg shadow-sm transition"
                >
                  Fix
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {q && q.incomplete_contacts.length === 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-5 py-10 text-center shadow-sm">
          <p className="text-emerald-600 dark:text-emerald-400 font-bold">Great data quality!</p>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1 font-semibold">All contacts have at least 3 of the key fields filled in.</p>
        </div>
      )}
    </div>
  )
}
