import 'dotenv/config'
import assert from 'node:assert/strict'
import { after, afterEach, before, beforeEach, test } from 'node:test'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { connectDb, disconnectDb } from '../src/config/db.js'
import { env } from '../src/config/env.js'
import { drainQueue, registerJobHandlers } from '../src/jobs/index.js'
import { Job } from '../src/models/Job.js'
import { LearningPath } from '../src/models/LearningPath.js'
import { Notification } from '../src/models/Notification.js'
import { User } from '../src/models/User.js'
import { resetAiHealthCache } from '../src/services/ai/health.js'

const hasDb = Boolean(process.env.TEST_MONGODB_URI)
const app = createApp()

const originalFetch = globalThis.fetch
const originalApiKey = env.DEEPSEEK_API_KEY

before(async () => {
  if (!hasDb) return
  await connectDb(process.env.TEST_MONGODB_URI!)
  registerJobHandlers()
  await Promise.all([
    User.deleteMany({}),
    LearningPath.deleteMany({}),
    Notification.deleteMany({}),
    Job.deleteMany({}),
  ])
})

after(async () => {
  if (hasDb) await disconnectDb()
})

beforeEach(() => {
  resetAiHealthCache()
})

afterEach(() => {
  globalThis.fetch = originalFetch
  env.DEEPSEEK_API_KEY = originalApiKey
  resetAiHealthCache()
})

async function registerUser(email: string): Promise<string> {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ firstName: 'Test', email, password: 'StrongPass1!' })
  assert.equal(res.status, 201)
  return (res.headers['set-cookie']?.[0] as string).split(';')[0]
}

test('POST /api/v1/learning-paths rejects AI path creation when AI is unavailable', { skip: !hasDb }, async () => {
  const cookie = await registerUser('unavail@example.com')
  env.DEEPSEEK_API_KEY = undefined

  const res = await request(app)
    .post('/api/v1/learning-paths')
    .set('Cookie', cookie)
    .send({
      subject: 'Rust Programming',
      goal: 'Build fast tools',
      weeklyHours: '5',
      intensity: 'balanced',
    })

  assert.equal(res.status, 503)
  assert.equal(res.body.success, false)
  assert.equal(res.body.error.code, 'ai_unavailable')
})

test('GET /api/v1/ai/health returns health envelope for authenticated user', { skip: !hasDb }, async () => {
  const cookie = await registerUser('health-check@example.com')
  env.DEEPSEEK_API_KEY = 'test-key'

  globalThis.fetch = (async () => {
    return new Response(JSON.stringify({
      choices: [{ message: { content: '{"ok":true}' } }],
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }) as unknown as typeof fetch

  const res = await request(app).get('/api/v1/ai/health').set('Cookie', cookie)
  assert.equal(res.status, 200)
  assert.equal(res.body.success, true)
  assert.equal(res.body.data.available, true)
  assert.equal(res.body.data.model, env.DEEPSEEK_MODEL)
  assert.ok(typeof res.body.data.latencyMs === 'number')

  // Unauthenticated request is rejected
  const anon = await request(app).get('/api/v1/ai/health')
  assert.equal(anon.status, 401)
})

test('queued AI path building lifecycle (queued -> generating -> ready) and retry', { skip: !hasDb }, async () => {
  const cookie = await registerUser('async-builder@example.com')
  // This flow builds two paths; lift the free-account quota for the fixture.
  await User.updateOne({ email: 'async-builder@example.com' }, { $set: { plan: 'pro' } })
  env.DEEPSEEK_API_KEY = 'test-key'

  const outlineJson = JSON.stringify({
    sections: [
      { order: 1, title: 'Ownership and Memory', description: 'Borrow checker and lifetimes.', minutes: 180 },
      { order: 2, title: 'Data Types and Traits', description: 'Enums, structs, and common traits.', minutes: 200 },
      { order: 3, title: 'Error Handling Patterns', description: 'Result, Option, and panic recovery.', minutes: 150 },
      { order: 4, title: 'Concurrent Command Line Tool', description: 'Build a fast multithreaded CLI.', minutes: 360 },
    ],
  })

  globalThis.fetch = (async (url: string | URL | Request) => {
    const urlStr = String(url)
    if (urlStr.includes('/chat/completions')) {
      return new Response(JSON.stringify({
        choices: [{ message: { content: outlineJson } }],
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    return new Response('Not found', { status: 404 })
  }) as unknown as typeof fetch

  // 1. Create path with BRIEF ONLY (no sections)
  const createRes = await request(app)
    .post('/api/v1/learning-paths')
    .set('Cookie', cookie)
    .send({
      subject: 'Rust Systems',
      goal: 'Write memory-safe command line tools',
      weeklyHours: '10',
      intensity: 'intensive',
    })

  assert.equal(createRes.status, 201)
  assert.equal(createRes.body.success, true)
  const pathId = createRes.body.data.id as string
  assert.equal(createRes.body.data.generationStatus, 'queued')
  assert.equal(createRes.body.data.generationError, null)
  assert.deepEqual(createRes.body.data.sections, [])

  // 2. Process queue: build-path job runs
  await drainQueue()

  // 3. Path is now ready with generated sections, active section, and a notification
  const pathAfter = await LearningPath.findById(pathId).lean()
  assert.ok(pathAfter)
  assert.equal(pathAfter!.generationStatus, 'ready')
  assert.equal(pathAfter!.generationError, null)
  assert.equal(pathAfter!.sections.length, 4)
  assert.equal(pathAfter!.sections[0]?.title, 'Ownership and Memory')
  assert.equal(pathAfter!.currentSectionId, pathAfter!.sections[0]?.id)

  const notif = await Notification.findOne({ kind: 'path', title: 'Your path is ready' }).lean()
  assert.ok(notif, 'expected path ready notification')
  assert.equal(notif!.link, '/app/path')

  // 4. Test failure handling and retry
  // Stub DeepSeek failure for next run
  globalThis.fetch = (async () => {
    return new Response('DeepSeek backend overload', { status: 503 })
  }) as unknown as typeof fetch

  // Manually trigger a path that fails in queue
  resetAiHealthCache()
  // Create another path that will fail during generation
  // Temporarily stub health check to pass, but completion to fail
  let healthCall = true
  globalThis.fetch = (async () => {
    if (healthCall) {
      healthCall = false
      return new Response(JSON.stringify({
        choices: [{ message: { content: '{"ok":true}' } }],
      }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    }
    return new Response('DeepSeek 500 error', { status: 500 })
  }) as unknown as typeof fetch

  const failingPathRes = await request(app)
    .post('/api/v1/learning-paths')
    .set('Cookie', cookie)
    .send({
      subject: 'Distributed Systems',
      weeklyHours: '5',
      intensity: 'balanced',
    })
  assert.equal(failingPathRes.status, 201)
  const failPathId = failingPathRes.body.data.id as string

  // Force job maxAttempts to 1 on the queued job so it transitions to failed immediately
  await Job.updateOne({ name: 'build-path', 'payload.pathId': failPathId }, { $set: { maxAttempts: 1 } })

  await drainQueue()

  const failedPath = await LearningPath.findById(failPathId).lean()
  assert.ok(failedPath)
  assert.equal(failedPath!.generationStatus, 'failed')
  assert.ok(failedPath!.generationError?.includes('500'))

  // 5. Retry endpoint POST /:id/retry re-enqueues
  // Stub DeepSeek to succeed again
  globalThis.fetch = (async () => {
    return new Response(JSON.stringify({
      choices: [{ message: { content: outlineJson } }],
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }) as unknown as typeof fetch

  const retryRes = await request(app)
    .post(`/api/v1/learning-paths/${failPathId}/retry`)
    .set('Cookie', cookie)

  assert.equal(retryRes.status, 200)
  assert.equal(retryRes.body.data.generationStatus, 'queued')
  assert.equal(retryRes.body.data.generationError, null)

  await drainQueue()

  const retriedPath = await LearningPath.findById(failPathId).lean()
  assert.ok(retriedPath)
  assert.equal(retriedPath!.generationStatus, 'ready')
  assert.equal(retriedPath!.sections.length, 4)
})
