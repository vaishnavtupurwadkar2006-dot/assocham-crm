'use client'

import Link from 'next/link'
import { CreditCard, Layers } from 'lucide-react'

export default function ImportPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-zinc-900 dark:text-white font-semibold text-lg md:text-xl">Import Contacts</h1>
        <p className="text-zinc-550 dark:text-zinc-400 text-xs md:text-sm font-medium mt-0.5">
          Choose how you want to add contacts to your database.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Link href="/import/business-card"
          className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500 dark:hover:border-indigo-550 rounded-lg p-6 shadow-sm hover:shadow-md transition space-y-4">
          <div className="w-12 h-12 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/60 transition">
            <CreditCard className="w-5 h-5 text-indigo-650 dark:text-indigo-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-zinc-900 dark:text-white font-semibold text-base">Business Card Scanner</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs md:text-sm leading-relaxed font-medium">
              Upload a photo of a business card. Gemini Vision AI extracts all contact details automatically.
            </p>
          </div>
          <div className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">
            AI-Powered Extraction →
          </div>
        </Link>

        <Link href="/import/bulk"
          className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-violet-500 dark:hover:border-violet-550 rounded-lg p-6 shadow-sm hover:shadow-md transition space-y-4">
          <div className="w-12 h-12 rounded-lg bg-violet-50 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-900/50 flex items-center justify-center group-hover:bg-violet-100 dark:group-hover:bg-violet-900/60 transition">
            <Layers className="w-5 h-5 text-violet-650 dark:text-violet-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-zinc-900 dark:text-white font-semibold text-base">Bulk Card Import</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs md:text-sm leading-relaxed font-medium">
              Import 100+ business cards at once with batch AI extraction and progress tracking.
            </p>
          </div>
          <div className="inline-flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 font-bold uppercase tracking-wider">
            Batch Processing →
          </div>
        </Link>
      </div>
    </div>
  )
}
