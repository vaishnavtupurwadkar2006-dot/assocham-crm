// src/types/index.ts

// ── Contact ───────────────────────────────────────────────────────────────────

export interface Contact {
  Contact_ID: string
  Name?: string
  Designation?: string
  Company?: string
  Parent_Organization?: string
  Sector?: string
  Company_Type?: string
  Address?: string
  City?: string
  State?: string
  Country?: string
  Phone?: string
  Alternate_Phone?: string
  Email?: string
  Alternate_Email?: string
  Website?: string
  LinkedIn?: string
  Contact_Priority?: 'High' | 'Medium' | 'Low'
  Status?: 'Active' | 'Inactive' | 'Pending' | 'Archived'
  Event_Source?: string
  Source_Type?: string
  Import_Source?: string
  Date_Added?: string
  Last_Updated?: string
  Next_Followup_Date?: string
  AI_Tags?: string[]
  AI_Summary?: string
  Notes?: string
  Raw_Extraction_JSON?: string
}

export interface PaginationMeta {
  page: number
  page_size: number
  total: number
  total_pages: number
}

export interface ContactListResponse {
  success: boolean
  data: Contact[]
  meta: PaginationMeta
}

export interface ContactDetailResponse {
  success: boolean
  data: Contact
}

export interface DuplicateCheckResponse {
  success: boolean
  is_duplicate: boolean
  confidence: number
  match_reason?: string
  existing_contact?: Contact
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export type UserRole = 'Admin' | 'Staff' | 'Intern'

export interface User {
  user_id: string
  name: string
  email: string
  role: UserRole
  department?: string
  status: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  success: boolean
  data: User
  access_token: string
  token_type: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
}

// ── Business Card ─────────────────────────────────────────────────────────────

export interface ExtractedFields {
  name?: string
  designation?: string
  company?: string
  parent_organization?: string
  phone?: string
  alternate_phone?: string
  email?: string
  alternate_email?: string
  website?: string
  linkedin?: string
  address?: string
  city?: string
  state?: string
  country?: string
  sector?: string
  notes?: string
}

export interface ExtractionResponse {
  success: boolean
  data: ExtractedFields
  raw_extraction_json: string
  confidence: number
  extraction_notes?: string
}

export interface BulkExtractionResult {
  card_index: number
  success: boolean
  extracted?: ExtractedFields
  raw_extraction_json?: string
  error?: string
}

export interface BulkExtractionResponse {
  success: boolean
  data: BulkExtractionResult[]
  total: number
  succeeded: number
  failed: number
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export interface DashboardStats {
  total_contacts: number
  total_organizations: number
  total_states: number
  total_sectors: number
  upcoming_followups: number
  new_this_month: number
  high_priority_count: number
  business_card_imports: number
}

export interface ChartDataPoint {
  name: string
  value: number
}

export interface DashboardChartData {
  by_sector: ChartDataPoint[]
  by_state: ChartDataPoint[]
  by_source_type: ChartDataPoint[]
  growth_by_month: ChartDataPoint[]
}

export interface RecentContactItem {
  contact_id: string
  name?: string
  company?: string
  sector?: string
  source_type?: string
  date_added?: string
}

export interface FollowUpItem {
  contact_id: string
  name?: string
  company?: string
  phone?: string
  followup_date: string
  days_until: number
  is_overdue: boolean
}

export interface FollowUpSummary {
  due_today: FollowUpItem[]
  due_this_week: FollowUpItem[]
  overdue: FollowUpItem[]
}

export interface DataQualityIssue {
  contact_id: string
  name?: string
  company?: string
  missing_fields: string[]
}

export interface DataQualitySummary {
  missing_email: number
  missing_phone: number
  missing_linkedin: number
  missing_sector: number
  potential_duplicates: number
  incomplete_contacts: DataQualityIssue[]
}

// ── AI Search ─────────────────────────────────────────────────────────────────

export interface AISearchMeta {
  used_gemini: boolean
  parsed_filters: Record<string, unknown>
  total_results: number
  explanation: string
  available_sectors: string[]
  available_states: string[]
}

export interface AISearchResponse {
  success: boolean
  data: Contact[]
  meta: AISearchMeta
}

// ── API generic ───────────────────────────────────────────────────────────────

export interface ApiError {
  success: false
  error: string
  data: null
}

export interface ApiSuccess<T> {
  success: true
  data: T
}
