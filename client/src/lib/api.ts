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

export interface ApiUser {
  id: string
  firstName: string
  lastName: string | null
  email: string
  emailVerified: boolean
  avatar: string | null
  provider: 'local' | 'github' | 'google'
  createdAt: string
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
  login: (input: LoginInput) => request<ApiUser>('/auth/login', { method: 'POST', body: input }),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
  me: (signal?: AbortSignal) => request<ApiUser>('/me', { signal }),
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

import type { GoalExtraction } from './goalExtract'

export const aiApi = {
  health: (signal?: AbortSignal) => request<AiHealthResponse>('/ai/health', { signal }),
  extractGoal: (mode: 'admire' | 'build', input: string) =>
    request<GoalExtraction>('/ai/extract-goal', { method: 'POST', body: { mode, input } }),
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
  feedback?: ProjectFeedback | null
}

/** Maps the API shape into the frontend domain shape. */
export function mapApiProject(api: ApiProject): Project {
  return {
    id: api.id,
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
  sendTestEmail: (input?: { targetEmail?: string }) =>
    request<TestEmailResponse>('/notifications/test-email', { method: 'POST', body: input ?? {} }),
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
}

export interface UpdateSettingsInput {
  dailyReminder?: boolean
  weeklySummary?: boolean
  timezone?: string
  reminderTime?: string
  reminderDays?: string[]
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
