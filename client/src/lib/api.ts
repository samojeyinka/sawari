/* ------------------------------------------------------------------ */
/*  API client for the Sawari backend.                                 */
/*  - authenticates with the httpOnly cookie (credentials: 'include')  */
/*  - unwraps the { success, data, meta } envelope                     */
/*  - throws ApiError carrying the server's message/code on failure    */
/* ------------------------------------------------------------------ */

import type {
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
  WeeklyHours,
} from '../types'

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
  return {
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
  }
}

export const learningPathsApi = {
  list: (signal?: AbortSignal) =>
    request<ApiLearningPath[]>('/learning-paths', { signal }),
  get: (id: string) => request<ApiLearningPath>(`/learning-paths/${id}`),
  create: (input: CreateLearningPathInput) =>
    request<ApiLearningPath>('/learning-paths', { method: 'POST', body: input }),
  update: (id: string, patch: UpdateLearningPathInput) =>
    request<ApiLearningPath>(`/learning-paths/${id}`, { method: 'PATCH', body: patch }),
  remove: (id: string) => request<void>(`/learning-paths/${id}`, { method: 'DELETE' }),
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
