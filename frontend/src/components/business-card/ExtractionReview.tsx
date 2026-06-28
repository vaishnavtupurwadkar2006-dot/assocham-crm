'use client'
// src/components/business-card/ExtractionReview.tsx
import { useState } from 'react'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import type { ExtractedFields } from '@/types'
import { normalizePhoneNumber } from '@/lib/phone'


interface ExtractionReviewProps {
  extracted: ExtractedFields
  rawJson: string
  confidence: number
  eventSource?: string
  onConfirm: (data: ExtractedFields & { Event_Source?: string; Contact_Priority: string; Notes?: string; Next_Followup_Date?: string }) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

const PRIORITY_OPTIONS = ['High', 'Medium', 'Low']

export default function ExtractionReview({
  extracted,
  confidence,
  eventSource,
  onConfirm,
  onCancel,
  isSubmitting,
}: ExtractionReviewProps) {
  const [form, setForm] = useState({
    name: extracted.name || '',
    designation: extracted.designation || '',
    company: extracted.company || '',
    parent_organization: extracted.parent_organization || '',
    sector: extracted.sector || '',
    phone: extracted.phone || '',
    alternate_phone: extracted.alternate_phone || '',
    email: extracted.email || '',
    alternate_email: extracted.alternate_email || '',
    website: extracted.website || '',
    linkedin: extracted.linkedin || '',
    address: extracted.address || '',
    city: extracted.city || '',
    state: extracted.state || '',
    country: extracted.country || 'India',
    event_source: eventSource || '',
    priority: 'Medium',
    notes: extracted.notes || '',
    next_followup_date: '',
  })

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  const confidenceColor = confidence >= 0.8 ? 'text-green-400' : confidence >= 0.5 ? 'text-yellow-400' : 'text-red-400'
  const confidencePct = Math.round(confidence * 100)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await onConfirm({
      name: form.name,
      designation: form.designation,
      company: form.company,
      parent_organization: form.parent_organization,
      sector: form.sector,
      phone: normalizePhoneNumber(form.phone),
      alternate_phone: normalizePhoneNumber(form.alternate_phone),
      email: form.email,
      alternate_email: form.alternate_email,

      website: form.website,
      linkedin: form.linkedin,
      address: form.address,
      city: form.city,
      state: form.state,
      country: form.country,
      Event_Source: form.event_source,
      Contact_Priority: form.priority,
      Notes: form.notes,
      Next_Followup_Date: form.next_followup_date || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Confidence Banner */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
        confidence >= 0.8
          ? 'bg-green-900/20 border-green-800'
          : confidence >= 0.5
          ? 'bg-yellow-900/20 border-yellow-800'
          : 'bg-red-900/20 border-red-800'
      }`}>
        {confidence >= 0.8
          ? <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
          : <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
        }
        <div>
          <p className="text-white text-sm font-medium">
            AI Extraction — <span className={confidenceColor}>{confidencePct}% confidence</span>
          </p>
          <p className="text-gray-400 text-xs mt-0.5">
            {confidence >= 0.8
              ? 'High quality extraction. Review and confirm.'
              : 'Some fields may need correction. Please review carefully.'}
          </p>
        </div>
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Full Name *" value={form.name} onChange={set('name')} required />
        <Field label="Designation" value={form.designation} onChange={set('designation')} />
        <Field label="Company *" value={form.company} onChange={set('company')} required />
        <Field label="Parent Organization" value={form.parent_organization} onChange={set('parent_organization')} />
        <Field label="Sector / Industry" value={form.sector} onChange={set('sector')} />
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Priority</label>
          <select
            value={form.priority}
            onChange={set('priority')}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {PRIORITY_OPTIONS.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div className="border-t border-gray-800 pt-4">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-semibold">Contact Details</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Phone" value={form.phone} onChange={set('phone')} type="tel" />
          <Field label="Alternate Phone" value={form.alternate_phone} onChange={set('alternate_phone')} type="tel" />
          <Field label="Email" value={form.email} onChange={set('email')} type="email" />
          <Field label="Alternate Email" value={form.alternate_email} onChange={set('alternate_email')} type="email" />
          <Field label="Website" value={form.website} onChange={set('website')} type="url" />
          <Field label="LinkedIn" value={form.linkedin} onChange={set('linkedin')} />
        </div>
      </div>

      <div className="border-t border-gray-800 pt-4">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-semibold">Location</p>
        <div className="grid grid-cols-3 gap-4">
          <Field label="City" value={form.city} onChange={set('city')} />
          <Field label="State" value={form.state} onChange={set('state')} />
          <Field label="Country" value={form.country} onChange={set('country')} />
        </div>
        <div className="mt-4">
          <Field label="Address" value={form.address} onChange={set('address')} />
        </div>
      </div>

      <div className="border-t border-gray-800 pt-4">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-semibold">Additional Details</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Event Source" value={form.event_source} onChange={set('event_source')} placeholder="e.g. ASSOCHAM Goa Summit 2024" />
          <Field label="Follow-Up Date" value={form.next_followup_date} onChange={set('next_followup_date')} type="date" />
        </div>
        <div className="mt-4">
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Notes</label>
          <textarea
            value={form.notes}
            onChange={set('notes')}
            rows={2}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Any additional notes..."
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 py-2.5 px-4 border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 rounded-lg text-sm font-medium transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !form.company}
          className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
          ) : (
            'Save Contact'
          )}
        </button>
      </div>
    </form>
  )
}

function Field({ label, value, onChange, type = 'text', required, placeholder }: {
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  type?: string
  required?: boolean
  placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-600"
      />
    </div>
  )
}
