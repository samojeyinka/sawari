import mongoose, { type Document, type Model, Schema, type Types } from 'mongoose'
import { EXPERIENCE_LEVELS, INTENSITIES, LEARNING_FORMATS, WEEKLY_HOURS, type ExperienceLevel, type Intensity, type LearningFormat, type WeeklyHours } from '../domain/index.js'
import type { SessionContent } from './SessionContent.js'

/* ------------------------------------------------------------------ */
/*  The public catalog: admin-authored learning paths that anyone can  */
/*  read without an account and enroll into. Unlike LearningPath these */
/*  are not owned by a learner; `createdBy` is audit metadata only.    */
/* ------------------------------------------------------------------ */

export interface CatalogSection {
  id: string
  order: number
  title: string
  description: string
  minutes: number
  /** Fully authored session content (lesson, resources, practice, assessment). */
  content: SessionContent
}

export interface CatalogPathDocument extends Document {
  _id: Types.ObjectId
  slug: string
  subject: string
  summary: string
  goal: string
  level: ExperienceLevel | null
  tags: string[]
  weeklyHours: WeeklyHours
  intensity: Intensity
  formats: LearningFormat[]
  expectedWeeks: number
  expectedHours: number
  ogImage: string | null
  sections: CatalogSection[]
  published: boolean
  publishedAt: Date | null
  /** Denormalized counters, kept in step with enrollments and reviews. */
  enrollments: number
  reviewsCount: number
  reviewsAvg: number
  /** The admin who authored it. Audit only; the path is public. */
  createdBy: Types.ObjectId | null
  createdAt: Date
  updatedAt: Date
}

interface CatalogPathModel extends Model<CatalogPathDocument> {}

const catalogSectionSchema = new Schema<CatalogSection>(
  {
    id: { type: String, required: true, maxlength: 60 },
    order: { type: Number, required: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, default: '', maxlength: 1000 },
    minutes: { type: Number, default: 0, min: 0 },
    content: { type: Schema.Types.Mixed, required: true },
  },
  { _id: false },
)

const catalogPathSchema = new Schema<CatalogPathDocument, CatalogPathModel>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 120,
      index: true,
    },
    subject: { type: String, required: true, trim: true, maxlength: 120 },
    summary: { type: String, default: '', maxlength: 300 },
    goal: { type: String, default: '', maxlength: 500 },
    level: { type: String, enum: EXPERIENCE_LEVELS, default: null },
    tags: { type: [String], default: [] },
    weeklyHours: { type: String, enum: WEEKLY_HOURS, default: '5' },
    intensity: { type: String, enum: INTENSITIES, default: 'balanced' },
    formats: { type: [String], enum: LEARNING_FORMATS, default: [] },
    expectedWeeks: { type: Number, default: 0, min: 0 },
    expectedHours: { type: Number, default: 0, min: 0 },
    ogImage: { type: String, default: null },
    sections: { type: [catalogSectionSchema], default: [] },
    published: { type: Boolean, default: false, index: true },
    publishedAt: { type: Date, default: null },
    enrollments: { type: Number, default: 0, min: 0 },
    reviewsCount: { type: Number, default: 0, min: 0 },
    reviewsAvg: { type: Number, default: 0, min: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
)

catalogPathSchema.index({ published: 1, createdAt: -1 })
catalogPathSchema.index({ subject: 'text', summary: 'text', tags: 'text' })

export const CatalogPath = mongoose.model<CatalogPathDocument, CatalogPathModel>(
  'CatalogPath',
  catalogPathSchema,
)
