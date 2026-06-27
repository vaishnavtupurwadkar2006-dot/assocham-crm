'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Brain, Search, Loader2, Sparkles } from 'lucide-react'
import ContactsTable from '@/components/contacts/ContactsTable'
import { aiSearch, getAISearchSuggestions } from '@/lib/api'
import type { Contact, AISearchMeta } from '@/types'

export default function AISearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Contact[]>([])
  const [meta, setMeta] = useState<AISearchMeta | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [error, setError] = useState('')

  const { data: suggestionsData } = useQuery({
    queryKey: ['ai-search-suggestions'],
    queryFn: getAISearchSuggestions,
    staleTime: 300_000,
  })

  const suggestions = suggestionsData?.data || []

  async function handleSearch(q?: string) {
    const searchQuery = q || query
    if (!searchQuery.trim()) return
    setQuery(searchQuery)
    setError('')
    setIsSearching(true)
    setHasSearched(false)
    try {
      const res = await aiSearch(searchQuery)
      setResults(res.data)
      setMeta(res.meta)
      setHasSearched(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Search failed. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center">
          <Brain className="w-5 h-5 text-indigo-650 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-zinc-900 dark:text-white font-semibold text-lg">AI Search</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs md:text-sm font-medium">Search contacts in natural language using Gemini AI</p>
        </div>
      </div>

      {/* Search bar */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 space-y-4 shadow-sm transition-colors">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder='e.g. "Find healthcare contacts from Maharashtra" or "Show high priority CEOs"'
              className="w-full pl-9 pr-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white text-sm placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition"
            />
          </div>
          <button
            onClick={() => handleSearch()}
            disabled={isSearching || !query.trim()}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:bg-indigo-400 dark:disabled:bg-indigo-700 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition shadow-sm"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Search
              </>
            )}
          </button>
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && !hasSearched && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Try:</span>
            {suggestions.slice(0, 6).map(s => (
              <button
                key={s}
                onClick={() => handleSearch(s)}
                className="text-xs px-3 py-1 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-350 border border-zinc-200 dark:border-zinc-700 rounded-full transition font-semibold"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-lg px-4 py-3 text-rose-700 dark:text-rose-455 text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Results */}
      {hasSearched && meta && (
        <div className="space-y-4">
          {/* Explanation */}
          <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-lg px-4 py-3 flex items-start gap-3 shadow-sm transition-colors">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-indigo-900 dark:text-indigo-300 text-sm font-semibold">{meta.explanation}</p>
              <p className="text-zinc-400 dark:text-zinc-550 text-xs mt-1 font-semibold uppercase tracking-wider">
                {meta.total_results} result{meta.total_results !== 1 ? 's' : ''} · Gemini AI parsed your query
              </p>
            </div>
          </div>

          {/* Parsed filters debug */}
          {Object.values(meta.parsed_filters).some(v => v) && (
            <div className="flex flex-wrap gap-2 px-1">
              {Object.entries(meta.parsed_filters).map(([k, v]) => {
                if (!v || k === 'explanation') return null
                return (
                  <span key={k} className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 rounded-full">
                    {k}: {String(v)}
                  </span>
                )
              })}
            </div>
          )}

          <ContactsTable contacts={results} />
        </div>
      )}

      {/* Empty state */}
      {hasSearched && results.length === 0 && !error && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-5 py-12 text-center shadow-sm">
          <Brain className="w-8 h-8 text-zinc-400 dark:text-zinc-650 mx-auto mb-3" />
          <p className="text-zinc-700 dark:text-zinc-300 font-bold">No contacts found</p>
          <p className="text-zinc-550 dark:text-zinc-450 text-xs mt-1 font-semibold">Try a different query or broaden your search.</p>
        </div>
      )}
    </div>
  )
}
