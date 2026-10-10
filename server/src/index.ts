import 'dotenv/config'
import { createApp } from './app.js'
import { connectDb, disconnectDb } from './config/db.js'
import { env } from './config/env.js'

async function start(): Promise<void> {
  await connectDb()

  const app = createApp()
  const server = app.listen(env.PORT, () => {
    console.log(`[sawari-api] listening on http://localhost:${env.PORT} (${env.NODE_ENV})`)
  })

  let shuttingDown = false
  const shutdown = (signal: string) => {
    if (shuttingDown) return
    shuttingDown = true
    console.log(`[sawari-api] ${signal} received, shutting down…`)
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