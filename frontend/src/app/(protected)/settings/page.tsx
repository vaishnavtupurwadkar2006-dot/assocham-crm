'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import { getHealth } from '@/lib/api'
import { CheckCircle, XCircle, Server } from 'lucide-react'

export default function SettingsPage() {
  const { user } = useAuth()
  const { data: health } = useQuery({ queryKey: ['health'], queryFn: getHealth })

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-zinc-900 dark:text-white font-semibold text-lg md:text-xl">Settings</h1>

      {/* Profile */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 space-y-4 shadow-sm transition-colors">
        <h2 className="text-zinc-900 dark:text-white font-semibold text-sm border-b border-zinc-100 dark:border-zinc-800 pb-2.5">Your Account</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-zinc-400 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1">Name</p>
            <p className="text-zinc-900 dark:text-zinc-200 font-semibold">{user?.name}</p>
          </div>
          <div>
            <p className="text-zinc-400 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1">Email</p>
            <p className="text-zinc-900 dark:text-zinc-200 font-semibold">{user?.email}</p>
          </div>
          <div>
            <p className="text-zinc-400 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1">Role</p>
            <p className="text-zinc-900 dark:text-zinc-200 font-semibold">{user?.role}</p>
          </div>
          <div>
            <p className="text-zinc-400 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1">Department</p>
            <p className="text-zinc-900 dark:text-zinc-200 font-semibold">{user?.department || '—'}</p>
          </div>
        </div>
        <p className="text-zinc-400 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-wider pt-2 border-t border-zinc-100 dark:border-zinc-800">To change your password, contact an Admin.</p>
      </div>

      {/* System status */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 space-y-4 shadow-sm transition-colors">
        <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
          <Server className="w-4.5 h-4.5 text-zinc-400" />
          <h2 className="text-zinc-900 dark:text-white font-semibold text-sm">System Status</h2>
        </div>
        {health ? (
          <div className="space-y-3">
            <StatusRow label="API Server" ok={health.status === 'healthy'} />
            <StatusRow label="Google Sheets" ok={!!health.google_sheets_configured} value={health.google_sheets_configured ? 'Connected' : 'Not configured'} />
            <StatusRow label="Gemini AI" ok={!!health.gemini_configured} value={health.gemini_configured ? 'Ready' : 'No API key'} />
            <StatusRow label="Data Source" ok value={String(health.data_source)} />
          </div>
        ) : (
          <p className="text-zinc-400 dark:text-zinc-500 text-xs font-semibold">Loading...</p>
        )}
      </div>

      {/* About */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 space-y-2 shadow-sm transition-colors">
        <h2 className="text-zinc-900 dark:text-white font-semibold text-sm border-b border-zinc-100 dark:border-zinc-800 pb-2.5">About</h2>
        <p className="text-zinc-800 dark:text-zinc-200 text-sm font-semibold pt-1">ASSOCHAM AI Contact Intelligence Platform v2.0</p>
        <p className="text-zinc-405 dark:text-zinc-500 text-xs font-medium">Powered by Gemini Vision AI · Google Sheets · FastAPI · Next.js 15</p>
      </div>
    </div>
  )
}

function StatusRow({ label, ok, value }: { label: string; ok: boolean; value?: string }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-zinc-750 dark:text-zinc-300 text-xs font-semibold">{label}</span>
      <div className="flex items-center gap-1.5">
        {ok ? (
          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-450" />
        ) : (
          <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-450" />
        )}
        <span className={`text-xs font-bold uppercase tracking-wider ${ok ? 'text-emerald-600 dark:text-emerald-450' : 'text-rose-600 dark:text-rose-450'}`}>
          {value || (ok ? 'OK' : 'Error')}
        </span>
      </div>
    </div>
  )
}
