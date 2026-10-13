import mongoose, { type Document, type Model, Schema, type Types } from 'mongoose'
import { PROJECT_STATUSES, type ProjectStatus } from '../domain/index.js'

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

export interface ProjectDocument extends Document {
  _id: Types.ObjectId
  userId: Types.ObjectId
  pathId: Types.ObjectId | null
  title: string
  description: string
  status: ProjectStatus
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
  createdAt: Date
  updatedAt: Date
}

interface ProjectModel extends Model<ProjectDocument> {}

const taskSchema = new Schema<ProjectTask>(
  {
    id: { type: String, required: true, maxlength: 60 },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    detail: { type: String, default: '' },
  },
  { _id: false },
)

const feedbackSchema = new Schema<ProjectFeedback>(
  {
    strengths: { type: [String], default: [] },
    improve: { type: [String], default: [] },
    note: { type: String, default: '' },
  },
  { _id: false },
)

const projectSchema = new Schema<ProjectDocument, ProjectModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    pathId: { type: Schema.Types.ObjectId, ref: 'LearningPath', default: null },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, default: '' },
    status: { type: String, enum: PROJECT_STATUSES, required: true, default: 'available' },
    level: { type: String, default: '' },
    estHours: { type: Number, default: 0, min: 0 },
    objectives: { type: [String], default: [] },
    tasks: { type: [taskSchema], default: [] },
    deliverables: { type: [String], default: [] },
    related: { type: [String], default: [] },
    completedTaskIds: { type: [String], default: [] },
    submitted: { type: Boolean, default: false },
    reviewed: { type: Boolean, default: false },
    submittedAt: { type: String, default: null },
    submissionNote: { type: String, default: null, maxlength: 2000 },
    feedback: { type: feedbackSchema, default: null },
  },
  { timestamps: true },
)

projectSchema.index({ userId: 1, status: 1 })
projectSchema.index({ pathId: 1, status: 1 })

export const Project = mongoose.model<ProjectDocument, ProjectModel>('Project', projectSchema)

export function projectProgress(project: ProjectDocument) {
  const total = project.tasks.length
  const done = project.completedTaskIds.length
  return {
    total,
    done,
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
  }
}