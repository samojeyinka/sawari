import 'dotenv/config'
import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { connectDb, disconnectDb } from '../src/config/db.js'
import { purgeExpiredDeletions } from '../src/jobs/scheduler.js'
import { Job } from '../src/models/Job.js'
import { LearningPath } from '../src/models/LearningPath.js'
import { Notification } from '../src/models/Notification.js'
import { User } from '../src/models/User.js'

/**
 * Account security: hashed verification codes, soft-delete with restore,
 * 30-day purge, and email change with re-verification. Real DB + auth.
 */
const hasDb = Boolean(process.env.TEST_MONGODB_URI)
const app = createApp()

before(async () => {
  if (!hasDb) return
  await connectDb(process.env.TEST_MONGODB_URI!)
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

async function registerUser(email: string): Promise<string> {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ firstName: 'Case', email, password: 'StrongPass1!' })
  assert.equal(res.status, 201)
  return (res.headers['set-cookie']?.[0] as string).split(';')[0]
}

async function latestEmail(to: string) {
  const job = await Job.findOne({ name: 'send-email', 'payload.to': to }).sort({ createdAt: -1 })
  assert.ok(job, `expected a queued email to ${to}`)
  return (job.payload as { text?: string }).text ?? ''
}

test('verification codes are stored hashed, wrong codes fail', { skip: !hasDb }, async () => {
  const email = 'hash-code@example.com'
  const cookie = await registerUser(email)

  const stored = await User.findOne({ email }).select('+emailVerificationCode').lean()
  assert.ok(stored?.emailVerificationCode)
  assert.match(stored.emailVerificationCode!, /^[a-f0-9]{64}$/)

  const wrong = await request(app)
    .post('/api/v1/auth/verify-email')
    .set('Cookie', cookie)
    .send({ code: '000000' })
  assert.equal(wrong.status, 400)

  // Legacy plaintext rows verify once; the code is consumed as usual.
  await User.updateOne({ email }, { $set: { emailVerificationCode: '123456' } })
  const legacy = await request(app)
    .post('/api/v1/auth/verify-email')
    .set('Cookie', cookie)
    .send({ code: '123456' })
  assert.equal(legacy.status, 200)
  assert.equal(legacy.body.data.emailVerified, true)
  const consumed = await User.findOne({ email }).select('+emailVerificationCode').lean()
  assert.equal(consumed?.emailVerificationCode, undefined)
})

test('delete request -> confirm -> login blocked -> restore', { skip: !hasDb }, async () => {
  const email = 'delete-flow@example.com'
  const cookie = await registerUser(email)

  const requested = await request(app).post('/api/v1/me/delete-request').set('Cookie', cookie)
  assert.equal(requested.status, 200)

  const confirmText = await latestEmail(email)
  const token = /delete-account\?token=([a-f0-9]{64})/.exec(confirmText)?.[1]
  assert.ok(token, 'expected a confirm token in the email')

  const badConfirm = await request(app)
    .post('/api/v1/me/delete-confirm')
    .send({ token: '0'.repeat(64) })
  assert.equal(badConfirm.status, 400)

  const confirmed = await request(app).post('/api/v1/me/delete-confirm').send({ token })
  assert.equal(confirmed.status, 200)

  const deleted = await User.findOne({ email }).lean()
  assert.ok(deleted?.deletedAt instanceof Date)

  const login = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password: 'StrongPass1!' })
  assert.equal(login.status, 403)
  assert.equal(login.body.error.code, 'account_deleted')

  // Old cookies die with the account.
  const me = await request(app).get('/api/v1/me').set('Cookie', cookie)
  assert.equal(me.status, 401)

  // The deletion email carries the restore link.
  const restoreText = await latestEmail(email)
  const restoreToken = /restore-account\?token=([a-f0-9]{64})/.exec(restoreText)?.[1]
  assert.ok(restoreToken, 'expected a restore token in the email')

  const restored = await request(app).post('/api/v1/me/restore').send({ token: restoreToken })
  assert.equal(restored.status, 200)
  assert.equal(restored.body.data.email, email)

  const relogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password: 'StrongPass1!' })
  assert.equal(relogin.status, 200)

  // Single-use: the same link is dead now.
  const reuse = await request(app).post('/api/v1/me/restore').send({ token: restoreToken })
  assert.equal(reuse.status, 400)
})

test('restore window and purge behave', { skip: !hasDb }, async () => {
  const cookie = await registerUser('purge-me@example.com')
  await request(app).post('/api/v1/me/delete-request').set('Cookie', cookie)
  const confirmText = await latestEmail('purge-me@example.com')
  const token = /delete-account\?token=([a-f0-9]{64})/.exec(confirmText)?.[1]
  assert.ok(token)
  await request(app).post('/api/v1/me/delete-confirm').send({ token })

  const user = await User.findOne({ email: 'purge-me@example.com' }).lean()
  assert.ok(user)
  await LearningPath.create({
    userId: user._id,
    subject: 'Doomed Path',
    weeklyHours: '5',
    intensity: 'balanced',
    sections: [],
    generationStatus: 'ready',
  })

  // Backdate past the window: restore refuses, purge removes everything.
  const old = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000)
  await User.updateOne({ email: 'purge-me@example.com' }, { $set: { deletedAt: old } })

  const restoreText = await latestEmail('purge-me@example.com')
  const restoreToken = /restore-account\?token=([a-f0-9]{64})/.exec(restoreText)?.[1]
  assert.ok(restoreToken)
  const late = await request(app).post('/api/v1/me/restore').send({ token: restoreToken })
  assert.equal(late.status, 400)
  assert.equal(late.body.error.code, 'restore_expired')

  const purged = await purgeExpiredDeletions(new Date())
  assert.equal(purged, 1)
  assert.equal(await User.countDocuments({ email: 'purge-me@example.com' }), 0)
  assert.equal(await LearningPath.countDocuments({ userId: user._id }), 0)
  assert.equal(await purgeExpiredDeletions(new Date()), 0)
})

test('restore-request stays generic for unknown accounts', { skip: !hasDb }, async () => {
  const known = await request(app)
    .post('/api/v1/me/restore-request')
    .send({ email: 'nobody-here@example.com' })
  assert.equal(known.status, 200)

  const cookie = await registerUser('restore-req@example.com')
  await request(app).post('/api/v1/me/delete-request').set('Cookie', cookie)
  const confirmText = await latestEmail('restore-req@example.com')
  const token = /delete-account\?token=([a-f0-9]{64})/.exec(confirmText)?.[1]
  assert.ok(token)
  await request(app).post('/api/v1/me/delete-confirm').send({ token })

  const again = await request(app)
    .post('/api/v1/me/restore-request')
    .send({ email: 'restore-req@example.com' })
  assert.equal(again.status, 200)
  assert.equal(again.body.data.message, known.body.data.message)
})

test('email change verifies the new address before swapping', { skip: !hasDb }, async () => {
  const email = 'change-mail@example.com'
  const fresh = 'change-mail-new@example.com'
  const cookie = await registerUser(email)

  const requested = await request(app)
    .post('/api/v1/me/email-change-request')
    .set('Cookie', cookie)
    .send({ email: fresh })
  assert.equal(requested.status, 200)
  assert.equal(requested.body.data.pendingEmail, fresh)

  const stored = await User.findOne({ email }).select('+emailChangeCodeHash').lean()
  assert.match(stored?.emailChangeCodeHash ?? '', /^[a-f0-9]{64}$/)

  const mailText = await latestEmail(fresh)
  const code = /code is: (\d{6})/.exec(mailText)?.[1]
  assert.ok(code, 'expected a 6-digit code in the email')

  const wrong = await request(app)
    .post('/api/v1/me/email-change-confirm')
    .set('Cookie', cookie)
    .send({ code: '000000' })
  assert.equal(wrong.status, 400)

  const done = await request(app)
    .post('/api/v1/me/email-change-confirm')
    .set('Cookie', cookie)
    .send({ code })
  assert.equal(done.status, 200)
  assert.equal(done.body.data.email, fresh)
  assert.equal(done.body.data.emailVerified, true)

  // Old address frees up; the account signs in on the new one.
  const relogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: fresh, password: 'StrongPass1!' })
  assert.equal(relogin.status, 200)

  const repeat = await request(app)
    .post('/api/v1/me/email-change-confirm')
    .set('Cookie', cookie)
    .send({ code })
  assert.equal(repeat.status, 400)
})
