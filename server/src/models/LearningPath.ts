import mongoose, { type Document, type Model, Schema, type Types } from 'mongoose'
import {
  EXPERIENCE_LEVELS,
  GENERATION_STATUSES,
  GOAL_REASONS,
  INTENSITIES,
  LEARNING_FORMATS,
  SECTION_STATUSES,
  WEEKLY_HOURS,
  type ExperienceLevel,
  type GenerationStatus,
  type GoalReason,
  type Intensity,
  type LearningFormat,
  type SectionStatus,
  type WeeklyHours,
} from '../domain/index.js'

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
  week: number[]
}

export interface AssessmentResult {
  score: number
  total: number
  date: string
  firstAttempt: boolean
}

export interface LearningPathDocument extends Document {
  _id: Types.ObjectId
  userId: Types.ObjectId
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
  generationStatus: GenerationStatus
  generationError: string | null
  generationStartedAt: Date | null
  generationFinishedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

interface LearningPathModel extends Model<LearningPathDocument> {}

const sectionSchema = new Schema<PathSection>(
  {
    id: { type: String, required: true, maxlength: 60 },
    order: { type: Number, required: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, default: '' },
    minutes: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: SECTION_STATUSES, required: true },
    doneMinutes: { type: Number, default: 0, min: 0 },
    note: { type: String },
  },
  { _id: false },
)

const statsSchema = new Schema<PathStats>(
  {
    sessionsCompleted: { type: Number, default: 0, min: 0 },
    minutesLearned: { type: Number, default: 0, min: 0 },
    topicsExplored: { type: Number, default: 0, min: 0 },
    projectsCompleted: { type: Number, default: 0, min: 0 },
    week: { type: [Number], default: [0, 0, 0, 0, 0, 0, 0] },
  },
  { _id: false },
)

const assessmentResultSchema = new Schema<AssessmentResult>(
  {
    score: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    date: { type: String, required: true },
    firstAttempt: { type: Boolean, default: true },
  },
  { _id: false },
)

const learningPathSchema = new Schema<LearningPathDocument, LearningPathModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true, trim: true, maxlength: 120 },
    goal: { type: String, default: '', maxlength: 500 },
    experience: { type: String, enum: EXPERIENCE_LEVELS, default: null },
    reason: { type: String, enum: GOAL_REASONS, default: null },
    weeklyHours: { type: String, enum: WEEKLY_HOURS, required: true, default: '5' },
    intensity: { type: String, enum: INTENSITIES, required: true, default: 'balanced' },
    formats: { type: [String], enum: LEARNING_FORMATS, default: [] },
    targetDate: { type: String, default: null },
    sections: { type: [sectionSchema], default: [] },
    stats: { type: statsSchema, default: () => ({}) },
    currentSectionId: { type: String, default: null },
    completedActivities: { type: [String], default: [] },
    countedSessions: { type: [String], default: [] },
    assessmentResults: { type: Map, of: assessmentResultSchema, default: {} },
    adaptationNote: { type: String, default: null },
    generationStatus: {
      type: String,
      enum: GENERATION_STATUSES,
      default: 'ready',
    },
    generationError: { type: String, default: null },
    generationStartedAt: { type: Date, default: null },
    generationFinishedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toObject: { flattenMaps: true },
    toJSON: { flattenMaps: true },
  },
)

learningPathSchema.index({ userId: 1, createdAt: -1 })
learningPathSchema.index({ userId: 1, subject: 1 })

export const LearningPath = mongoose.model<LearningPathDocument, LearningPathModel>(
  'LearningPath',
  learningPathSchema,
)