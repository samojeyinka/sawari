import assert from 'node:assert/strict'
import { test } from 'node:test'
import request from 'supertest'
import { createApp } from '../src/app.js'

const app = createApp()

test('GET /api/v1/health returns the success envelope', async () => {
  const res = await request(app).get('/api/v1/health')
  assert.equal(res.status, 200)
  assert.equal(res.body.success, true)
  assert.equal(res.body.data.status, 'ok')
  assert.equal(typeof res.body.data.uptime, 'number')
})

test('unknown route returns a 404 envelope', async () => {
  const res = await request(app).get('/api/v1/nope')
  assert.equal(res.status, 404)
  assert.equal(res.body.success, false)
  assert.equal(res.body.error.code, 'not_found')
})

test('register rejects a weak password with field errors', async () => {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ firstName: 'Ada', email: 'ada@example.com', password: 'weak' })

  assert.equal(res.status, 422)
  assert.equal(res.body.success, false)
  assert.equal(res.body.error.code, 'validation_failed')
  assert.ok(Array.isArray(res.body.error.details.fields.password))
  const messages = res.body.error.details.fields.password as string[]
  assert.ok(messages.some((message) => message.includes('8 characters')))
})

test('register rejects unknown fields (strict fillable)', async () => {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ firstName: 'Ada', email: 'ada@example.com', password: 'StrongPass1!', isAdmin: true })

  assert.equal(res.status, 422)
  assert.equal(res.body.error.code, 'validation_failed')
  assert.ok(res.body.error.details.fields)
})

test('GET /api/v1/me without cookie is a 401', async () => {
  const res = await request(app).get('/api/v1/me')
  assert.equal(res.status, 401)
  assert.equal(res.body.error.code, 'unauthorized')
})

test('GET /api/v1/me with a tampered token is a 401', async () => {
  const res = await request(app)
    .get('/api/v1/me')
    .set('Cookie', 'sawari_token=not.a.real-jwt')
  assert.equal(res.status, 401)
  assert.equal(res.body.error.code, 'unauthorized')
})