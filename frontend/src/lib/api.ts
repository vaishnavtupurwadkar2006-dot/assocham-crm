// src/lib/api.ts
import type {
  AISearchResponse,
  BulkExtractionResponse,
  Contact,
  ContactDetailResponse,
  ContactListResponse,
  DashboardChartData,
  DashboardStats,
  DataQualitySummary,
  DuplicateCheckResponse,
  ExtractionResponse,
  FollowUpSummary,
  LoginRequest,
  LoginResponse,
  RecentContactItem,
  User,
} from '@/types'

export const BASE_URL = '/api/v1'

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('assocham_token')
    : null

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  })

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('assocham_token')
      localStorage.removeItem('assocham_user')
      window.location.href = '/login'
    }
    throw new Error('Session expired. Please log in again.')
  }

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || data.detail || `Request failed: ${res.status}`)
  }

  return data as T
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const res = await apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (res.access_token && typeof window !== 'undefined') {
    localStorage.setItem('assocham_token', res.access_token)
    localStorage.setItem('assocham_user', JSON.stringify(res.data))
  }
  return res
}

export async function logout(): Promise<void> {
  try {
    await apiFetch('/auth/logout', { method: 'POST' })
  } finally {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('assocham_token')
      localStorage.removeItem('assocham_user')
    }
  }
}

export async function getMe(): Promise<{ success: boolean; data: User }> {
  return apiFetch('/auth/me')
}

// ── Contacts ──────────────────────────────────────────────────────────────────

export interface ContactFilters {
  search?: string
  sector?: string
  state?: string
  city?: string
  priority?: string
  status?: string
  source_type?: string
  company_type?: string
  page?: number
  page_size?: number
}

export async function getContacts(filters: ContactFilters = {}): Promise<ContactListResponse> {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v))
  })
  return apiFetch(`/contacts?${params}`)
}

export async function getContact(id: string): Promise<ContactDetailResponse> {
  return apiFetch(`/contacts/${id}`)
}

export async function createContact(data: Partial<Contact>): Promise<ContactDetailResponse> {
  return apiFetch('/contacts', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateContact(id: string, data: Partial<Contact>): Promise<ContactDetailResponse> {
  return apiFetch(`/contacts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteContact(id: string): Promise<{ success: boolean; message: string }> {
  return apiFetch(`/contacts/${id}`, { method: 'DELETE' })
}

export async function checkDuplicate(params: {
  email?: string
  phone?: string
  name?: string
  company?: string
  exclude_id?: string
}): Promise<DuplicateCheckResponse> {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, v) })
  return apiFetch(`/contacts/check-duplicate?${qs}`)
}

// ── Business Card ─────────────────────────────────────────────────────────────

export async function extractBusinessCard(payload: {
  image_base64: string
  mime_type: string
  event_source?: string
}): Promise<ExtractionResponse> {
  return apiFetch('/business-card/extract', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function confirmBusinessCard(data: Record<string, unknown>): Promise<ContactDetailResponse | { success: false; duplicate: DuplicateCheckResponse }> {
  const res = await fetch(`${BASE_URL}/business-card/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('assocham_token') || '' : ''}`,
    },
    credentials: 'include',
    body: JSON.stringify(data),
  })
  return res.json()
}

export async function bulkExtractBusinessCards(payload: {
  cards: { image_base64: string; mime_type: string; card_index: number }[]
  event_source?: string
}): Promise<BulkExtractionResponse> {
  return apiFetch('/business-card/bulk-extract', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export async function getDashboardStats(): Promise<{ success: boolean; data: DashboardStats }> {
  return apiFetch('/dashboard/stats')
}

export async function getDashboardCharts(): Promise<{ success: boolean; data: DashboardChartData }> {
  return apiFetch('/dashboard/charts')
}

export async function getRecentActivity(limit = 10): Promise<{ success: boolean; data: RecentContactItem[] }> {
  return apiFetch(`/dashboard/recent?limit=${limit}`)
}

export async function getFollowUps(): Promise<{ success: boolean; data: FollowUpSummary }> {
  return apiFetch('/dashboard/followups')
}

export async function getDataQuality(): Promise<{ success: boolean; data: DataQualitySummary }> {
  return apiFetch('/dashboard/data-quality')
}

// ── AI Search ─────────────────────────────────────────────────────────────────

export async function aiSearch(query: string): Promise<AISearchResponse> {
  return apiFetch('/ai-search', {
    method: 'POST',
    body: JSON.stringify({ query }),
  })
}

export async function getAISearchSuggestions(): Promise<{ success: boolean; data: string[] }> {
  return apiFetch('/ai-search/suggestions')
}

// ── Health ────────────────────────────────────────────────────────────────────

export async function getHealth(): Promise<Record<string, unknown>> {
  return apiFetch('/health')
}
