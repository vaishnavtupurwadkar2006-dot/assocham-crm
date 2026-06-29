'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import type { Contact } from '@/types'
import { normalizePhoneNumber } from '@/lib/phone'
import { normalizeWebsite } from '@/lib/utils'


interface ContactFormProps {
  initial?: Partial<Contact>
  onSubmit: (data: Partial<Contact>) => Promise<void>
  onCancel: () => void
  isEdit?: boolean
}

const PRIORITIES = ['High', 'Medium', 'Low']
const STATUSES = ['Active', 'Inactive', 'Pending', 'Archived']
const SOURCE_TYPES = ['Business Card', 'LinkedIn', 'Referral', 'Event', 'Cold Outreach', 'Website', 'Excel Import', 'Manual Entry']

export default function ContactForm({ initial = {}, onSubmit, onCancel, isEdit }: ContactFormProps) {
  const [form, setForm] = useState({
    Name: initial.Name || '',
    Designation: initial.Designation || '',
    Company: initial.Company || '',
    Parent_Organization: initial.Parent_Organization || '',
    Sector: initial.Sector || '',
    Company_Type: initial.Company_Type || '',
    Phone: initial.Phone || '',
    Alternate_Phone: initial.Alternate_Phone || '',
    Email: initial.Email || '',
    Alternate_Email: initial.Alternate_Email || '',
    Website: initial.Website || '',
    LinkedIn: initial.LinkedIn || '',
    Address: initial.Address || '',
    City: initial.City || '',
    State: initial.State || '',
    Country: initial.Country || 'India',
    Contact_Priority: initial.Contact_Priority || 'Medium',
    Status: initial.Status || 'Active',
    Source_Type: initial.Source_Type || 'Manual Entry',
    Event_Source: initial.Event_Source || '',
    Import_Source: initial.Import_Source || '',
    Next_Followup_Date: initial.Next_Followup_Date || '',
    Notes: initial.Notes || '',
  })

  const initialStr = JSON.stringify(initial)
  useEffect(() => {
    setForm({
      Name: initial.Name || '',
      Designation: initial.Designation || '',
      Company: initial.Company || '',
      Parent_Organization: initial.Parent_Organization || '',
      Sector: initial.Sector || '',
      Company_Type: initial.Company_Type || '',
      Phone: initial.Phone || '',
      Alternate_Phone: initial.Alternate_Phone || '',
      Email: initial.Email || '',
      Alternate_Email: initial.Alternate_Email || '',
      Website: initial.Website || '',
      LinkedIn: initial.LinkedIn || '',
      Address: initial.Address || '',
      City: initial.City || '',
      State: initial.State || '',
      Country: initial.Country || 'India',
      Contact_Priority: initial.Contact_Priority || 'Medium',
      Status: initial.Status || 'Active',
      Source_Type: initial.Source_Type || 'Manual Entry',
      Event_Source: initial.Event_Source || '',
      Import_Source: initial.Import_Source || '',
      Next_Followup_Date: initial.Next_Followup_Date || '',
      Notes: initial.Notes || '',
    })
  }, [initialStr])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const set = (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await onSubmit({
        ...form,
        Phone: normalizePhoneNumber(form.Phone),
        Alternate_Phone: normalizePhoneNumber(form.Alternate_Phone),
        Website: normalizeWebsite(form.Website),
        Next_Followup_Date: form.Next_Followup_Date || '',
      })

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save contact.')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <section>
        <h3 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Full Name" value={form.Name} onChange={set('Name')} />
          <Field label="Designation / Title" value={form.Designation} onChange={set('Designation')} />
          <Field label="Company *" value={form.Company} onChange={set('Company')} required />
          <Field label="Parent Organization" value={form.Parent_Organization} onChange={set('Parent_Organization')} />
          <Field label="Sector / Industry" value={form.Sector} onChange={set('Sector')} />
          <Field label="Company Type" value={form.Company_Type} onChange={set('Company_Type')} />
        </div>
      </section>

      {/* Contact Details */}
      <section className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
        <h3 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-4">Contact Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Phone" value={form.Phone} onChange={set('Phone')} type="tel" />
          <Field label="Alternate Phone" value={form.Alternate_Phone} onChange={set('Alternate_Phone')} type="tel" />
          <Field label="Email" value={form.Email} onChange={set('Email')} type="email" />
          <Field label="Alternate Email" value={form.Alternate_Email} onChange={set('Alternate_Email')} type="email" />
          <Field label="Website" value={form.Website} onChange={set('Website')} />
          <Field label="LinkedIn" value={form.LinkedIn} onChange={set('LinkedIn')} />
        </div>
      </section>

      {/* Location */}
      <section className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
        <h3 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-4">Location</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Field label="City" value={form.City} onChange={set('City')} />
          <Field label="State" value={form.State} onChange={set('State')} />
          <Field label="Country" value={form.Country} onChange={set('Country')} />
        </div>
        <Field label="Full Address" value={form.Address} onChange={set('Address')} />
      </section>

      {/* Meta */}
      <section className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
        <h3 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-4">Classification & Source</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField label="Priority" value={form.Contact_Priority} onChange={set('Contact_Priority')} options={PRIORITIES} />
          <SelectField label="Status" value={form.Status} onChange={set('Status')} options={STATUSES} />
          <SelectField label="Source Type" value={form.Source_Type} onChange={set('Source_Type')} options={SOURCE_TYPES} />
          <Field label="Event Source" value={form.Event_Source} onChange={set('Event_Source')} placeholder="e.g. ASSOCHAM Summit 2024" />
          <Field label="Import Source" value={form.Import_Source} onChange={set('Import_Source')} />
          <Field label="Follow-Up Date" value={form.Next_Followup_Date} onChange={set('Next_Followup_Date')} type="date" />
        </div>
        <div className="mt-4">
          <label className="block text-xs font-semibold text-zinc-550 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">Notes</label>
          <textarea
            value={form.Notes}
            onChange={set('Notes')}
            rows={3}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white text-sm placeholder-zinc-450 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition resize-none"
            placeholder="Internal notes about this contact..."
          />
        </div>
      </section>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-lg px-4 py-3 text-rose-700 dark:text-rose-455 text-sm font-semibold">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 py-2 px-4 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-semibold transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !form.Company}
          className="flex-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:bg-indigo-400 dark:disabled:bg-indigo-700 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> 
              Saving...
            </>
          ) : (
            isEdit ? 'Save Changes' : 'Create Contact'
          )}
        </button>
      </div>
    </form>
  )
}

function Field({ label, value, onChange, type = 'text', required, placeholder }: {
  label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  type?: string; required?: boolean; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-zinc-550 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition"
      />
    </div>
  )
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: string[]
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-zinc-550 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">{label}</label>
      <select
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition"
      >
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  )
}
