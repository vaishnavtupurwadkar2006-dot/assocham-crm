'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ContactForm from '@/components/contacts/ContactForm'
import { getContact, updateContact } from '@/lib/api'
import type { Contact } from '@/types'

export default function EditContactPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['contact', id],
    queryFn: () => getContact(id),
  })

  async function handleSubmit(formData: Partial<Contact>) {
    await updateContact(id, formData)
    await queryClient.invalidateQueries({ queryKey: ['contact', id] })
    await queryClient.invalidateQueries({ queryKey: ['contacts'] })
    await queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    await queryClient.invalidateQueries({ queryKey: ['followups'] })
    router.push(`/contacts/${id}`)
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto animate-pulse space-y-4">
        <div className="h-6 bg-zinc-100 dark:bg-zinc-800 rounded w-1/4" />
        <div className="h-96 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/contacts/${id}`} className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-sm font-semibold transition">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <h1 className="text-zinc-900 dark:text-white font-semibold text-lg">Edit Contact</h1>
      </div>
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 shadow-sm transition-colors">
        <ContactForm
          initial={data?.data}
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/contacts/${id}`)}
          isEdit
        />
      </div>
    </div>
  )
}
