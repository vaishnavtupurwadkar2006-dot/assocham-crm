'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { BASE_URL } from '@/lib/api'
import { Shield, Plus, UserX } from 'lucide-react'

interface User {
  user_id: string; name: string; email: string; role: string; department?: string; status: string
}

async function fetchUsers(): Promise<{ success: boolean; data: User[] }> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('assocham_token') || '' : ''
  const res = await fetch(`${BASE_URL}/users`, { headers: { Authorization: `Bearer ${token}` }, credentials: 'include' })
  if (!res.ok) throw new Error('Failed to load users')
  return res.json()
}

async function createUser(data: Record<string, string>): Promise<void> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('assocham_token') || '' : ''
  const res = await fetch(`${BASE_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    credentials: 'include',
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to create user')
  }
}

async function deactivateUser(id: string): Promise<void> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('assocham_token') || '' : ''
  await fetch(`${BASE_URL}/users/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` }, credentials: 'include' })
}

const ROLE_BADGE: Record<string, string> = {
  Admin: 'bg-rose-50 dark:bg-rose-955/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/30',
  Staff: 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/30',
  Intern: 'bg-zinc-50 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700',
}

export default function AdminUsersPage() {
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Staff', department: '' })
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const { data, isLoading, isError } = useQuery({ queryKey: ['users'], queryFn: fetchUsers })

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [f]: e.target.value }))

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreateError('')
    setIsCreating(true)
    try {
      await createUser(form)
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setShowCreate(false)
      setForm({ name: '', email: '', password: '', role: 'Staff', department: '' })
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create user.')
    } finally {
      setIsCreating(false)
    }
  }

  async function handleDeactivate(id: string) {
    await deactivateUser(id)
    queryClient.invalidateQueries({ queryKey: ['users'] })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 flex items-center justify-center">
            <Shield className="w-5 h-5 text-rose-700 dark:text-rose-400" />
          </div>
          <div>
            <h1 className="text-zinc-900 dark:text-white font-semibold text-lg md:text-xl">User Management</h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider mt-0.5">Admin only</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-sm transition"
        >
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 shadow-sm transition-colors">
          <h3 className="text-zinc-900 dark:text-white font-semibold text-sm mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-2.5">Create New User</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input required placeholder="Full Name" value={form.name} onChange={set('name')}
              className="px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition placeholder-zinc-400" />
            <input required type="email" placeholder="Email" value={form.email} onChange={set('email')}
              className="px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition placeholder-zinc-400" />
            <input required type="password" placeholder="Password (min 8 chars)" value={form.password} onChange={set('password')} minLength={8}
              className="px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition placeholder-zinc-400" />
            <input placeholder="Department (optional)" value={form.department} onChange={set('department')}
              className="px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition placeholder-zinc-400" />
            <select value={form.role} onChange={set('role')}
              className="px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition">
              <option>Admin</option><option>Staff</option><option>Intern</option>
            </select>
            {createError && <div className="col-span-1 md:col-span-2 text-rose-600 dark:text-rose-400 text-xs font-bold">{createError}</div>}
            <div className="col-span-1 md:col-span-2 flex gap-3 pt-2">
              <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg text-xs font-semibold transition">Cancel</button>
              <button type="submit" disabled={isCreating} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-lg text-xs font-bold transition shadow-sm">
                {isCreating ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users list */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm overflow-hidden transition-colors">
        {isLoading && (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-zinc-100 dark:bg-zinc-800 rounded w-1/4" />
                  <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}
        {isError && <div className="px-5 py-8 text-center text-rose-600 dark:text-rose-400 text-sm font-semibold">Failed to load users. Google Sheets must be configured.</div>}
        {!isLoading && !isError && (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-850">
            {(data?.data || []).map(u => (
              <div key={u.user_id} className="flex items-center gap-4 px-5 py-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 transition">
                <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center flex-shrink-0">
                  <span className="text-indigo-600 dark:text-indigo-400 text-sm font-bold">{u.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-zinc-900 dark:text-white text-sm font-semibold truncate">{u.name}</p>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs truncate font-medium">{u.email}{u.department && ` · ${u.department}`}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border uppercase tracking-wider ${ROLE_BADGE[u.role] || ROLE_BADGE.Intern}`}>
                  {u.role}
                </span>
                <span className={`text-xs font-semibold ${u.status === 'Active' ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 dark:text-zinc-550'}`}>
                  {u.status}
                </span>
                {u.status === 'Active' && (
                  <button
                    onClick={() => handleDeactivate(u.user_id)}
                    className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded transition"
                    title="Deactivate user"
                  >
                    <UserX className="w-4.5 h-4.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
