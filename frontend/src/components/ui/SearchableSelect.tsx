'use client'

/**
 * src/components/ui/SearchableSelect.tsx
 *
 * A reusable searchable dropdown that matches the existing light/dark design
 * system used throughout ContactForm and ExtractionReview.
 *
 * Props:
 *   label        – visible label above the field
 *   value        – currently selected value (controlled)
 *   onChange     – called with the newly selected string
 *   options      – readonly string array of choices
 *   placeholder  – placeholder text when nothing is selected (optional)
 *   required     – marks the field as required (optional)
 *   dark         – set true for the dark-themed variant used in ExtractionReview
 */

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'

interface SearchableSelectProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: readonly string[]
  placeholder?: string
  required?: boolean
  /** Use dark-mode forced styling (for panels that are always dark like ExtractionReview) */
  dark?: boolean
}

export default function SearchableSelect({
  label,
  value,
  onChange,
  options,
  placeholder = 'Search or select…',
  required,
  dark = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  // Focus input when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  const filtered = query
    ? options.filter(o => o.toLowerCase().includes(query.toLowerCase()))
    : options

  function select(option: string) {
    onChange(option)
    setOpen(false)
    setQuery('')
  }

  function clearValue(e: React.MouseEvent) {
    e.stopPropagation()
    onChange('')
  }

  // Style tokens — light vs dark variant
  const labelCls = dark
    ? 'block text-xs font-medium text-gray-400 mb-1.5'
    : 'block text-xs font-semibold text-zinc-550 dark:text-zinc-400 mb-1.5 uppercase tracking-wider'

  const triggerCls = dark
    ? 'w-full flex items-center justify-between px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition ' +
      (value ? 'text-white' : 'text-gray-500')
    : 'w-full flex items-center justify-between px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent cursor-pointer transition ' +
      (value ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 dark:text-zinc-500')

  const dropdownCls = dark
    ? 'absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden'
    : 'absolute z-50 w-full mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl overflow-hidden'

  const searchInputCls = dark
    ? 'w-full px-3 py-2 bg-gray-900 border-b border-gray-700 text-white text-sm placeholder-gray-500 focus:outline-none'
    : 'w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-sm placeholder-zinc-400 focus:outline-none'

  const optionBaseCls = dark
    ? 'px-3 py-2 text-sm cursor-pointer transition-colors'
    : 'px-3 py-2 text-sm cursor-pointer transition-colors'

  const optionNormalCls = dark
    ? 'text-gray-200 hover:bg-gray-700'
    : 'text-zinc-800 dark:text-zinc-200 hover:bg-indigo-50 dark:hover:bg-zinc-700'

  const optionSelectedCls = dark
    ? 'bg-blue-600/30 text-blue-300 font-semibold'
    : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-semibold'

  const emptyTextCls = dark
    ? 'px-3 py-3 text-sm text-gray-500 text-center'
    : 'px-3 py-3 text-sm text-zinc-400 dark:text-zinc-500 text-center'

  return (
    <div ref={containerRef} className="relative">
      <label className={labelCls}>
        {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={triggerCls}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{value || placeholder}</span>
        <span className="flex items-center gap-1 flex-shrink-0 ml-2">
          {value && (
            <X
              className={`w-3.5 h-3.5 opacity-50 hover:opacity-100 transition-opacity ${dark ? 'text-gray-400' : 'text-zinc-400 dark:text-zinc-500'}`}
              onClick={clearValue}
            />
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''} ${dark ? 'text-gray-400' : 'text-zinc-400 dark:text-zinc-500'}`}
          />
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className={dropdownCls}>
          {/* Search input */}
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${dark ? 'text-gray-500' : 'text-zinc-400'}`} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Type to search…"
              className={searchInputCls + ' pl-8'}
            />
          </div>

          {/* Option list */}
          <ul
            role="listbox"
            className="max-h-52 overflow-y-auto"
          >
            {filtered.length === 0 ? (
              <li className={emptyTextCls}>No results found</li>
            ) : (
              filtered.map(option => (
                <li
                  key={option}
                  role="option"
                  aria-selected={option === value}
                  onClick={() => select(option)}
                  className={`${optionBaseCls} ${option === value ? optionSelectedCls : optionNormalCls}`}
                >
                  {option}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
