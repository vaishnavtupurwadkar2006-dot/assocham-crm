'use client'
// src/components/business-card/BulkProgress.tsx
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import type { BulkExtractionResult } from '@/types'

interface BulkProgressProps {
  total: number
  processed: number
  results: BulkExtractionResult[]
  isRunning: boolean
}

export default function BulkProgress({ total, processed, results, isRunning }: BulkProgressProps) {
  const succeeded = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  const pct = total > 0 ? Math.round((processed / total) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">
            {isRunning ? `Processing card ${processed} of ${total}...` : `Completed — ${processed} of ${total} processed`}
          </span>
          <span className="text-white font-medium">{pct}%</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-800 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-white">{total}</p>
          <p className="text-gray-400 text-xs mt-0.5">Total</p>
        </div>
        <div className="bg-green-900/20 border border-green-800/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-400">{succeeded}</p>
          <p className="text-gray-400 text-xs mt-0.5">Extracted</p>
        </div>
        <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-red-400">{failed}</p>
          <p className="text-gray-400 text-xs mt-0.5">Failed</p>
        </div>
      </div>

      {/* Result list */}
      {results.length > 0 && (
        <div className="max-h-60 overflow-y-auto space-y-1.5">
          {results.map(r => (
            <div
              key={r.card_index}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                r.success ? 'bg-green-900/10 border border-green-900/30' : 'bg-red-900/10 border border-red-900/30'
              }`}
            >
              {r.success
                ? <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              }
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white truncate">
                  Card #{r.card_index + 1}
                  {r.extracted?.name && ` — ${r.extracted.name}`}
                  {r.extracted?.company && `, ${r.extracted.company}`}
                </p>
                {r.error && <p className="text-xs text-red-400 truncate">{r.error}</p>}
              </div>
            </div>
          ))}
          {isRunning && (
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700">
              <Loader2 className="w-4 h-4 text-blue-400 animate-spin flex-shrink-0" />
              <p className="text-sm text-gray-400">Processing next card...</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
