import { env } from '../config/env.js'
import { Job, type JobDocument } from '../models/Job.js'

/* ------------------------------------------------------------------ */
/*  Queue engine.                                                      */
/*  - enqueue(name, payload): persist a job row.                       */
/*  - registerJobHandler(name, fn): wire a job name to its work.       */
/*  - startJobWorker()/stopJobWorker(): run the polling worker.        */
/*                                                                     */
/*  Claiming is a single atomic findOneAndUpdate, so multiple worker   */
/*  processes (or a restart) can never run the same job twice.         */
/* ------------------------------------------------------------------ */

export type JobHandler<P = unknown> = (payload: P, job: JobDocument) => Promise<void>

const handlers = new Map<string, JobHandler>()

/** Stuck "running" jobs are re-queued after this long (crashed worker). */
const STALE_LOCK_MS = 5 * 60_000
const MAX_BACKOFF_MS = 5 * 60_000

export function registerJobHandler<P>(name: string, handler: JobHandler<P>): void {
  if (handlers.has(name)) {
    throw new Error(`A handler for job "${name}" is already registered.`)
  }
  handlers.set(name, handler as JobHandler)
}

export interface EnqueueOptions {
  runAt?: Date
  maxAttempts?: number
  priority?: number
}

export async function enqueue<P>(
  name: string,
  payload: P,
  options: EnqueueOptions = {},
): Promise<JobDocument> {
  return Job.create({
    name,
    payload,
    runAt: options.runAt ?? new Date(),
    maxAttempts: options.maxAttempts ?? env.QUEUE_MAX_ATTEMPTS,
    priority: options.priority ?? 0,
  })
}

function backoffMs(attempts: number): number {
  return Math.min(MAX_BACKOFF_MS, 1000 * 2 ** attempts)
}

/** Atomically claim the next due job, or null when the queue is empty. */
async function claimNextJob(): Promise<JobDocument | null> {
  return Job.findOneAndUpdate(
    { status: 'queued', runAt: { $lte: new Date() } },
    { $set: { status: 'running', lockedAt: new Date() }, $inc: { attempts: 1 } },
    { sort: { priority: -1, runAt: 1 }, returnDocument: 'after' },
  )
}

/** Re-queue jobs whose worker died mid-flight. */
async function recoverStaleJobs(): Promise<void> {
  const cutoff = new Date(Date.now() - STALE_LOCK_MS)
  await Job.updateMany(
    { status: 'running', lockedAt: { $lt: cutoff } },
    { $set: { status: 'queued', lockedAt: null } },
  )
}

async function processOne(job: JobDocument): Promise<void> {
  const handler = handlers.get(job.name)
  try {
    if (!handler) throw new Error(`No handler registered for job "${job.name}".`)
    await handler(job.payload, job)
    job.status = 'done'
    job.finishedAt = new Date()
    job.lastError = null
    job.lockedAt = null
    await job.save()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (job.attempts >= job.maxAttempts) {
      job.status = 'failed'
      job.finishedAt = new Date()
    } else {
      job.status = 'queued'
      job.runAt = new Date(Date.now() + backoffMs(job.attempts))
    }
    job.lastError = message
    job.lockedAt = null
    await job.save()
    console.error(
      `[jobs] "${job.name}" failed (attempt ${job.attempts}/${job.maxAttempts}): ${message}`,
    )
  }
}

let timer: NodeJS.Timeout | null = null
let processing = false
let running = false

export async function drainQueue(): Promise<void> {
  if (processing) return
  processing = true
  try {
    for (;;) {
      const job = await claimNextJob()
      if (!job) break
      await processOne(job)
    }
  } catch (error) {
    console.error('[jobs] worker tick errored:', error)
  } finally {
    processing = false
  }
}

export function startJobWorker(): void {
  if (running) return
  running = true

  const tick = () => {
    void recoverStaleJobs().catch((error) => console.error('[jobs] recovery failed:', error))
    void drainQueue()
  }

  timer = setInterval(tick, env.QUEUE_POLL_MS)
  timer.unref()
  tick() // run once immediately so the first job is not delayed a full interval
  console.log(`[jobs] worker started (poll ${env.QUEUE_POLL_MS}ms)`)
}

export function stopJobWorker(): void {
  running = false
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}
