'use client'

import { Search, X } from 'lucide-react'
import type { ContactFilters } from '@/lib/api'

interface FilterPanelProps {
  filters: ContactFilters
  onFiltersChange: (f: ContactFilters) => void
  sectors?: string[]
  states?: string[]
}

const PRIORITIES = ['High', 'Medium', 'Low']
const STATUSES = ['Active', 'Inactive', 'Pending', 'Archived']
const SOURCE_TYPES = ['Business Card', 'LinkedIn', 'Referral', 'Event', 'Excel Import', 'Manual Entry']

export default function FilterPanel({ filters, onFiltersChange, sectors = [], states = [] }: FilterPanelProps) {
  const set = (key: keyof ContactFilters) => (value: string) => {
    onFiltersChange({ ...filters, [key]: value || undefined, page: 1 })
  }

  const hasActiveFilters = Object.entries(filters).some(
    ([k, v]) => k !== 'page' && k !== 'page_size' && v
  )

  const clearAll = () =>
    onFiltersChange({ page: 1, page_size: filters.page_size })

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 space-y-3 shadow-sm transition-colors">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Search contacts..."
          value={filters.search || ''}
          onChange={e => set('search')(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white text-sm placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition"
        />
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap gap-2">
        <Select
          value={filters.sector || ''}
          onChange={set('sector')}
          placeholder="All Sectors"
          options={sectors}
        />
        <Select
          value={filters.state || ''}
          onChange={set('state')}
          placeholder="All States"
          options={states}
        />
        <Select
          value={filters.priority || ''}
          onChange={set('priority')}
          placeholder="All Priorities"
          options={PRIORITIES}
        />
        <Select
          value={filters.status || ''}
          onChange={set('status')}
          placeholder="All Statuses"
          options={STATUSES}
        />
        <Select
          value={filters.source_type || ''}
          onChange={set('source_type')}
          placeholder="All Sources"
          options={SOURCE_TYPES}
        />

        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 border border-zinc-200 dark:border-zinc-800 hover:border-rose-200 dark:hover:border-rose-900/50 rounded-lg transition"
          >
            <X className="w-3 h-3" />
            Clear filters
          </button>
        )}
      </div>
    </div>
  )
}

function Select({ value, onChange, placeholder, options }: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  options: string[]
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-550 dark:focus:ring-indigo-400 focus:text-zinc-900 dark:focus:text-white transition"
    >
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}
