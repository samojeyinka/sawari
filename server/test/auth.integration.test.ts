import 'dotenv/config'
import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { connectDb, disconnectDb } from '../src/config/db.js'
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