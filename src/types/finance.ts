// ============================================================
// Smeduverse Finance API — TypeScript Types
// Auto-derived from Laravel backend models, resources & migrations
// ============================================================

// ── Pagination ──────────────────────────────────────────────

export interface PaginationLinks {
  first: string | null
  last: string | null
  prev: string | null
  next: string | null
}

export interface PaginationMeta {
  current_page: number
  from: number | null
  last_page: number
  path: string
  per_page: number
  to: number | null
  total: number
}

export interface PaginatedResponse<T> {
  data: T[]
  links: PaginationLinks
  meta: PaginationMeta
}

export interface SingleResponse<T> {
  data: T
}

// ── Auth ────────────────────────────────────────────────────

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface FinanceHealthResponse {
  service: string
  status: string
  authenticated_as: string | null
}

export interface User {
  id: string // UUID
  username: string
  email: string
  teacher?: Teacher | null
  identity?: Record<string, unknown> | null
  created_at: string // ISO 8601
  updated_at: string
}

export interface Teacher {
  teacher_id: string
  fullname: string
  niy?: string | null
  jenis_kelamin?: string | null
  photo?: string | null
}

export interface Student {
  student_id: string // UUID
  fullname: string
  nipd: string | null
  nisn: string | null
  photo?: string | null
  jenis_kelamin?: string | null
  rombel_aktif?: Rombel[]
  rombongan_belajar?: Rombel[]
  summary?: ReceivablesSummary | null
  by_status?: ReceivablesByStatus[]
}

export interface Rombel {
  id: string // UUID
  rombongan_belajar_id?: string
  nama?: string | null
  name?: string | null
  code?: string | null
  tingkat_kelas?: number | null
  jurusan_id?: number | null
  tahun_ajaran_id?: number | null
  status_aktif?: boolean | number
  is_active?: boolean
  image?: string | null
  anggota_count?: number
  summary?: ReceivablesSummary | null
  wali_id?: string | null
  wali_kelas?: {
    teacher_id?: string | null
    fullname?: string | null
  } | null
  pivot?: {
    student_id?: string
    rombongan_belajar_id?: string
    status?: number | string
    tanggal_masuk?: string | null
    tanggal_keluar?: string | null
    keterangan_masuk?: string | null
    keterangan_keluar?: string | null
    created_at?: string
  } | null
  jurusan?: {
    id?: number
    nama?: string | null
    name?: string | null
    code?: string | null
  } | null
  tahun_ajaran?: {
    id?: number
    nama?: string | null
    name?: string | null
    code?: string | null
    aktif?: boolean
    is_active?: boolean
  } | null
}

export interface TahunAjaran {
  id: number
  nama?: string | null
  name?: string | null
  code?: string | null
  aktif?: boolean
  is_active?: boolean
  rombongan_belajar_count?: number
}

export interface Semester {
  id: number
  nama?: string | null
  name?: string | null
  is_active?: boolean
}

export interface RefStudentsFilters {
  search?: string
  active?: boolean
  jenis_kelamin?: string
  rombongan_belajar_id?: string
  tahun_ajaran_id?: number
  semester_id?: number
  page?: number
  per_page?: number
}

export interface RefRombelsFilters {
  search?: string
  jurusan_id?: number
  tahun_ajaran_id?: number
  semester_id?: number
  tingkat_kelas?: number
  active_only?: boolean
  page?: number
  per_page?: number
}

// ── Fee Types ───────────────────────────────────────────────

export type BillingCycle = 'monthly' | 'one_time' | 'custom'

export interface FeeType {
  id: number
  code: string
  name: string
  description: string | null
  billing_cycle: BillingCycle
  allow_partial: boolean
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface StoreFeeTypeRequest {
  code: string
  name: string
  description?: string | null
  billing_cycle: BillingCycle
  allow_partial?: boolean
  is_active?: boolean
  sort_order?: number
}

export interface UpdateFeeTypeRequest {
  code?: string
  name?: string
  description?: string | null
  billing_cycle?: BillingCycle
  allow_partial?: boolean
  is_active?: boolean
  sort_order?: number
}

// ── Scholarships ────────────────────────────────────────────

export type DiscountType = 'fixed' | 'percent'

export interface Scholarship {
  id: number
  code: string
  name: string
  description: string | null
  discount_type: DiscountType
  discount_value: number
  finance_fee_type_id: number | null
  fee_type: FeeType | null
  start_date: string | null // YYYY-MM-DD
  end_date: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface StoreScholarshipRequest {
  code: string
  name: string
  description?: string | null
  discount_type: DiscountType
  discount_value: number
  finance_fee_type_id?: number | null
  start_date?: string | null
  end_date?: string | null
  is_active?: boolean
}

export interface UpdateScholarshipRequest {
  code?: string
  name?: string
  description?: string | null
  discount_type?: DiscountType
  discount_value?: number
  finance_fee_type_id?: number | null
  start_date?: string | null
  end_date?: string | null
  is_active?: boolean
}

export interface StudentScholarship {
  id: number
  student_id: string // UUID
  finance_scholarship_id: number
  semester_id: number
  tahun_ajaran_id: number
  start_date: string | null
  end_date: string | null
  is_active: boolean
  notes: string | null
  scholarship: Scholarship | null
  student: Student | null
  semester?: Semester | null
  tahun_ajaran?: TahunAjaran | null
  created_at: string
  updated_at: string
}

export interface AssignStudentScholarshipRequest {
  student_id: string
  finance_scholarship_id: number
  semester_id: number
  tahun_ajaran_id: number
  start_date?: string | null
  end_date?: string | null
  is_active?: boolean
  notes?: string | null
}

// ── Bills ───────────────────────────────────────────────────

export type BillStatus = 'unpaid' | 'partial' | 'paid' | 'void'

export interface BillAllocation {
  id: number
  finance_payment_id: number
  allocated_amount: number
  notes: string | null
}

export interface Bill {
  id: number
  bill_number: string
  student_id: string // UUID
  rombongan_belajar_id: string // UUID
  semester_id: number
  tahun_ajaran_id: number
  finance_fee_type_id: number
  finance_student_scholarship_id: number | null
  period_month: number | null
  period_year: number | null
  title: string
  description: string | null
  amount_gross: number // IDR integer
  amount_discount: number
  amount_net: number
  amount_paid: number
  amount_outstanding: number
  due_date: string | null // YYYY-MM-DD
  status: BillStatus
  issued_at: string | null
  paid_off_at: string | null
  voided_at: string | null
  fee_type: FeeType | null
  student_scholarship: StudentScholarship | null
  student: Student | null
  allocations: BillAllocation[]
  created_at: string
  updated_at: string
}

export interface BillFilters {
  student_id?: string
  semester_id?: number
  tahun_ajaran_id?: number
  rombongan_belajar_id?: string
  finance_fee_type_id?: number
  status?: BillStatus
  page?: number
  per_page?: number
}

export interface GenerateSppRequest {
  rombongan_belajar_id: string
  semester_id?: number
  tahun_ajaran_id?: number
  period_month: number // 1-12
  period_year: number
  amount: number // min 1, IDR integer
  due_date?: string
  title?: string
  description?: string
  student_ids?: string[] // UUIDs
}

export interface GenerateFeeRequest {
  finance_fee_type_id: number
  semester_id?: number
  tahun_ajaran_id?: number
  student_ids: string[] // at least 1
  amount: number
  due_date?: string
  title: string
  description?: string
  period_month?: number
  period_year?: number
}

export interface RecalculateBillsRequest {
  student_ids?: string[]
  rombongan_belajar_id?: string
  semester_id?: number
  tahun_ajaran_id?: number
  finance_student_scholarship_id?: number
}

export interface RecalculateBillsResponse {
  processed_count: number
  updated_count: number
}

// ── Payments ────────────────────────────────────────────────


export type PaymentStatus = 'confirmed' | 'void'
export type PaymentMethod = 'cash' | 'transfer' | 'other'

export interface PaymentAllocation {
  id: number
  finance_bill_id: number
  allocated_amount: number
  notes: string | null
}

export interface Payment {
  id: number
  payment_number: string
  student_id: string // UUID
  semester_id: number
  tahun_ajaran_id: number
  payment_date: string // YYYY-MM-DD
  total_amount: number // IDR integer
  payment_method: PaymentMethod
  reference_number: string | null
  notes: string | null
  status: PaymentStatus
  voided_at: string | null
  student: Student | null
  allocations: PaymentAllocation[]
  created_at: string
  updated_at: string
}

export interface PaymentFilters {
  student_id?: string
  semester_id?: number
  tahun_ajaran_id?: number
  status?: PaymentStatus
  page?: number
  per_page?: number
}

export interface StorePaymentRequest {
  student_id: string
  semester_id?: number
  tahun_ajaran_id?: number
  payment_date: string // YYYY-MM-DD
  total_amount: number
  payment_method: PaymentMethod
  reference_number?: string
  notes?: string
  auto_allocate?: boolean
  allocations?: {
    finance_bill_id: number
    allocated_amount: number
    notes?: string
  }[]
}

// ── Reports ─────────────────────────────────────────────────

export interface ReceivablesFilters {
  semester_id?: number
  tahun_ajaran_id?: number
  rombongan_belajar_id?: string
  student_id?: string
  status?: BillStatus
  start_date?: string
  end_date?: string
}

export interface ReceivablesSummary {
  total_bills: number
  total_gross: number
  total_discount: number
  total_net: number
  total_paid: number
  total_outstanding: number
}

export interface ReceivablesByStatus {
  status: BillStatus
  total_bills: number
  total_outstanding: number | string
}

export interface ReceivablesReport {
  summary: ReceivablesSummary
  by_status: ReceivablesByStatus[]
}

export interface CollectionsFilters {
  start_date?: string
  end_date?: string
  semester_id?: number
  tahun_ajaran_id?: number
  student_id?: string
}

export interface CollectionsSummary {
  total_transactions: number
  total_collected: number
}

export interface DailyCollection {
  date: string
  total_transactions: number
  total_collected: number
}

export interface CollectionsReport {
  summary: CollectionsSummary
  daily: DailyCollection[]
}

export interface StudentLedger {
  student_id: string
  bills: Bill[]
  payments: Payment[]
}

// ── API Error ───────────────────────────────────────────────

export interface ApiValidationError {
  message: string
  errors: Record<string, string[]>
}

export interface ApiError {
  message: string
  status: number
}
