'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useQueryClient } from '@tanstack/react-query'
import { Upload, CheckCircle, Save } from 'lucide-react'
import BulkProgress from '@/components/business-card/BulkProgress'
import { bulkExtractBusinessCards, createContact } from '@/lib/api'
import type { BulkExtractionResult } from '@/types'

export default function BulkImportPage() {
  const queryClient = useQueryClient()
  const [files, setFiles] = useState<File[]>([])
  const [eventSource, setEventSource] = useState('')
  const [results, setResults] = useState<BulkExtractionResult[]>([])
  const [processed, setProcessed] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [savedCount, setSavedCount] = useState(0)
  const [error, setError] = useState('')

  const onDrop = useCallback((accepted: File[]) => {
    setFiles(accepted.slice(0, 100))
    setResults([])
    setProcessed(0)
    setIsDone(false)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.heic'] },
    multiple: true,
    disabled: isRunning,
  })

  async function fileToBase64(file: File): Promise<{ base64: string; mime: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = e => {
        const result = (e.target?.result as string) || ''
        resolve({ base64: result.split(',')[1], mime: file.type })
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  async function runExtraction() {
    if (files.length === 0) return
    setIsRunning(true)
    setResults([])
    setProcessed(0)
    setError('')
    setIsDone(false)

    try {
      const cards = await Promise.all(
        files.map(async (f, i) => {
          const { base64, mime } = await fileToBase64(f)
          return { image_base64: base64, mime_type: mime, card_index: i }
        })
      )

      const BATCH = 10
      const allResults: BulkExtractionResult[] = []
      for (let i = 0; i < cards.length; i += BATCH) {
        const batch = cards.slice(i, i + BATCH)
        const res = await bulkExtractBusinessCards({ cards: batch, event_source: eventSource || undefined })
        allResults.push(...res.data)
        setResults([...allResults])
        setProcessed(Math.min(i + BATCH, cards.length))
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Extraction failed.')
    } finally {
      setIsRunning(false)
      setIsDone(true)
    }
  }

  async function saveAll() {
    const successes = results.filter(r => r.success && r.extracted)
    setIsSaving(true)
    setSavedCount(0)
    let count = 0

    for (const r of successes) {
      if (!r.extracted) continue
      try {
        await createContact({
          Name: r.extracted.name,
          Designation: r.extracted.designation,
          Company: r.extracted.company || 'Unknown',
          Sector: r.extracted.sector,
          Phone: r.extracted.phone,
          Email: r.extracted.email,
          Website: r.extracted.website,
          LinkedIn: r.extracted.linkedin,
          Address: r.extracted.address,
          City: r.extracted.city,
          State: r.extracted.state,
          Country: r.extracted.country || 'India',
          Source_Type: 'Business Card',
          Import_Source: eventSource || 'Bulk Card Import',
          Event_Source: eventSource,
          Raw_Extraction_JSON: r.raw_extraction_json,
        })
        count++
        setSavedCount(count)
      } catch {
        // skip duplicates silently in bulk save
      }
    }

    setIsSaving(false)
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    queryClient.invalidateQueries({ queryKey: ['contacts'] })
    queryClient.invalidateQueries({ queryKey: ['followups'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard-followups'] })
  }

  const successCount = results.filter(r => r.success).length

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-zinc-900 dark:text-white font-semibold text-lg md:text-xl">Bulk Card Import</h1>
        <p className="text-zinc-550 dark:text-zinc-400 text-xs md:text-sm font-medium mt-0.5">Upload up to 100 business cards for batch AI extraction.</p>
      </div>

      {!isRunning && !isDone && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 space-y-5 shadow-sm transition-colors">
          <div>
            <label className="block text-xs font-semibold text-zinc-550 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">Event Source (optional)</label>
            <input
              type="text"
              value={eventSource}
              onChange={e => setEventSource(e.target.value)}
              placeholder="e.g. ASSOCHAM Conclave 2024"
              className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition placeholder-zinc-400"
            />
          </div>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-all ${
              isDragActive 
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/25' 
                : 'border-zinc-300 dark:border-zinc-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-8 h-8 text-zinc-400 dark:text-zinc-550 mx-auto mb-3" />
            <p className="text-zinc-900 dark:text-white font-semibold text-sm">
              {isDragActive ? 'Drop cards here' : 'Drop business card images here'}
            </p>
            <p className="text-zinc-400 dark:text-zinc-500 text-xs mt-1 font-semibold">Supports JPG, PNG, WebP · max 100 cards</p>
          </div>
          {files.length > 0 && (
            <div className="flex items-center justify-between pt-1">
              <p className="text-zinc-700 dark:text-zinc-300 text-xs md:text-sm font-semibold">{files.length} file{files.length !== 1 ? 's' : ''} selected</p>
              <button
                onClick={runExtraction}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-sm transition"
              >
                Start Extraction
              </button>
            </div>
          )}
        </div>
      )}

      {(isRunning || isDone) && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 shadow-sm transition-colors space-y-5">
          <BulkProgress
            total={files.length}
            processed={processed}
            results={results}
            isRunning={isRunning}
          />

          {isDone && successCount > 0 && (
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-5 space-y-3">
              {savedCount > 0 ? (
                <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-lg px-4 py-3 shadow-sm">
                  <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-450" />
                  <p className="text-emerald-800 dark:text-emerald-300 text-sm font-semibold">{savedCount} contacts saved to Google Sheets.</p>
                </div>
              ) : (
                <button
                  onClick={saveAll}
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-sm transition disabled:bg-indigo-400 dark:disabled:bg-indigo-700"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? `Saving... (${savedCount}/${successCount})` : `Save ${successCount} extracted contacts`}
                </button>
              )}
            </div>
          )}

          {error && (
            <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-lg px-4 py-3 text-rose-700 dark:text-rose-455 text-sm font-semibold">{error}</div>
          )}
        </div>
      )}
    </div>
  )
}
