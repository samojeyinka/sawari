import 'dotenv/config'
import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { connectDb, disconnectDb } from '../src/config/db.js'
import { User } from '../src/models/User.js'

/**
 * Settings persistence: every Settings-screen control round-trips through
 * GET/PATCH /settings (learning prefs, schedule incl. restDay, all five
 * notification toggles, timezone).
 */
const hasDb = Boolean(process.env.TEST_MONGODB_URI)
const app = createApp()

before(async () => {
  if (!hasDb) return
  await connectDb(process.env.TEST_MONGODB_URI!)
  await User.deleteMany({})
})

after(async () => {
  if (hasDb) await disconnectDb()
})

async function registerUser(email: string): Promise<string> {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ firstName: 'Set', email, password: 'StrongPass1!' })
  assert.equal(res.status, 201)
  return (res.headers['set-cookie']?.[0] as string).split(';')[0]
}

test('settings load with full defaults and patch round-trips', { skip: !hasDb }, async () => {
  const cookie = await registerUser('settings-a@example.com')

  const initial = await request(app).get('/api/v1/settings').set('Cookie', cookie)
  assert.equal(initial.status, 200)
  assert.equal(initial.body.data.weeklyHours, '5')
  assert.equal(initial.body.data.intensity, 'balanced')
  assert.deepEqual(initial.body.data.formats, ['articles', 'exercises', 'projects', 'quizzes'])
  assert.equal(initial.body.data.sessionLength, 45)
  assert.equal(initial.body.data.restDay, true)
  assert.equal(initial.body.data.projectFeedback, true)
  assert.equal(initial.body.data.pathUpdates, true)
  assert.equal(initial.body.data.productNews, false)

  const patched = await request(app)
    .patch('/api/v1/settings')
    .set('Cookie', cookie)
    .send({
      weeklyHours: '10',
      intensity: 'intensive',
      formats: ['videos', 'quizzes'],
      sessionLength: 60,
      restDay: false,
      projectFeedback: false,
      pathUpdates: false,
      productNews: true,
      timezone: 'Africa/Lagos',
      reminderTime: '08:30',
      reminderDays: ['Mon', 'Wed', 'Fri'],
    })
  assert.equal(patched.status, 200)
  assert.equal(patched.body.data.weeklyHours, '10')
  assert.equal(patched.body.data.sessionLength, 60)
  assert.equal(patched.body.data.restDay, false)
  assert.equal(patched.body.data.productNews, true)
  assert.equal(patched.body.data.timezone, 'Africa/Lagos')

  // Partial patch merges; everything else survives a reload.
  await request(app).patch('/api/v1/settings').set('Cookie', cookie).send({ sessionLength: 25 })
  const reloaded = await request(app).get('/api/v1/settings').set('Cookie', cookie)
  assert.equal(reloaded.body.data.sessionLength, 25)
  assert.equal(reloaded.body.data.weeklyHours, '10')
  assert.equal(reloaded.body.data.restDay, false)
  assert.deepEqual(reloaded.body.data.formats, ['videos', 'quizzes'])
})

test('settings reject out-of-policy values', { skip: !hasDb }, async () => {
  const cookie = await registerUser('settings-b@example.com')

  assert.equal(
    (await request(app).patch('/api/v1/settings').set('Cookie', cookie).send({ weeklyHours: '99' })).status,
    422,
  )
  assert.equal(
    (await request(app).patch('/api/v1/settings').set('Cookie', cookie).send({ sessionLength: 5_000 })).status,
    422,
  )
  assert.equal(
    (await request(app).patch('/api/v1/settings').set('Cookie', cookie).send({ restDay: 'yes' })).status,
    422,
  )
  assert.equal(
    (await request(app).patch('/api/v1/settings').set('Cookie', cookie).send({ unknownField: true })).status,
    422,
  )

  assert.equal((await request(app).get('/api/v1/settings')).status, 401)
  assert.equal((await request(app).patch('/api/v1/settings').send({ restDay: false })).status, 401)
})
