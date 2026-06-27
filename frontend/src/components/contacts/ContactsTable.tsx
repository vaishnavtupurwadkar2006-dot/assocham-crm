'use client'

import Link from 'next/link'
import { ExternalLink, Mail, Phone } from 'lucide-react'
import type { Contact, PaginationMeta } from '@/types'

interface ContactsTableProps {
  contacts: Contact[]
  isLoading?: boolean
  meta?: PaginationMeta
  onPageChange?: (page: number) => void
}

const PRIORITY_BADGE: Record<string, string> = {
  High: 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/30',
  Medium: 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/30',
  Low: 'bg-zinc-50 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700',
}

export default function ContactsTable({ contacts, isLoading, meta, onPageChange }: ContactsTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden shadow-sm">
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="px-5 py-4 flex items-center gap-4 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-zinc-100 dark:bg-zinc-800 rounded w-1/4" />
                <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-1/5" />
              </div>
              <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (contacts.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-5 py-12 text-center shadow-sm">
        <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">No contacts found. Try adjusting your filters.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden shadow-sm transition-colors">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-[10px] font-bold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider">
          <div className="col-span-3">Name / Company</div>
          <div className="col-span-2">Sector</div>
          <div className="col-span-2">Location</div>
          <div className="col-span-3">Contact</div>
          <div className="col-span-1">Priority</div>
          <div className="col-span-1"></div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
          {contacts.map(c => (
            <div key={c.Contact_ID} className="grid grid-cols-12 gap-4 px-5 py-3.5 items-center hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition group">
              <div className="col-span-3 min-w-0">
                <Link href={`/contacts/${c.Contact_ID}`} className="text-zinc-900 dark:text-white font-semibold text-sm hover:text-indigo-600 dark:hover:text-indigo-400 transition truncate block">
                  {c.Name || '—'}
                </Link>
                <p className="text-zinc-550 dark:text-zinc-400 text-xs truncate mt-0.5 font-medium">{c.Designation || c.Company}</p>
                {c.Designation && <p className="text-zinc-400 dark:text-zinc-500 text-xs truncate font-medium">{c.Company}</p>}
              </div>
              <div className="col-span-2 min-w-0">
                <p className="text-zinc-650 dark:text-zinc-300 text-xs truncate font-medium">{c.Sector || '—'}</p>
                {c.Source_Type === 'Business Card' && (
                  <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-350 border border-indigo-100 dark:border-indigo-900/50 px-1.5 py-0.5 rounded font-bold mt-1 inline-block">
                    📇 Card
                  </span>
                )}
              </div>
              <div className="col-span-2 min-w-0">
                <p className="text-zinc-605 dark:text-zinc-300 text-xs truncate font-medium">{[c.City, c.State].filter(Boolean).join(', ') || '—'}</p>
              </div>
              <div className="col-span-3 space-y-1">
                {c.Email && (
                  <a href={`mailto:${c.Email}`} className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs transition truncate font-medium">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{c.Email}</span>
                  </a>
                )}
                {c.Phone && (
                  <a href={`tel:${c.Phone}`} className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs transition font-medium">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{c.Phone}</span>
                  </a>
                )}
              </div>
              <div className="col-span-1">
                {c.Contact_Priority && (
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${PRIORITY_BADGE[c.Contact_Priority] || PRIORITY_BADGE.Low}`}>
                    {c.Contact_Priority}
                  </span>
                )}
              </div>
              <div className="col-span-1 flex justify-end opacity-0 group-hover:opacity-100 transition">
                <Link href={`/contacts/${c.Contact_ID}`} className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition">
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Pagination */}
      {meta && meta.total_pages > 1 && (
        <div className="flex items-center justify-between mt-2 px-1">
          <p className="text-zinc-550 dark:text-zinc-400 text-xs font-medium">
            Showing {((meta.page - 1) * meta.page_size) + 1}–{Math.min(meta.page * meta.page_size, meta.total)} of {meta.total}
          </p>
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => onPageChange?.(meta.page - 1)} 
              disabled={meta.page === 1} 
              className="px-3 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-700 dark:text-zinc-300 rounded-lg transition font-medium"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-semibold bg-zinc-100 dark:bg-zinc-800/50 rounded-lg">
              {meta.page} / {meta.total_pages}
            </span>
            <button 
              onClick={() => onPageChange?.(meta.page + 1)} 
              disabled={meta.page === meta.total_pages} 
              className="px-3 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-700 dark:text-zinc-300 rounded-lg transition font-medium"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
