'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, CreditCard } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import UploadZone from '@/components/business-card/UploadZone'
import ExtractionReview from '@/components/business-card/ExtractionReview'
import DuplicateModal from '@/components/business-card/DuplicateModal'
import { extractBusinessCard, confirmBusinessCard } from '@/lib/api'
import type { ExtractedFields, ExtractionResponse, Contact } from '@/types'

type Step = 'upload' | 'review' | 'duplicate' | 'success'

export default function BusinessCardPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [step, setStep] = useState<Step>('upload')
  const [eventSource, setEventSource] = useState('')
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractionError, setExtractionError] = useState('')
  const [extraction, setExtraction] = useState<ExtractionResponse | null>(null)
  const [savedContact, setSavedContact] = useState<Contact | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Duplicate state
  const [dupInfo, setDupInfo] = useState<{
    existing: Contact
    incoming: Record<string, string>
    confidence: number
    reason: string
    reviewedData: Record<string, unknown>
  } | null>(null)

  async function handleImageReady(base64: string, mimeType: string) {
    setExtractionError('')
    setIsExtracting(true)
    try {
      const res = await extractBusinessCard({ image_base64: base64, mime_type: mimeType, event_source: eventSource || undefined })
      setExtraction(res)
      setStep('review')
    } catch (err: unknown) {
      setExtractionError(err instanceof Error ? err.message : 'Extraction failed. Please try again.')
    } finally {
      setIsExtracting(false)
    }
  }

  async function handleConfirm(reviewedData: ExtractedFields & { Event_Source?: string; Contact_Priority: string; Notes?: string; Next_Followup_Date?: string }) {
    setSubmitError('')
    setIsSubmitting(true)
    try {
      const payload = {
        Name: reviewedData.name,
        Designation: reviewedData.designation,
        Company: reviewedData.company,
        Parent_Organization: reviewedData.parent_organization,
        Sector: reviewedData.sector,
        Phone: reviewedData.phone,
        Alternate_Phone: reviewedData.alternate_phone,
        Email: reviewedData.email,
        Alternate_Email: reviewedData.alternate_email,
        Website: reviewedData.website,
        LinkedIn: reviewedData.linkedin,
        Address: reviewedData.address,
        City: reviewedData.city,
        State: reviewedData.state,
        Country: reviewedData.country,
        Event_Source: reviewedData.Event_Source,
        Contact_Priority: reviewedData.Contact_Priority || 'Medium',
        Notes: reviewedData.Notes,
        Next_Followup_Date: reviewedData.Next_Followup_Date,
        Raw_Extraction_JSON: extraction?.raw_extraction_json,
        force_create: false,
      }

      const res = await confirmBusinessCard(payload)

      if ('duplicate' in res) {
        const dupData = res as { success: false; duplicate: { confidence: number; match_reason: string; existing_contact: Contact } }
        setDupInfo({
          existing: dupData.duplicate.existing_contact,
          incoming: payload as unknown as Record<string, string>,
          confidence: dupData.duplicate.confidence,
          reason: dupData.duplicate.match_reason || 'Similar contact found',
          reviewedData: payload,
        })
        setStep('duplicate')
      } else {
        const saved = (res as { success: boolean; data: Contact }).data
        setSavedContact(saved)
        setStep('success')
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard-recent'] })
        queryClient.invalidateQueries({ queryKey: ['contacts'] })
        queryClient.invalidateQueries({ queryKey: ['followups'] })
      }
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save contact.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDuplicateCreateNew() {
    if (!dupInfo) return
    setIsSubmitting(true)
    try {
      const payload = { ...dupInfo.reviewedData, force_create: true }
      const res = await confirmBusinessCard(payload)
      if ('data' in res) {
        setSavedContact((res as { data: Contact }).data)
        setStep('success')
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
        queryClient.invalidateQueries({ queryKey: ['contacts'] })
        queryClient.invalidateQueries({ queryKey: ['followups'] })
      }
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDuplicateMerge() {
    if (!dupInfo) return
    setIsSubmitting(true)
    try {
      const payload = { ...dupInfo.reviewedData, merge_with_id: dupInfo.existing.Contact_ID }
      const res = await confirmBusinessCard(payload)
      if ('data' in res) {
        setSavedContact((res as { data: Contact }).data)
        setStep('success')
        queryClient.invalidateQueries({ queryKey: ['contacts'] })
      }
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Merge failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function reset() {
    setStep('upload')
    setExtraction(null)
    setSavedContact(null)
    setDupInfo(null)
    setExtractionError('')
    setSubmitError('')
    setEventSource('')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-indigo-650 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-zinc-900 dark:text-white font-semibold text-lg">Business Card Scanner</h1>
          <p className="text-zinc-550 dark:text-zinc-400 text-xs md:text-sm font-medium">Powered by Gemini Vision AI</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 px-1">
        {(['upload', 'review', 'success'] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold
              ${step === s || (step === 'duplicate' && s === 'review')
                ? 'bg-indigo-600 text-white'
                : step === 'success' || (i < ['upload', 'review', 'success'].indexOf(step))
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-700'
              }`}
            >
              {i + 1}
            </div>
            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{s === 'success' ? 'Done' : s}</span>
            {i < 2 && <div className="w-8 h-px bg-zinc-200 dark:bg-zinc-800" />}
          </div>
        ))}
      </div>

      {/* Main content card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 shadow-sm transition-colors">
        {step === 'upload' && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-zinc-550 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                Event Source (optional)
              </label>
              <input
                type="text"
                value={eventSource}
                onChange={e => setEventSource(e.target.value)}
                placeholder="e.g. ASSOCHAM Infrastructure Summit 2024"
                className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition placeholder-zinc-400"
              />
            </div>
            <UploadZone onImageReady={handleImageReady} isLoading={isExtracting} />
            {extractionError && (
              <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-lg px-4 py-3 text-rose-700 dark:text-rose-455 text-sm font-semibold">
                {extractionError}
              </div>
            )}
          </div>
        )}

        {step === 'review' && extraction && (
          <div className="space-y-4">
            <h2 className="text-zinc-900 dark:text-white font-semibold text-base">Review Extracted Information</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs md:text-sm font-medium">
              AI extracted the fields below. Edit anything that needs correction, then save.
            </p>
            {submitError && (
              <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-lg px-4 py-3 text-rose-700 dark:text-rose-455 text-sm font-semibold">
                {submitError}
              </div>
            )}
            <ExtractionReview
              extracted={extraction.data}
              rawJson={extraction.raw_extraction_json}
              confidence={extraction.confidence}
              eventSource={eventSource}
              onConfirm={handleConfirm}
              onCancel={reset}
              isSubmitting={isSubmitting}
            />
          </div>
        )}

        {step === 'success' && savedContact && (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-450" />
            </div>
            <div>
              <h2 className="text-zinc-900 dark:text-white font-bold text-lg">Contact Saved!</h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1 font-medium">
                {savedContact.Name || savedContact.Company} has been added to your contacts.
              </p>
            </div>
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => router.push(`/contacts/${savedContact.Contact_ID}`)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-sm transition"
              >
                View Contact
              </button>
              <button
                onClick={reset}
                className="px-4 py-2 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm transition"
              >
                Scan Another Card
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Duplicate modal */}
      {step === 'duplicate' && dupInfo && (
        <DuplicateModal
          existing={dupInfo.existing}
          incoming={dupInfo.incoming}
          confidence={dupInfo.confidence}
          matchReason={dupInfo.reason}
          onCreateNew={handleDuplicateCreateNew}
          onMerge={handleDuplicateMerge}
          onSkip={reset}
          isLoading={isSubmitting}
        />
      )}
    </div>
  )
}
