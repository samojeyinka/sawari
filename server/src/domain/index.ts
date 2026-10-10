/* ------------------------------------------------------------------ */
/*  Domain enumerations. Single source of truth for what the API       */
/*  accepts — shared with mongoose schemas and zod validators so the    */
/*  "fillable" surface stays in one place.                              */
/* ------------------------------------------------------------------ */

export const EXPERIENCE_LEVELS = ['beginner', 'some', 'comfortable', 'advanced'] as const
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number]

export const GOAL_REASONS = ['career', 'school', 'growth', 'career-change', 'project', 'other'] as const
export type GoalReason = (typeof GOAL_REASONS)[number]

export const WEEKLY_HOURS = ['2', '5', '10', '15+'] as const
export type WeeklyHours = (typeof WEEKLY_HOURS)[number]

export const INTENSITIES = ['relaxed', 'balanced', 'intensive'] as const
export type Intensity = (typeof INTENSITIES)[number]

export const LEARNING_FORMATS = [
  'videos',
  'articles',
  'books',
  'exercises',
  'projects',
  'quizzes',
] as const
export type LearningFormat = (typeof LEARNING_FORMATS)[number]

export const SECTION_STATUSES = ['completed', 'current', 'upcoming', 'locked'] as const
export type SectionStatus = (typeof SECTION_STATUSES)[number]

export const PROJECT_STATUSES = ['active', 'completed', 'available'] as const
export type ProjectStatus = (typeof PROJECT_STATUSES)[number]

export const PROVIDERS = ['local', 'github', 'google'] as const
export type Provider = (typeof PROVIDERS)[number]