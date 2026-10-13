import mongoose, { type Document, type Model, Schema, type Types } from 'mongoose'

/* ------------------------------------------------------------------ */
/*  Jobs: a durable, Mongo-backed work queue. A job row is the source  */
/*  of truth; the worker claims due rows atomically and runs the       */
/*  handler registered for the job `name`. No Redis required.          */
/* ------------------------------------------------------------------ */

export const JOB_STATUSES = ['queued', 'running', 'done', 'failed'] as const
export type JobStatus = (typeof JOB_STATUSES)[number]

export interface JobDocument extends Document {
  _id: Types.ObjectId
  name: string
  payload: unknown
  status: JobStatus
  priority: number
  runAt: Date
  attempts: number
  maxAttempts: number
  lockedAt?: Date | null
  lastError?: string | null
  finishedAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

const jobSchema = new Schema<JobDocument>(
  {
    name: { type: String, required: true, index: true },
    payload: { type: Schema.Types.Mixed, default: {} },
    status: { type: String, enum: JOB_STATUSES, default: 'queued' },
    priority: { type: Number, default: 0 },
    runAt: { type: Date, default: () => new Date() },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 3 },
    lockedAt: { type: Date, default: null },
    lastError: { type: String, default: null },
    finishedAt: { type: Date, default: null },
  },
  { timestamps: true },
)

// The one index the worker's claim query depends on: due, highest priority first.
jobSchema.index({ status: 1, runAt: 1, priority: -1 })

// Retention: finished jobs (done/failed) age out 7 days after finishing so the
// jobs table cannot grow forever. Queued/running rows have no `finishedAt` and
// are never matched by the partial filter.
jobSchema.index(
  { finishedAt: 1 },
  {
    expireAfterSeconds: 7 * 24 * 60 * 60,
    partialFilterExpression: { status: { $in: ['done', 'failed'] } },
  },
)

export const Job: Model<JobDocument> = mongoose.model<JobDocument>('Job', jobSchema)
