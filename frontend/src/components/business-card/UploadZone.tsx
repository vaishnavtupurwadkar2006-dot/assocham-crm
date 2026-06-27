'use client'
// src/components/business-card/UploadZone.tsx
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Camera, Upload, X, AlertCircle } from 'lucide-react'

interface UploadZoneProps {
  onImageReady: (base64: string, mimeType: string, file: File) => void
  isLoading?: boolean
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']
const MAX_SIZE_MB = 10

export default function UploadZone({ onImageReady, isLoading }: UploadZoneProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback((accepted: File[], rejected: any[]) => {
    setError(null)
    if (rejected.length > 0) {
      const reason = rejected[0]?.errors[0]?.message || 'Invalid file'
      setError(`File rejected: ${reason}`)
      return
    }
    const file = accepted[0]
    if (!file) return
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Please upload a JPG, PNG, WebP, or HEIC image.')
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File is too large. Maximum size is ${MAX_SIZE_MB}MB.`)
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      // Extract base64 portion (strip data URI prefix)
      const base64 = result.split(',')[1]
      setPreview(result)
      onImageReady(base64, file.type, file)
    }
    reader.readAsDataURL(file)
  }, [onImageReady])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.heic'] },
    maxFiles: 1,
    disabled: isLoading,
  })

  const clear = () => {
    setPreview(null)
    setError(null)
  }

  if (preview) {
    return (
      <div className="relative">
        <div className="relative rounded-xl overflow-hidden bg-gray-800 border border-gray-700">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Business card preview"
            className="w-full max-h-80 object-contain"
          />
          {!isLoading && (
            <button
              onClick={clear}
              className="absolute top-3 right-3 w-8 h-8 bg-gray-900/80 hover:bg-red-900/80 border border-gray-600 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-400 transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {isLoading && (
            <div className="absolute inset-0 bg-gray-900/70 flex flex-col items-center justify-center">
              <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-white text-sm font-medium">Extracting with Gemini AI...</p>
              <p className="text-gray-400 text-xs mt-1">This usually takes 3–8 seconds</p>
            </div>
          )}
        </div>
        {!isLoading && (
          <p className="text-center text-gray-400 text-xs mt-2">
            Card preview — click × to upload a different card
          </p>
        )}
      </div>
    )
  }

  return (
    <div>
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all
          ${isDragActive
            ? 'border-blue-500 bg-blue-950/30'
            : 'border-gray-700 hover:border-gray-500 hover:bg-gray-800/30 bg-gray-900/50'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-gray-800 flex items-center justify-center">
            {isDragActive
              ? <Camera className="w-7 h-7 text-blue-400" />
              : <Upload className="w-7 h-7 text-gray-400" />
            }
          </div>
          <div>
            <p className="text-white font-medium text-sm">
              {isDragActive ? 'Drop the business card here' : 'Upload a business card'}
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Drag & drop, or click to browse
            </p>
            <p className="text-gray-500 text-xs mt-1">
              JPG, PNG, WebP or HEIC · max {MAX_SIZE_MB}MB
            </p>
          </div>
        </div>
      </div>
      {error && (
        <div className="mt-3 flex items-start gap-2 text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}
    </div>
  )
}
