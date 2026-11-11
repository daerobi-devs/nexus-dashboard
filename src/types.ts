export interface Wallet {
  id: string;
  name: string;
  bank_code: string;
  account_number: string;
  balance: number;
  accent: string;
}

export interface Transaction {
  id: string;
  code: string;
  title: string;
  category: string;
  type: 'income' | 'expense';
  amount: number;
  wallet_id: string;
  status: string;
  created_at: string;
}

export interface SubtaskItem {
  id: string;
  task_id: string;
  title: string;
  is_done: boolean;
  created_at: string;
}

export interface TaskItem {
  id: string;
  title: string;
  scope: 'kuliah' | 'klien';
  subject_or_client: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'high' | 'medium' | 'low';
  due_date: string;
  budget_or_weight: string;
  notes: string;
  drive_link: string;
  created_at: string;
  subtasks: SubtaskItem[];
}

export interface MaintenanceItem {
  id: string;
  app_name: string;
  client_name: string;
  environment: string;
  url: string;
  status: 'Healthy' | 'Maintenance' | 'Warning';
  uptime_percent: number;
  monthly_fee: number;
  last_ping_ms: number;
  last_checked_at: string;
  next_check_date: string;
}

export interface MaintenanceLog {
  id: string;
  maintenance_id: string;
  event: string;
  latency_ms: number;
  status: string;
  created_at: string;
}

export interface InvoiceLineItem {
  desc: string;
  qty: number;
  price: number;
}

export interface InvoiceItem {
  id: string;
  invoice_number: string;
  client_name: string;
  project_title: string;
  items_json: string;
  items: InvoiceLineItem[];
  total_amount: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Menunggu Verifikasi' | string;
  due_date: string;
  created_at: string;
  payment_proof?: string;
  payment_proof_note?: string;
}

export interface GoogleWorkspaceItem {
  id: string;
  kind: 'drive' | 'gmail' | 'calendar';
  account: string;
  title: string;
  subtitle: string;
  snippet: string;
  web_link: string;
  updated_at: string;
}

export interface AiMessage {
  id: string;
  source: 'dashboard' | 'telegram';
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  module: string;
  action: string;
  detail: string;
  created_at: string;
}

export interface CashflowPoint {
  month: string;
  income: number;
  expense: number;
}

export interface TelegramStatus {
  connected: boolean;
  polling: boolean;
  username: string;
  chatId: string;
}

export interface CrmClient {
  id: string;
  name: string;
  company: string;
  role: string;
  phone: string;
  email: string;
  segment: 'Enterprise' | 'UMKM' | 'Institusi' | string;
  status: 'Active' | 'Lead' | 'Retainer' | string;
  lifetime_value: number;
  last_contact_at: string;
  notes: string;
  created_at: string;
}

export interface CrmDeal {
  id: string;
  client_id: string;
  title: string;
  company: string;
  value: number;
  stage: 'Lead' | 'Discovery' | 'Proposal' | 'Negotiation' | 'Won';
  probability: number;
  expected_close_date: string;
  next_action: string;
  created_at: string;
}

export interface AcademicCourse {
  id: string;
  code: string;
  name: string;
  lecturer: string;
  sks: number;
  day_time: string;
  room: string;
  attendance_count: number;
  total_meetings: number;
  midterm_score: number;
  task_score: number;
  target_grade: string;
}

export interface MentariForumPending {
  id: string;
  topicId?: string;
  courseCode: string;
  courseName: string;
  sectionName: string;
  topicTitle: string;
  content?: string;
  replyCount?: number;
  url: string;
  isReplied: boolean;
}

export interface MentariQuizItem {
  id: string;
  courseCode: string;
  courseName: string;
  sectionName: string;
  title: string;
  kind: string;
  completed: boolean;
  grade?: string | number | null;
  url?: string;
}

export interface MentariSyncState {
  id?: string;
  studentNim: string;
  studentName: string;
  syncedAt: string;
  courses?: any[];
  pendingForums: MentariForumPending[];
  quizzes: MentariQuizItem[];
  attendanceSummary?: {
    totalMeetings?: number;
    attendedMeetings?: number;
    attendancePercentage?: number;
  };
  lastNotifiedForumCount?: number;
  lastNotifiedAt?: string;
}

export interface UnpamBillingItem {
  id: string;
  name: string;
  amount: number;
  status: 'Lunas' | 'Belum Bayar' | 'Cicilan' | string;
  due_date?: string;
  notes?: string;
}

export interface UnpamBillingTransaction {
  receipt_number: string;
  date: string;
  amount: number;
  channel: string;
  description: string;
  status: 'Terverifikasi' | 'Menunggu' | string;
}

export interface UnpamBillingState {
  id?: string;
  student_nim: string;
  student_name: string;
  semester: string;
  registration_status: string;
  total_billed: number;
  total_paid: number;
  total_remaining: number;
  va_mandiri: string;
  va_bni: string;
  va_bca: string;
  items: UnpamBillingItem[];
  transactions: UnpamBillingTransaction[];
  updated_at: string;
}

export interface PersonalHabit {
  id: string;
  title: string;
  category: 'Olahraga & Cycling' | 'Engineering & AI' | 'Akademik UNPAM' | string;
  target_per_week: number;
  current_streak: number;
  completed_today: boolean;
  unit_note: string;
  updated_at: string;
}

export interface PersonalGoal {
  id: string;
  title: string;
  domain: 'Bisnis & Agency' | 'Kuliah UNPAM' | 'Kebugaran & Pribadi' | string;
  current_value: number;
  target_value: number;
  unit: string;
  deadline: string;
  status: string;
}

export interface CoolifyResource {
  id: string;
  uuid: string;
  name: string;
  kind: 'application' | 'postgresql' | 'redis' | string;
  project_name: string;
  environment_name: string;
  fqdn: string;
  status: string;
  cpu_percent: number;
  memory_mb: number;
  last_deployed_at: string;
}

export interface GeneratedDocument {
  id: string;
  title: string;
  doc_type: 'unpam_makalah' | 'bisnis_proposal' | 'bisnis_mou' | string;
  client_or_course: string;
  author_nim: string;
  content_markdown: string;
  drive_url: string;
  created_at: string;
}

export interface FocusSession {
  id: string;
  title: string;
  domain: 'Proyek Klien' | 'Kuliah UNPAM' | 'Riset AI' | string;
  duration_minutes: number;
  hourly_rate: number;
  billable_amount: number;
  notes: string;
  created_at: string;
}

export interface CyclingLog {
  id: string;
  route_name: string;
  distance_km: number;
  duration_minutes: number;
  avg_speed_kmh: number;
  calories: number;
  elevation_m: number;
  notes: string;
  ride_date: string;
}

export interface JokiOrder {
  id: string;
  client_name: string;
  client_phone: string;
  university_or_origin: string;
  title: string;
  category: string;
  price: number;
  dp_paid: number;
  payment_status: 'Belum Bayar' | 'DP Masuk' | 'Menunggu Verifikasi' | 'Lunas' | string;
  status: 'todo' | 'in_progress' | 'review' | 'done' | string;
  progress_percent: number;
  deadline: string;
  deliverable_link: string;
  notes: string;
  created_at: string;
  payment_proof?: string;
  payment_proof_note?: string;
}

export interface HostingDomain {
  id: string;
  domain_or_service: string;
  provider: string;
  category: string;
  account_identity: string;
  panel_url: string;
  ip_or_dns: string;
  client_owner: string;
  renewal_cost: number;
  expiry_date: string;
  status: 'Active' | 'Expiring Soon' | 'Suspended' | string;
  notes: string;
}

export interface UpcomingDeadline {
  kind: string;
  title: string;
  subtitle: string;
  deadline: string;
  daysLeft: number;
  value: number;
}

export interface ProjectVaultItem {
  id: string;
  project_name: string;
  client_or_scope: string;
  repo_url: string;
  live_url: string;
  demo_username: string;
  demo_password: string;
  tech_stack: string;
  env_notes: string;
  updated_at: string;
}

export interface PostgresStatus {
  connected: boolean;
  host: string;
  port?: number;
  database: string;
  cloudbeaverUrl?: string;
  tablesSynced: number;
  totalRowsSynced: number;
  lastSyncedAt?: string;
  lastSyncAt?: string;
  error: string | null;
}

export interface StorageAsset {
  id: string;
  name: string;
  s3_key: string;
  bucket: string;
  mime_type: string;
  category: 'image' | 'video' | 'document' | 'audio' | 'archive' | 'other';
  original_size: number;
  compressed_size: number;
  compression_ratio: number;
  url: string;
  tags: string[];
  created_at: string;
}

export interface StorageAssetStats {
  totalCount: number;
  totalOriginalSize: number;
  totalCompressedSize: number;
  totalSavedBytes: number;
  overallSavedPercentage: number;
  bucket: string;
  endpoint: string;
  consoleUrl?: string;
}

export interface DashboardState {
  wallets: Wallet[];
  transactions: Transaction[];
  tasks: TaskItem[];
  maintenance: MaintenanceItem[];
  maintenanceLogs: MaintenanceLog[];
  invoices: InvoiceItem[];
  crmClients: CrmClient[];
  crmDeals: CrmDeal[];
  academicCourses: AcademicCourse[];
  personalHabits: PersonalHabit[];
  personalGoals: PersonalGoal[];
  coolifyResources: CoolifyResource[];
  generatedDocuments: GeneratedDocument[];
  focusSessions: FocusSession[];
  cyclingLogs: CyclingLog[];
  jokiOrders: JokiOrder[];
  hostingDomains: HostingDomain[];
  projectVault: ProjectVaultItem[];
  upcomingDeadlines: UpcomingDeadline[];
  googleItems: GoogleWorkspaceItem[];
  aiMessages: AiMessage[];
  activityLogs: ActivityLog[];
  settings: Record<string, string>;
  cashflowSeries: CashflowPoint[];
  dbFilePath: string;
  googleAccounts: string[];
  telegramStatus: TelegramStatus;
  postgresStatus?: PostgresStatus;
  mentariSync?: MentariSyncState | null;
  unpamBilling?: UnpamBillingState | null;
  storageAssets?: StorageAsset[];
  storageStats?: StorageAssetStats;
}
