import 'dotenv/config'
import { createApp } from './app.js'
import { connectDb, disconnectDb } from './config/db.js'
import { env } from './config/env.js'
import { startJobs, stopJobWorker } from './jobs/index.js'
import { startScheduler, stopScheduler } from './jobs/scheduler.js'
import { checkAiHealth } from './services/ai/health.js'

async function start(): Promise<void> {
  await connectDb()
  startJobs()
  startScheduler()

  const aiHealth = await checkAiHealth({ fresh: true })
  if (!aiHealth.available) {
    console.warn(
      `[sawari-api] WARNING: AI generation is unavailable (${aiHealth.error ?? 'unreachable'}). Learning path building will be blocked.`,
    )
  } else {
    console.log(`[sawari-api] AI service healthy (${aiHealth.model}, ${aiHealth.latencyMs}ms)`)
  }

  const app = createApp()
  const server = app.listen(env.PORT, () => {
    console.log(`[sawari-api] listening on http://localhost:${env.PORT} (${env.NODE_ENV})`)
  })

  let shuttingDown = false
  const shutdown = (signal: string) => {
    if (shuttingDown) return
    shuttingDown = true
    console.log(`[sawari-api] ${signal} received, shutting down…`)
    stopJobWorker()
    stopScheduler()
    server.close(async () => {
      await disconnectDb()
      process.exit(0)
    })
    setTimeout(() => process.exit(1), 10_000).unref()
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

start().catch((err) => {
  console.error('[sawari-api] fatal boot error:', err)
  process.exit(1)
})