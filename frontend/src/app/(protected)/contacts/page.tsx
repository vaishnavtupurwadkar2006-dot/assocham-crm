'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import FilterPanel from '@/components/contacts/FilterPanel'
import ContactsTable from '@/components/contacts/ContactsTable'
import { getContacts } from '@/lib/api'
import type { ContactFilters } from '@/lib/api'

export default function ContactsPage() {
  const [filters, setFilters] = useState<ContactFilters>({ page: 1, page_size: 20 })

  const { data, isLoading, isError } = useQuery({
    queryKey: ['contacts', filters],
    queryFn: () => getContacts(filters),
  })

  // Get distinct values for filter dropdowns from current full dataset
  const { data: allData } = useQuery({
    queryKey: ['contacts-all'],
    queryFn: () => getContacts({ page: 1, page_size: 1000 }),
    staleTime: 300_000,
  })

  const sectors = [...new Set(allData?.data.map(c => c.Sector).filter(Boolean) as string[])].sort()
  const states = [...new Set(allData?.data.map(c => c.State).filter(Boolean) as string[])].sort()

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-zinc-900 dark:text-white font-semibold text-lg md:text-xl">Contacts</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs md:text-sm mt-0.5 font-medium">
            {data?.meta.total ?? 0} contacts total
          </p>
        </div>
        <Link
          href="/contacts/new"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Add Contact
        </Link>
      </div>

      <FilterPanel
        filters={filters}
        onFiltersChange={setFilters}
        sectors={sectors}
        states={states}
      />

      {isError && (
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-lg px-4 py-3 text-rose-700 dark:text-rose-400 text-sm">
          Failed to load contacts. Check your API connection.
        </div>
      )}

      <ContactsTable
        contacts={data?.data || []}
        isLoading={isLoading}
        meta={data?.meta}
        onPageChange={page => setFilters(f => ({ ...f, page }))}
      />
    </div>
  )
}
