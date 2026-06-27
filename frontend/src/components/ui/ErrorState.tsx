// src/components/ui/ErrorState.tsx
// Consistent error display for all pages when the API fails

import { AlertTriangle, RefreshCw, WifiOff } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  /** True when the error is a network/connection error (backend down) */
  isNetworkError?: boolean;
}

export default function ErrorState({
  title,
  message,
  onRetry,
  isNetworkError = false,
}: ErrorStateProps) {
  const Icon = isNetworkError ? WifiOff : AlertTriangle;

  const defaultTitle = isNetworkError
    ? "Cannot reach backend"
    : "Failed to load data";

  const defaultMessage = isNetworkError
    ? `Make sure the backend is running at ${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'} and try again.`
    : "An unexpected error occurred while fetching data from the API.";

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-rose-400" />
      </div>

      <h3 className="text-[15px] font-semibold text-slate-200 mb-1.5">
        {title ?? defaultTitle}
      </h3>

      <p className="text-[13px] text-slate-500 max-w-sm leading-relaxed mb-5">
        {message ?? defaultMessage}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#4F7CFF]/15 border border-[#4F7CFF]/25 text-[#7CA4FF] text-[13px] font-medium hover:bg-[#4F7CFF]/25 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Try again
        </button>
      )}
    </div>
  );
}

/** Inline variant for use inside cards/sections */
export function InlineError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-rose-500/[0.07] border border-rose-500/15">
      <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
      <p className="text-[12px] text-rose-300 flex-1">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-[11px] text-rose-400 hover:text-rose-300 underline transition-colors flex-shrink-0"
        >
          Retry
        </button>
      )}
    </div>
  );
}
