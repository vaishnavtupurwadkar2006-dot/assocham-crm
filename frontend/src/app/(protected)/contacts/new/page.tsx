'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import ContactForm from '@/components/contacts/ContactForm'
import { createContact } from '@/lib/api'
import type { Contact } from '@/types'

export default function NewContactPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  async function handleSubmit(formData: Partial<Contact>) {
    const res = await createContact(formData)
    queryClient.invalidateQueries({ queryKey: ['contacts'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    queryClient.invalidateQueries({ queryKey: ['followups'] })
    router.push(`/contacts/${res.data.Contact_ID}`)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/contacts" className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-sm font-semibold transition">
          <ArrowLeft className="w-4 h-4" /> Back to contacts
        </Link>
        <h1 className="text-zinc-900 dark:text-white font-semibold text-lg">Add New Contact</h1>
      </div>
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 shadow-sm transition-colors">
        <ContactForm
          onSubmit={handleSubmit}
          onCancel={() => router.push('/contacts')}
        />
      </div>
    </div>
  )
}
