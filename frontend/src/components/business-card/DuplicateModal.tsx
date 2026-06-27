'use client'
// src/components/business-card/DuplicateModal.tsx
import { AlertTriangle, User, Building2, Phone, Mail, GitMerge, Plus, X } from 'lucide-react'
import type { Contact } from '@/types'

interface DuplicateModalProps {
  existing: Contact
  incoming: Record<string, string>
  confidence: number
  matchReason: string
  onCreateNew: () => void
  onMerge: () => void
  onSkip: () => void
  isLoading?: boolean
}

export default function DuplicateModal({
  existing,
  incoming,
  confidence,
  matchReason,
  onCreateNew,
  onMerge,
  onSkip,
  isLoading,
}: DuplicateModalProps) {
  const pct = Math.round(confidence * 100)

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg">Potential Duplicate Detected</h2>
              <p className="text-gray-400 text-sm mt-1">
                A contact with {pct}% similarity already exists · Match: <span className="text-yellow-400">{matchReason}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Comparison */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Existing */}
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Existing Contact</span>
              </div>
              <ContactCard contact={existing} />
            </div>

            {/* Incoming */}
            <div className="bg-gray-800 rounded-xl p-4 border border-yellow-800/50">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-yellow-400" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">New (from card)</span>
              </div>
              <IncomingCard data={incoming} />
            </div>
          </div>

          {/* Merge recommendation */}
          <div className="mt-4 bg-blue-900/20 border border-blue-800/50 rounded-xl p-4">
            <p className="text-blue-300 text-sm">
              <span className="font-semibold">Recommendation:</span> If this is the same person, use{' '}
              <span className="text-white font-medium">Merge</span> to update the existing contact
              with any new information from the card.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-800 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onSkip}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 rounded-lg text-sm font-medium transition flex-1"
          >
            <X className="w-4 h-4" />
            Skip (don&apos;t save)
          </button>
          <button
            onClick={onMerge}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition flex-1"
          >
            <GitMerge className="w-4 h-4" />
            Merge into existing
          </button>
          <button
            onClick={onCreateNew}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition flex-1"
          >
            <Plus className="w-4 h-4" />
            Create new anyway
          </button>
        </div>
      </div>
    </div>
  )
}

function ContactCard({ contact }: { contact: Contact }) {
  return (
    <div className="space-y-2.5">
      <Row icon={<User className="w-3.5 h-3.5" />} label="Name" value={contact.Name} />
      <Row icon={<Building2 className="w-3.5 h-3.5" />} label="Company" value={contact.Company} />
      <Row icon={null} label="Designation" value={contact.Designation} />
      <Row icon={<Phone className="w-3.5 h-3.5" />} label="Phone" value={contact.Phone} />
      <Row icon={<Mail className="w-3.5 h-3.5" />} label="Email" value={contact.Email} />
      <Row icon={null} label="City" value={contact.City} />
      <Row icon={null} label="Source" value={contact.Event_Source} />
    </div>
  )
}

function IncomingCard({ data }: { data: Record<string, string> }) {
  return (
    <div className="space-y-2.5">
      <Row icon={<User className="w-3.5 h-3.5" />} label="Name" value={data.name} />
      <Row icon={<Building2 className="w-3.5 h-3.5" />} label="Company" value={data.company} />
      <Row icon={null} label="Designation" value={data.designation} />
      <Row icon={<Phone className="w-3.5 h-3.5" />} label="Phone" value={data.phone} />
      <Row icon={<Mail className="w-3.5 h-3.5" />} label="Email" value={data.email} />
      <Row icon={null} label="City" value={data.city} />
      <Row icon={null} label="Source" value={data.event_source} />
    </div>
  )
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-2">
      {icon && <span className="text-gray-500 mt-0.5 flex-shrink-0">{icon}</span>}
      {!icon && <span className="w-3.5 flex-shrink-0" />}
      <div className="min-w-0">
        <span className="text-gray-500 text-xs">{label}: </span>
        <span className="text-gray-200 text-xs">{value || <span className="text-gray-600 italic">—</span>}</span>
      </div>
    </div>
  )
}
