import mongoose, { type Document, Schema, type Types } from 'mongoose'

/* ------------------------------------------------------------------ */
/*  Generated session content. One row per (path, section). Content is */
/*  AI-produced and cached here so a section is generated once, not    */
/*  every time it is opened. Shape mirrors the frontend SessionContent.*/
/* ------------------------------------------------------------------ */

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
  topic?: string
  reviewTopic?: string
  questions: Question[]
}

export interface SessionContent {
  lesson: Lesson
  /** 1-3 resources per session. Older cached rows carry a single `resource`
      instead — readers must normalize via resources-or-legacy. */
  resources: Resource[]
  /** Legacy single-resource shape (rows generated before multi-resource). */
  resource?: Resource
  practice: Practice
  assessment: Assessment
}

export interface SessionContentDocument extends Document {
  _id: Types.ObjectId
  userId: Types.ObjectId
  pathId: Types.ObjectId
  sectionId: string
  content: SessionContent
  modelName: string
  createdAt: Date
  updatedAt: Date
}

const sessionContentSchema = new Schema<SessionContentDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    pathId: { type: Schema.Types.ObjectId, ref: 'LearningPath', required: true },
    sectionId: { type: String, required: true, maxlength: 60 },
    content: { type: Schema.Types.Mixed, required: true },
    modelName: { type: String, default: '' },
  },
  { timestamps: true },
)

// One generated session per section; re-generation replaces it.
sessionContentSchema.index({ pathId: 1, sectionId: 1 }, { unique: true })
sessionContentSchema.index({ userId: 1, pathId: 1 })

export const SessionContentModel = mongoose.model<SessionContentDocument>(
  'SessionContent',
  sessionContentSchema,
)
