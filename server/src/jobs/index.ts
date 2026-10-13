import { registerJobHandler, startJobWorker } from './queue.js'
import type { EmailMessage } from '../mail/types.js'
import { sendEmail } from '../mail/index.js'
import { createNotification } from '../services/notifications.js'
import { regeneratePathOutline } from '../services/pathOutline.js'
import { LearningPath } from '../models/LearningPath.js'
import { AiUnavailableError } from '../services/ai/deepseek.js'

/* ------------------------------------------------------------------ */
/*  Job bootstrap. index.ts calls startJobs() once after the DB        */
/*  connects; a restart simply re-registers the same handlers.         */
/* ------------------------------------------------------------------ */

export interface BuildPathJobPayload {
  pathId: string
  userId: string
}

let registered = false

async function handleBuildPath(payload: BuildPathJobPayload, job: { attempts: number; maxAttempts: number }): Promise<void> {
  const path = await LearningPath.findById(payload.pathId)
  if (!path) return

  // Mark generating first so clients polling see progression
  path.generationStatus = 'generating'
  path.generationStartedAt = new Date()
  path.generationError = null
  await path.save()

  try {
    await regeneratePathOutline(path)
    path.generationFinishedAt = new Date()
    await path.save()

    await createNotification({
      userId: payload.userId,
      kind: 'path',
      title: 'Your path is ready',
      body: `We designed "${path.subject}" into ${path.sections.length} sections. Take a look when you're ready.`,
      link: '/app/path',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (job.attempts >= job.maxAttempts || error instanceof AiUnavailableError) {
      path.generationStatus = 'failed'
      path.generationError = message
      path.generationFinishedAt = new Date()
      await path.save()
    } else {
      path.generationStatus = 'queued'
      path.generationError = message
      await path.save()
    }
    throw error
  }
}

export function registerJobHandlers(): void {
  if (registered) return
  registered = true

  registerJobHandler<EmailMessage>('send-email', async (payload) => {
    await sendEmail(payload)
  })

  registerJobHandler<BuildPathJobPayload>('build-path', async (payload, job) => {
    await handleBuildPath(payload, job)
  })

  // Retain back-compat for any previously enqueued outline jobs
  registerJobHandler<BuildPathJobPayload>('generate-outline', async (payload, job) => {
    await handleBuildPath(payload, job)
  })
}

export function startJobs(): void {
  registerJobHandlers()
  startJobWorker()
}

export { enqueue, stopJobWorker, drainQueue } from './queue.js'
export type { EnqueueOptions } from './queue.js'