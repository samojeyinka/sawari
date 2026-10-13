/* ------------------------------------------------------------------ */
/*  Core domain types for the Sawari frontend prototype.               */
/*  Everything here is mock data shaped to be swapped for an API later. */
/* ------------------------------------------------------------------ */

export type ExperienceLevel = 'beginner' | 'some' | 'comfortable' | 'advanced'
export type GoalReason = 'career' | 'school' | 'growth' | 'career-change' | 'project' | 'other'
export type WeeklyHours = '2' | '5' | '10' | '15+'
export type LearningFormat = 'videos' | 'articles' | 'books' | 'exercises' | 'projects' | 'quizzes'
export type Intensity = 'relaxed' | 'balanced' | 'intensive'
export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
export type TimeWindow = 'morning' | 'afternoon' | 'evening' | 'anytime'

export interface SetupAnswers {
  subject: string
  experience: ExperienceLevel | null
  reason: GoalReason | null
  outcome: string
  weeklyHours: WeeklyHours | null
  days: Weekday[]
  timeWindow: TimeWindow | null
  formats: LearningFormat[]
  intensity: Intensity | null
  targetDate: string
}

export interface User {
  id: string
  name: string
  firstName: string
  email: string
  emailVerified: boolean
  joined: string
  timezone: string
}

/* ---------------------------- learning ---------------------------- */

export type ActivityKind = 'learn' | 'read' | 'practice' | 'check'

export interface SessionActivity {
  id: string
  kind: ActivityKind
  title: string
  minutes: number
}

export type LessonBlock =
  | { type: 'p'; text: string }
  | { type: 'h'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'steps'; items: string[] }
  | { type: 'note'; title: string; text: string }

export interface Lesson {
  id: string
  title: string
  minutes: number
  intro: string
  blocks: LessonBlock[]
}

export interface Resource {
  id: string
  title: string
  kind: 'article' | 'video' | 'book' | 'template'
  source: string
  minutes: number
  summary: string
  body: string[]
  /** Optional external link. When it is a YouTube/Vimeo URL the reader embeds
   *  the player inline so the learner watches without leaving the session. */
  url?: string
}

export interface PracticeItem {
  id: string
  label: string
  detail?: string
  options: string[]
  correctIndex: number
  feedback: string
}

export interface Practice {
  id: string
  title: string
  minutes: number
  brief: string
  kind: 'classify' | 'written'
  items?: PracticeItem[]
  prompt?: string
  modelAnswer?: string
}

export interface Question {
  id: string
  prompt: string
  choices: string[]
  correctIndex: number
  explanation: string
}

export interface Assessment {
  id: string
  title: string
  intro: string
  minutes: number
  /** Short topic name used in results, e.g. "stakeholder mapping". */
  topic?: string
  /** What to review when the score is low. */
  reviewTopic?: string
  questions: Question[]
}

export interface SessionContent {
  lesson: Lesson
  /** 1-3 resources per session (e.g. two videos + one article). */
  resources: Resource[]
  /** Legacy single-resource shape from older cached rows. */
  resource?: Resource
  practice: Practice
  assessment: Assessment
}

export type SectionStatus = 'completed' | 'current' | 'upcoming' | 'locked'

export interface PathSection {
  id: string
  order: number
  title: string
  description: string
  minutes: number
  status: SectionStatus
  doneMinutes: number
  note?: string
}

export interface PathStats {
  sessionsCompleted: number
  minutesLearned: number
  topicsExplored: number
  projectsCompleted: number
  week: number[] // minutes for the last 7 days, oldest first
}

export interface AssessmentResult {
  score: number
  total: number
  date: string
  firstAttempt: boolean
}

export type GenerationStatus = 'idle' | 'queued' | 'generating' | 'ready' | 'failed'

export interface LearningPath {
  id: string
  subject: string
  goal: string
  experience: ExperienceLevel | null
  reason: GoalReason | null
  weeklyHours: WeeklyHours
  intensity: Intensity
  formats: LearningFormat[]
  targetDate: string
  createdAt: string
  sections: PathSection[]
  stats: PathStats
  currentSectionId: string
  completedActivities: string[]
  countedSessions: string[]
  assessmentResults: Record<string, AssessmentResult>
  adaptationNote: string | null
  generationStatus?: GenerationStatus
  generationError?: string | null
  generationStartedAt?: string | null
  generationFinishedAt?: string | null
}

/* ----------------------------- projects --------------------------- */

export interface ProjectTask {
  id: string
  title: string
  detail: string
}

export interface ProjectFeedback {
  strengths: string[]
  improve: string[]
  note: string
}

export interface Project {
  id: string
  title: string
  description: string
  status: 'active' | 'completed' | 'available'
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
}

/* --------------------------- misc state --------------------------- */

export interface AppNotification {
  id: string
  title: string
  body: string
  time: string
  read: boolean
  kind: 'session' | 'project' | 'path' | 'account'
  link?: string | null
}

export interface RecentlyDone {
  id: string
  title: string
  kind: ActivityKind | 'section' | 'project'
  when: string
}

export interface Milestone {
  id: string
  title: string
  detail: string
  date: string
  state: 'done' | 'current' | 'next'
}

export type AiProviderId = 'openai' | 'gemini' | 'deepseek'

export interface AiSettings {
  provider: AiProviderId
  mode: 'managed' | 'own'
  keyMasked: string | null
  connected: boolean
}

export interface Settings {
  preferences: {
    weeklyHours: WeeklyHours
    intensity: Intensity
    formats: LearningFormat[]
    sessionLength: number
  }
  schedule: {
    days: string[]
    time: string
    restDay: boolean
  }
  notifications: {
    dailyReminder: boolean
    weeklySummary: boolean
    projectFeedback: boolean
    pathUpdates: boolean
    productNews: boolean
  }
  ai: AiSettings
}
