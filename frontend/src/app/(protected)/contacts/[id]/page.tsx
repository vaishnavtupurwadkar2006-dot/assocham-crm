'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import {
  Mail, Phone, Globe, Linkedin, MapPin, Building2, Tag,
  Calendar, Pencil, Trash2, ArrowLeft, CreditCard, AlertCircle, Loader2
} from 'lucide-react'
import { getContact, deleteContact } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useState } from 'react'

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['contact', id],
    queryFn: () => getContact(id),
  })

  const c = data?.data

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await deleteContact(id)
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-charts'] })
      queryClient.invalidateQueries({ queryKey: ['followups'] })
      router.push('/contacts')
    } catch {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 bg-zinc-100 dark:bg-zinc-800 rounded w-1/3" />
        <div className="h-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm" />
      </div>
    )
  }

  if (isError || !c) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-lg px-5 py-8 text-center shadow-sm">
          <AlertCircle className="w-8 h-8 text-rose-600 dark:text-rose-450 mx-auto mb-3" />
          <p className="text-rose-700 dark:text-rose-400 font-bold">Contact not found</p>
          <Link href="/contacts" className="text-zinc-500 dark:text-zinc-400 text-sm mt-3 inline-block hover:underline">
            ← Back to contacts
          </Link>
        </div>
      </div>
    )
  }

  const canEdit = user?.role === 'Admin' || user?.role === 'Staff'
  const canDelete = user?.role === 'Admin'

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Nav */}
      <div className="flex items-center justify-between">
        <Link href="/contacts" className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-sm font-semibold transition">
          <ArrowLeft className="w-4 h-4" /> Back to contacts
        </Link>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Link
              href={`/contacts/${id}/edit`}
              className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold rounded-lg shadow-sm transition"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit
            </Link>
          )}
          {canDelete && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-450 text-xs font-semibold rounded-lg shadow-sm transition"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          )}
        </div>
      </div>

      {/* Header card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 shadow-sm transition-colors">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center flex-shrink-0">
            <span className="text-indigo-600 dark:text-indigo-400 text-xl font-bold">
              {(c.Name || c.Company || '?').charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-zinc-900 dark:text-white font-bold text-xl">{c.Name || '—'}</h1>
            <p className="text-zinc-600 dark:text-zinc-300 text-sm mt-0.5 font-medium">{c.Designation}</p>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">{c.Company}{c.Parent_Organization && ` · ${c.Parent_Organization}`}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {c.Contact_Priority && (
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border uppercase tracking-wider
                  ${c.Contact_Priority === 'High' ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/30' :
                    c.Contact_Priority === 'Medium' ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/30' :
                    'bg-zinc-50 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'}`}>
                  {c.Contact_Priority} Priority
                </span>
              )}
              {c.Status && (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 font-bold uppercase tracking-wider">
                  {c.Status}
                </span>
              )}
              {c.Source_Type === 'Business Card' && (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/30 font-bold uppercase tracking-wider flex items-center gap-1">
                  <CreditCard className="w-3 h-3" /> Business Card
                </span>
              )}
              {c.Sector && (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-zinc-50 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 font-bold uppercase tracking-wider">
                  {c.Sector}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Detail grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact details */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 space-y-4 shadow-sm transition-colors">
          <h3 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Contact Details</h3>
          <div className="space-y-3.5">
            {c.Email && <DetailRow icon={<Mail className="w-4 h-4 text-zinc-400" />} label="Email" value={c.Email} href={`mailto:${c.Email}`} />}
            {c.Alternate_Email && <DetailRow icon={<Mail className="w-4 h-4 text-zinc-400" />} label="Alt Email" value={c.Alternate_Email} href={`mailto:${c.Alternate_Email}`} />}
            {c.Phone && <DetailRow icon={<Phone className="w-4 h-4 text-zinc-400" />} label="Phone" value={c.Phone} href={`tel:${c.Phone}`} />}
            {c.Alternate_Phone && <DetailRow icon={<Phone className="w-4 h-4 text-zinc-400" />} label="Alt Phone" value={c.Alternate_Phone} href={`tel:${c.Alternate_Phone}`} />}
            {c.Website && <DetailRow icon={<Globe className="w-4 h-4 text-zinc-400" />} label="Website" value={c.Website} href={c.Website} external />}
            {c.LinkedIn && <DetailRow icon={<Linkedin className="w-4 h-4 text-zinc-400" />} label="LinkedIn" value="View profile" href={c.LinkedIn} external />}
            {!c.Email && !c.Phone && !c.Website && (
              <p className="text-zinc-400 dark:text-zinc-500 text-xs font-medium">No contact details recorded.</p>
            )}
          </div>
        </div>

        {/* Location + meta */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 space-y-4 shadow-sm transition-colors">
          <h3 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Location & Source</h3>
          <div className="space-y-3.5">
            {(c.City || c.State || c.Country) && (
              <DetailRow
                icon={<MapPin className="w-4 h-4 text-zinc-400" />}
                label="Location"
                value={[c.City, c.State, c.Country].filter(Boolean).join(', ')}
              />
            )}
            {c.Address && <DetailRow icon={<Building2 className="w-4 h-4 text-zinc-400" />} label="Address" value={c.Address} />}
            {c.Event_Source && <DetailRow icon={<Tag className="w-4 h-4 text-zinc-400" />} label="Event" value={c.Event_Source} />}
            {c.Import_Source && <DetailRow icon={<Tag className="w-4 h-4 text-zinc-400" />} label="Import source" value={c.Import_Source} />}
            {c.Date_Added && <DetailRow icon={<Calendar className="w-4 h-4 text-zinc-400" />} label="Added" value={c.Date_Added} />}
            {c.Next_Followup_Date && <DetailRow icon={<Calendar className="w-4 h-4 text-zinc-400" />} label="Follow-up" value={c.Next_Followup_Date} />}
          </div>
        </div>
      </div>

      {/* Notes */}
      {c.Notes && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 shadow-sm transition-colors">
          <h3 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">Notes</h3>
          <p className="text-zinc-700 dark:text-zinc-300 text-sm whitespace-pre-wrap font-medium">{c.Notes}</p>
        </div>
      )}

      {/* AI Summary */}
      {c.AI_Summary && (
        <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-lg p-5 shadow-sm transition-colors">
          <h3 className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider mb-2">AI Summary</h3>
          <p className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">{c.AI_Summary}</p>
        </div>
      )}

      {/* Metadata footer */}
      <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 flex gap-4 pb-4 uppercase tracking-wider">
        <span>ID: {c.Contact_ID}</span>
        {c.Last_Updated && <span>Last updated: {c.Last_Updated}</span>}
      </div>

      {/* Delete confirm modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 max-w-sm w-full shadow-lg transition-colors">
            <h2 className="text-zinc-900 dark:text-white font-bold text-base">Delete contact?</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-2 font-medium">
              This will permanently delete <strong className="text-zinc-900 dark:text-white">{c.Name || c.Company}</strong> from your database. This cannot be undone.
            </p>
            <div className="flex gap-3 mt-5">
              <button 
                onClick={() => setShowDeleteConfirm(false)} 
                disabled={isDeleting}
                className="flex-1 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-750 dark:text-zinc-300 hover:bg-zinc-55 dark:hover:bg-zinc-800 rounded-lg text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete} 
                disabled={isDeleting}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailRow({ icon, label, value, href, external }: {
  icon: React.ReactNode; label: string; value: string
  href?: string; external?: boolean
}) {
  const content = (
    <div className="flex items-start gap-2.5">
      <span className="text-zinc-400 flex-shrink-0 mt-0.5">{icon}</span>
      <div>
        <p className="text-zinc-400 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-wider">{label}</p>
        <p className={`text-sm mt-0.5 font-semibold ${href ? 'text-indigo-600 dark:text-indigo-400 hover:underline' : 'text-zinc-800 dark:text-zinc-200'}`}>{value}</p>
      </div>
    </div>
  )
  if (href) {
    return <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined} className="block">{content}</a>
  }
  return <div>{content}</div>
}
