'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import FilterPanel from '@/components/contacts/FilterPanel'
import ContactsTable from '@/components/contacts/ContactsTable'
import { getContacts, getDistinctValues } from '@/lib/api'
import type { ContactFilters } from '@/lib/api'

const INDIAN_STATES_AND_UTS = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry'
]

export default function ContactsPage() {
  const [filters, setFilters] = useState<ContactFilters>({ page: 1, page_size: 20 })

  const { data, isLoading, isError } = useQuery({
    queryKey: ['contacts', filters],
    queryFn: () => getContacts(filters),
  })

  // Get distinct values for filter dropdowns dynamically from the backend
  const { data: sectorsData } = useQuery({
    queryKey: ['contacts-distinct-sectors'],
    queryFn: () => getDistinctValues('Sector'),
    staleTime: 300_000,
  })

  const { data: statesData } = useQuery({
    queryKey: ['contacts-distinct-states'],
    queryFn: () => getDistinctValues('State'),
    staleTime: 300_000,
  })

  const sectors = [...new Set((sectorsData?.data || []).map(s => s.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b))
  const states = [...new Set([
    ...(statesData?.data || []).map(s => s.trim()).filter(Boolean),
    ...INDIAN_STATES_AND_UTS
  ])].sort((a, b) => a.localeCompare(b))

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
