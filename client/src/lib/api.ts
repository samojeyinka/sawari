/* ------------------------------------------------------------------ */
/*  API client for the Sawari backend.                                 */
/*  - authenticates with the httpOnly cookie (credentials: 'include')  */
/*  - unwraps the { success, data, meta } envelope                     */
/*  - throws ApiError carrying the server's message/code on failure    */
/* ------------------------------------------------------------------ */

import type {
  AppNotification,
  AssessmentResult,
  ExperienceLevel,
  GoalReason,
  Intensity,
  LearningFormat,
  LearningPath,
  PathSection,
  PathStats,
  Project,
  ProjectFeedback,
  ProjectTask,
  SessionContent,
  WeeklyHours,
} from '../types'
import { advanceSections } from './sections'

const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000/api/v1'

export interface ApiErrorBody {
  code?: string
  message?: string
  details?: unknown
}

export class ApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly details?: unknown

  constructor(message: string, init: { status: number; code?: string; details?: unknown }) {
    super(message)
    this.name = 'ApiError'
    this.status = init.status
    this.code = init.code
    this.details = init.details
  }

  /** True when the session is missing or expired. */
  get isUnauthorized(): boolean {
    return this.status === 401
  }
}

interface Envelope<T> {
  success: boolean
  data?: T
  error?: ApiErrorBody
  meta?: unknown
}

/** Human headings for the error codes the server actually sends. */
const ERROR_CODE_TITLES: Record<string, string> = {
  network_error: 'No connection',
  rate_limited: 'Too many requests',
  validation_failed: 'Check your input',
  email_unverified: 'Verify your email',
  ai_unavailable: 'AI unavailable',
  mail_unconfigured: 'Email is not configured',
  account_deleted: 'Account deleted',
  internal_error: 'Server error',
}

/**
 * Short heading for an API error so its `code` reaches the UI instead of
 * being silently swallowed. Falls back to the raw code.
 */
export function apiErrorTitle(error: unknown): string | undefined {
  if (!(error instanceof ApiError) || !error.code) return undefined
  return ERROR_CODE_TITLES[error.code] ?? error.code
}

/**
 * Turns any thrown value into a user-facing message, reading the ApiError
 * `details` payload (field errors, detail message) before its bare message.
 */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    const fields = (error.details as { fields?: Record<string, string[]> } | undefined)?.fields
    if (fields) {
      const parts = Object.values(fields).flat().filter(Boolean)
      if (parts.length) return parts.join(' ')
    }
    if (typeof error.details === 'string' && error.details.trim()) {
      return error.details.trim()
    }
    const detailMessage = (error.details as { message?: unknown } | undefined)?.message
    if (typeof detailMessage === 'string' && detailMessage.trim()) return detailMessage.trim()
    if (error.message) return error.message
    if (error.code) return `${fallback} (${error.code})`
    return fallback
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}

export interface ApiUser {
  id: string
  firstName: string
  lastName: string | null
  email: string
  emailVerified: boolean
  avatar: string | null
  provider: 'local' | 'github' | 'google'
  activePathId: string | null
  createdAt: string
  /** Present when the server knows; false for OAuth accounts with no password yet. */
  hasPassword?: boolean
}

export interface RegisterInput {
  firstName: string
  lastName?: string
  email: string
  password: string
}

export interface LoginInput {
  email: string
  password: string
}

interface RequestOptions {
  method?: string
  body?: unknown
  signal?: AbortSignal
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal } = options
  const headers = new Headers({ Accept: 'application/json' })
  let payload: string | undefined
  if (body !== undefined) {
    headers.set('Content-Type', 'application/json')
    payload = JSON.stringify(body)
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: payload,
      credentials: 'include',
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError('Cannot reach the server. Check your connection and try again.', {
      status: 0,
      code: 'network_error',
    })
  }

  if (response.status === 204) return undefined as T

  const envelope = (await response.json().catch(() => null)) as Envelope<T> | null

  if (!response.ok || !envelope?.success) {
    throw new ApiError(envelope?.error?.message ?? `Request failed (${response.status}).`, {
      status: response.status,
      code: envelope?.error?.code,
      details: envelope?.error?.details,
    })
  }

  return envelope.data as T
}

export const authApi = {
  register: (input: RegisterInput) =>
    request<ApiUser>('/auth/register', { method: 'POST', body: input }),
  verifyEmail: (code: string) =>
    request<ApiUser>('/auth/verify-email', { method: 'POST', body: { code } }),
  resendVerificationCode: () =>
    request<{ message: string }>('/auth/resend-code', { method: 'POST' }),
  forgotPassword: (email: string) =>
    request<{ message: string }>('/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (token: string, password: string) =>
    request<{ message: string }>('/auth/reset-password', { method: 'POST', body: { token, password } }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: { currentPassword, newPassword },
    }),
  setPassword: (newPassword: string) =>
    request<{ message: string }>('/auth/set-password', {
      method: 'POST',
      body: { newPassword },
    }),
  login: (input: LoginInput) => request<ApiUser>('/auth/login', { method: 'POST', body: input }),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
  me: (signal?: AbortSignal) => request<ApiUser>('/me', { signal }),
  updateMe: (patch: { firstName?: string; lastName?: string | null; activePathId?: string | null }) =>
    request<ApiUser>('/me', { method: 'PATCH', body: patch }),
  requestAccountDeletion: () =>
    request<{ message: string }>('/me/delete-request', { method: 'POST' }),
  confirmAccountDeletion: (token: string) =>
    request<{ message: string }>('/me/delete-confirm', { method: 'POST', body: { token } }),
  restoreAccount: (token: string) =>
    request<ApiUser>('/me/restore', { method: 'POST', body: { token } }),
  requestRestoreLink: (email: string) =>
    request<{ message: string }>('/me/restore-request', { method: 'POST', body: { email } }),
  requestEmailChange: (email: string) =>
    request<{ message: string; pendingEmail: string }>('/me/email-change-request', {
      method: 'POST',
      body: { email },
    }),
  confirmEmailChange: (code: string) =>
    request<ApiUser>('/me/email-change-confirm', { method: 'POST', body: { code } }),
  /** Absolute URL that starts a social sign-in flow (full-page navigation). */
  oauthUrl: (provider: 'github' | 'google') => `${API_BASE}/auth/${provider}`,
}

/* ------------------------------------------------------------------ */
/*  Learning paths                                                     */
/* ------------------------------------------------------------------ */

/** Shape returned by the API (server-generated id + timestamps). */
export interface ApiLearningPath {
  id: string
  subject: string
  goal: string
  experience: ExperienceLevel | null
  reason: GoalReason | null
  weeklyHours: WeeklyHours
  intensity: Intensity
  formats: LearningFormat[]
  targetDate: string | null
  sections: PathSection[]
  stats: PathStats
  currentSectionId: string | null
  completedActivities: string[]
  countedSessions: string[]
  assessmentResults: Record<string, AssessmentResult>
  adaptationNote: string | null
  generationStatus?: 'idle' | 'queued' | 'generating' | 'ready' | 'failed'
  generationError?: string | null
  generationStartedAt?: string | null
  generationFinishedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateLearningPathInput {
  subject: string
  goal?: string
  experience: ExperienceLevel | null
  reason: GoalReason | null
  weeklyHours: WeeklyHours
  intensity: Intensity
  formats: LearningFormat[]
  targetDate: string | null
  sections?: PathSection[]
}

export interface UpdateLearningPathInput {
  subject?: string
  goal?: string
  experience?: ExperienceLevel | null
  reason?: GoalReason | null
  weeklyHours?: WeeklyHours
  intensity?: Intensity
  formats?: LearningFormat[]
  targetDate?: string | null
  sections?: PathSection[]
  stats?: Partial<PathStats>
  currentSectionId?: string | null
  completedActivities?: string[]
  countedSessions?: string[]
  assessmentResults?: Record<string, AssessmentResult>
  adaptationNote?: string | null
}

/** Maps the API shape into the frontend domain shape. */
export function mapApiLearningPath(api: ApiLearningPath): LearningPath {
  return advanceSections({
    id: api.id,
    subject: api.subject,
    goal: api.goal,
    experience: api.experience,
    reason: api.reason,
    weeklyHours: api.weeklyHours,
    intensity: api.intensity,
    formats: api.formats,
    targetDate: api.targetDate ?? '',
    createdAt: api.createdAt.slice(0, 10),
    sections: api.sections ?? [],
    stats: api.stats,
    currentSectionId: api.currentSectionId ?? api.sections?.[0]?.id ?? '',
    completedActivities: api.completedActivities ?? [],
    countedSessions: api.countedSessions ?? [],
    assessmentResults: api.assessmentResults ?? {},
    adaptationNote: api.adaptationNote ?? null,
    generationStatus: api.generationStatus ?? 'ready',
    generationError: api.generationError ?? null,
    generationStartedAt: api.generationStartedAt ?? null,
    generationFinishedAt: api.generationFinishedAt ?? null,
  })
}

export const learningPathsApi = {
  list: (signal?: AbortSignal) =>
    request<ApiLearningPath[]>('/learning-paths', { signal }),
  get: (id: string, signal?: AbortSignal) =>
    request<ApiLearningPath>(`/learning-paths/${id}`, { signal }),
  create: (input: CreateLearningPathInput) =>
    request<ApiLearningPath>('/learning-paths', { method: 'POST', body: input }),
  update: (id: string, patch: UpdateLearningPathInput) =>
    request<ApiLearningPath>(`/learning-paths/${id}`, { method: 'PATCH', body: patch }),
  remove: (id: string) => request<void>(`/learning-paths/${id}`, { method: 'DELETE' }),
  /** Re-queues path building when generation has failed. */
  retry: (id: string) =>
    request<ApiLearningPath>(`/learning-paths/${id}/retry`, { method: 'POST' }),
  /** Asks the server to (re)design the path outline with AI. */
  outline: (id: string) =>
    request<ApiLearningPath>(`/learning-paths/${id}/outline`, { method: 'POST' }),
}

/* ------------------------------------------------------------------ */
/*  AI health                                                          */
/* ------------------------------------------------------------------ */

export interface AiHealthResponse {
  available: boolean
  model: string
  latencyMs: number
  error?: string
}

export interface EstimateTimelineInput {
  subject: string
  outcome?: string | null
  experience?: string | null
  weeklyHours?: string | null
  intensity?: string | null
}

export interface AiTimelineEstimate {
  recommendedMonths: number
  fastMonths: number
  relaxedMonths: number
  reason: string
}

export interface ReviewPracticeInput {
  prompt: string
  userAnswer: string
  modelAnswer?: string
  topic?: string
}

export interface PracticeReviewResult {
  status: 'correct' | 'close' | 'needs_improvement'
  acceptable: boolean
  score: number
  feedback: string
  improvements: string
}

import type { AdmireCandidate, GoalExtraction } from './goalExtract'

export const aiApi = {
  health: (signal?: AbortSignal) => request<AiHealthResponse>('/ai/health', { signal }),
  extractGoal: (mode: 'admire' | 'build', input: string) =>
    request<GoalExtraction>('/ai/extract-goal', { method: 'POST', body: { mode, input } }),
  /** Suggests real people matching a name or description, closest match first. */
  searchAdmire: (query: string) =>
    request<{ candidates: AdmireCandidate[] }>('/ai/admire-candidates', {
      method: 'POST',
      body: { query },
    }).then((res) => res.candidates),
  estimateTimeline: (input: EstimateTimelineInput, signal?: AbortSignal) =>
    request<AiTimelineEstimate>('/ai/timeline', { method: 'POST', body: input, signal }),
  reviewPractice: (input: ReviewPracticeInput, signal?: AbortSignal) =>
    request<PracticeReviewResult>('/ai/review-practice', { method: 'POST', body: input, signal }),
}

/* ------------------------------------------------------------------ */
/*  Session content (AI-generated, cached server-side per section)     */
/* ------------------------------------------------------------------ */

export const sessionsApi = {
  /** Returns cached content, or generates + caches it on first request. */
  getOrGenerate: (pathId: string, sectionId: string, regenerate = false) =>
    request<SessionContent>(
      `/learning-paths/${pathId}/sections/${sectionId}/session${regenerate ? '?regenerate=true' : ''}`,
      { method: 'POST' },
    ),
  /** Every already-generated section for a path, keyed by section id. */
  list: (pathId: string) =>
    request<Record<string, SessionContent>>(`/learning-paths/${pathId}/sessions`),
}

/* ------------------------------------------------------------------ */
/*  Projects                                                           */
/* ------------------------------------------------------------------ */

export interface ApiProject {
  id: string
  pathId: string | null
  title: string
  description: string
  status: Project['status']
  level: string
  estHours: number
  objectives: string[]
  tasks: ProjectTask[]
  deliverables: string[]
  related: string[]
  completedTaskIds: string[]
  submitted: boolean
  reviewed: boolean
  submittedAt: string | null
  submissionNote: string | null
  feedback: ProjectFeedback | null
  createdAt: string
  updatedAt: string
}

export interface CreateProjectInput {
  title: string
  description?: string
  pathId?: string | null
  level?: string
  estHours?: number
  objectives?: string[]
  tasks?: ProjectTask[]
  deliverables?: string[]
  related?: string[]
}

export interface UpdateProjectInput {
  title?: string
  description?: string
  pathId?: string | null
  status?: Project['status']
  level?: string
  estHours?: number
  objectives?: string[]
  tasks?: ProjectTask[]
  deliverables?: string[]
  related?: string[]
  completedTaskIds?: string[]
  submitted?: boolean
  reviewed?: boolean
  submittedAt?: string | null
  submissionNote?: string | null
  feedback?: ProjectFeedback | null
}

/** Maps the API shape into the frontend domain shape. */
export function mapApiProject(api: ApiProject): Project {
  return {
    id: api.id,
    pathId: api.pathId ?? null,
    title: api.title,
    description: api.description,
    status: api.status,
    level: api.level,
    estHours: api.estHours,
    objectives: api.objectives ?? [],
    tasks: api.tasks ?? [],
    deliverables: api.deliverables ?? [],
    related: api.related ?? [],
    completedTaskIds: api.completedTaskIds ?? [],
    submitted: api.submitted,
    reviewed: api.reviewed,
    submittedAt: api.submittedAt ?? null,
    submissionNote: api.submissionNote ?? null,
    feedback: api.feedback ?? null,
  }
}

export const projectsApi = {
  list: (signal?: AbortSignal) => request<ApiProject[]>('/projects', { signal }),
  get: (id: string) => request<ApiProject>(`/projects/${id}`),
  create: (input: CreateProjectInput) =>
    request<ApiProject>('/projects', { method: 'POST', body: input }),
  update: (id: string, patch: UpdateProjectInput) =>
    request<ApiProject>(`/projects/${id}`, { method: 'PATCH', body: patch }),
  remove: (id: string) => request<void>(`/projects/${id}`, { method: 'DELETE' }),
  review: (id: string) => request<ApiProject>(`/projects/${id}/review`, { method: 'POST' }),
}

/* ------------------------------------------------------------------ */
/*  Notifications                                                      */
/* ------------------------------------------------------------------ */

export interface ApiNotification {
  id: string
  kind: AppNotification['kind']
  title: string
  body: string
  read: boolean
  link: string | null
  createdAt: string
}

/** Turns an ISO timestamp into the short relative label the drawer shows. */
export function formatNotificationTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''

  const now = new Date()
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const daysAgo = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000)

  if (daysAgo <= 0) return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  if (daysAgo === 1) return 'Yesterday'
  if (daysAgo < 7) return date.toLocaleDateString(undefined, { weekday: 'short' })
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/** Maps the API shape into the frontend domain shape. */
export function mapApiNotification(api: ApiNotification): AppNotification {
  return {
    id: api.id,
    title: api.title,
    body: api.body,
    time: formatNotificationTime(api.createdAt),
    read: api.read,
    kind: api.kind,
    link: api.link,
  }
}

export interface TestEmailResponse {
  delivered: boolean
  recipient: string
  subject: string
  inAppNotificationId: string
  error?: string
  message: string
}

export const notificationsApi = {
  list: (signal?: AbortSignal) => request<ApiNotification[]>('/notifications', { signal }),
  markRead: (id: string) =>
    request<ApiNotification>(`/notifications/${id}/read`, { method: 'POST' }),
  markAllRead: () =>
    request<{ unreadCount: number }>('/notifications/read-all', { method: 'POST' }),
  dismiss: (id: string) =>
    request<void>(`/notifications/${id}`, { method: 'DELETE' }),
  sendTestEmail: () =>
    request<TestEmailResponse>('/notifications/test-email', { method: 'POST', body: {} }),
}

/* ------------------------------------------------------------------ */
/*  Settings (reminder preferences)                                    */
/* ------------------------------------------------------------------ */

export interface ApiSettings {
  dailyReminder: boolean
  weeklySummary: boolean
  timezone: string
  reminderTime: string
  reminderDays: string[]
  restDay: boolean
  projectFeedback: boolean
  pathUpdates: boolean
  productNews: boolean
  weeklyHours: WeeklyHours
  intensity: Intensity
  formats: LearningFormat[]
  sessionLength: number
}

export interface UpdateSettingsInput {
  dailyReminder?: boolean
  weeklySummary?: boolean
  timezone?: string
  reminderTime?: string
  reminderDays?: string[]
  restDay?: boolean
  projectFeedback?: boolean
  pathUpdates?: boolean
  productNews?: boolean
  weeklyHours?: WeeklyHours
  intensity?: Intensity
  formats?: LearningFormat[]
  sessionLength?: number
}

export const settingsApi = {
  get: (signal?: AbortSignal) => request<ApiSettings>('/settings', { signal }),
  update: (patch: UpdateSettingsInput) =>
    request<ApiSettings>('/settings', { method: 'PATCH', body: patch }),
}

/* ------------------------------------------------------------------ */
/*  Billing (plan, path limits, PayPal Pro, own DeepSeek key)           */
/* ------------------------------------------------------------------ */

export interface ApiBillingStatus {
  plan: 'free' | 'pro'
  hasOwnKey: boolean
  aiKeyLast4: string | null
  pathLimit: number
  pathsUsed: number
  canCreateMore: boolean
  proPaidAt: string | null
  proPriceUsd: string
  paypalConfigured: boolean
  paypalMode: 'sandbox' | 'live'
}

export const billingApi = {
  status: (signal?: AbortSignal) => request<ApiBillingStatus>('/billing/status', { signal }),
  createOrder: () => request<{ orderId: string }>('/billing/paypal/orders', { method: 'POST' }),
  captureOrder: (orderId: string) =>
    request<ApiBillingStatus>('/billing/paypal/capture', { method: 'POST', body: { orderId } }),
  saveAiKey: (key: string) =>
    request<ApiBillingStatus>('/billing/ai-key', { method: 'POST', body: { provider: 'deepseek', key } }),
  removeAiKey: () => request<ApiBillingStatus>('/billing/ai-key', { method: 'DELETE' }),
}
