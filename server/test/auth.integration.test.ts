import 'dotenv/config'
import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { connectDb, disconnectDb } from '../src/config/db.js'
import { Job } from '../src/models/Job.js'
import { User } from '../src/models/User.js'

/**
 * Full auth flow against a real database.
 * Requires TEST_MONGODB_URI to be set (e.g. .env "TEST_MONGODB_URI=...").
 * Skipped cleanly otherwise so `npm test` works out of the box.
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

test('register → me → duplicate → login → logout', { skip: !hasDb }, async () => {
  const reg = await request(app)
    .post('/api/v1/auth/register')
    .send({ firstName: 'Ada', lastName: 'Lovelace', email: 'ADA@example.com', password: 'StrongPass1!' })
  assert.equal(reg.status, 201)
  assert.equal(reg.body.success, true)
  assert.equal(reg.body.data.email, 'ada@example.com')
  assert.equal(reg.body.data.passwordHash, undefined)

  const cookieHeader = reg.headers['set-cookie']?.[0] as string | undefined
  assert.ok(cookieHeader, 'expected a Set-Cookie header')
  assert.match(cookieHeader, /sawari_token=/)
  assert.match(cookieHeader, /HttpOnly/i)
  const cookie = cookieHeader.split(';')[0]

  const me = await request(app).get('/api/v1/me').set('Cookie', cookie)
  assert.equal(me.status, 200)
  assert.equal(me.body.data.email, 'ada@example.com')
  assert.equal(me.body.data.firstName, 'Ada')

  const dup = await request(app)
    .post('/api/v1/auth/register')
    .send({ firstName: 'Grace', email: 'ada@example.com', password: 'StrongPass1!' })
  assert.equal(dup.status, 409)
  assert.equal(dup.body.error.code, 'conflict')

  const bad = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'ada@example.com', password: 'WrongPass1!' })
  assert.equal(bad.status, 401)

  const login = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'ada@example.com', password: 'StrongPass1!' })
  assert.equal(login.status, 200)
  assert.equal(login.body.data.email, 'ada@example.com')
  assert.ok(login.headers['set-cookie']?.[0]?.match(/sawari_token=/))

  const out = await request(app).post('/api/v1/auth/logout')
  assert.equal(out.status, 204)
  assert.ok(out.headers['set-cookie']?.[0]?.match(/sawari_token=;/))
})

test('forgot password → reset → login with the new password', { skip: !hasDb }, async () => {
  const email = 'reset-a@example.com'
  const reg = await request(app)
    .post('/api/v1/auth/register')
    .send({ firstName: 'Reset', email, password: 'StrongPass1!' })
  assert.equal(reg.status, 201)

  const forgot = await request(app).post('/api/v1/auth/forgot-password').send({ email })
  assert.equal(forgot.status, 200)
  assert.equal(forgot.body.success, true)

  // Unknown accounts get the exact same generic response (no enumeration).
  const unknown = await request(app)
    .post('/api/v1/auth/forgot-password')
    .send({ email: 'nobody-here@example.com' })
  assert.equal(unknown.status, 200)
  assert.equal(unknown.body.data.message, forgot.body.data.message)

  // Pull the token out of the queued reset email.
  const job = await Job.findOne({ name: 'send-email', 'payload.to': email }).sort({ createdAt: -1 })
  assert.ok(job, 'expected a queued password-reset email')
  const payload = job.payload as { text?: string }
  const token = /token=([a-f0-9]{64})/.exec(payload.text ?? '')?.[1]
  assert.ok(token, 'expected a reset token in the email body')

  const bad = await request(app)
    .post('/api/v1/auth/reset-password')
    .send({ token: 'deadbeef', password: 'NewStrong2!' })
  assert.equal(bad.status, 400)

  const reset = await request(app)
    .post('/api/v1/auth/reset-password')
    .send({ token, password: 'NewStrong2!' })
  assert.equal(reset.status, 200)

  // The old password no longer works; the new one does.
  const oldLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password: 'StrongPass1!' })
  assert.equal(oldLogin.status, 401)

  const newLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password: 'NewStrong2!' })
  assert.equal(newLogin.status, 200)

  // Tokens are single-use.
  const reuse = await request(app)
    .post('/api/v1/auth/reset-password')
    .send({ token, password: 'Another3!x' })
  assert.equal(reuse.status, 400)
})

test('change password requires the current password', { skip: !hasDb }, async () => {
  const email = 'change-a@example.com'
  const reg = await request(app)
    .post('/api/v1/auth/register')
    .send({ firstName: 'Change', email, password: 'StrongPass1!' })
  assert.equal(reg.status, 201)
  const cookie = (reg.headers['set-cookie']?.[0] as string).split(';')[0]

  const wrong = await request(app)
    .post('/api/v1/auth/change-password')
    .set('Cookie', cookie)
    .send({ currentPassword: 'WrongPass1!', newPassword: 'NewStrong2!' })
  assert.equal(wrong.status, 400)

  const same = await request(app)
    .post('/api/v1/auth/change-password')
    .set('Cookie', cookie)
    .send({ currentPassword: 'StrongPass1!', newPassword: 'StrongPass1!' })
  assert.equal(same.status, 400)

  const ok = await request(app)
    .post('/api/v1/auth/change-password')
    .set('Cookie', cookie)
    .send({ currentPassword: 'StrongPass1!', newPassword: 'NewStrong2!' })
  assert.equal(ok.status, 200)

  const login = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password: 'NewStrong2!' })
  assert.equal(login.status, 200)

  const noAuth = await request(app)
    .post('/api/v1/auth/change-password')
    .send({ currentPassword: 'NewStrong2!', newPassword: 'Another3!x' })
  assert.equal(noAuth.status, 401)
})