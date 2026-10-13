import 'dotenv/config'
import assert from 'node:assert/strict'
import { after, afterEach, before, test } from 'node:test'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { connectDb, disconnectDb } from '../src/config/db.js'
import { LearningPath } from '../src/models/LearningPath.js'
import { User } from '../src/models/User.js'
import { resetPaypalTokenCache } from '../src/services/paypal.js'

/**
 * Billing + path limits against a real database.
 * PayPal and DeepSeek are stubbed at fetch; no network leaves the box.
 */
const hasDb = Boolean(process.env.TEST_MONGODB_URI)
const app = createApp()

const originalFetch = globalThis.fetch

before(async () => {
  if (!hasDb) return
  await connectDb(process.env.TEST_MONGODB_URI!)
  await Promise.all([User.deleteMany({}), LearningPath.deleteMany({})])
})

after(async () => {
  if (hasDb) await disconnectDb()
})

afterEach(() => {
  globalThis.fetch = originalFetch
  resetPaypalTokenCache()
})

async function registerUser(email: string): Promise<string> {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ firstName: 'Bill', email, password: 'StrongPass1!' })
  assert.equal(res.status, 201)
  return (res.headers['set-cookie']?.[0] as string).split(';')[0]
}

async function createPath(cookie: string, subject: string, sectionId: string) {
  return request(app)
    .post('/api/v1/learning-paths')
    .set('Cookie', cookie)
    .send({
      subject,
      weeklyHours: '5',
      intensity: 'balanced',
      sections: [
        { id: sectionId, order: 1, title: 'First steps', description: 'Begin here.', minutes: 60, status: 'current', doneMinutes: 0 },
      ],
    })
}

test('free accounts hold exactly 1 path', { skip: !hasDb }, async () => {
  const cookie = await registerUser('limit-free@example.com')

  const first = await createPath(cookie, 'Subject One', 'lim-free-s1')
  assert.equal(first.status, 201)

  const second = await createPath(cookie, 'Subject Two', 'lim-free-s2')
  assert.equal(second.status, 403)
  assert.equal(second.body.error.code, 'path_limit_reached')

  const status = await request(app).get('/api/v1/billing/status').set('Cookie', cookie)
  assert.equal(status.status, 200)
  assert.equal(status.body.data.plan, 'free')
  assert.equal(status.body.data.pathLimit, 1)
  assert.equal(status.body.data.pathsUsed, 1)
  assert.equal(status.body.data.canCreateMore, false)
})

test('pro accounts hold up to 5 paths', { skip: !hasDb }, async () => {
  const cookie = await registerUser('limit-pro@example.com')
  await User.updateOne(
    { email: 'limit-pro@example.com' },
    { $set: { plan: 'pro', proPaidAt: new Date(), paypalCaptureId: 'test-cap-pro' } },
  )

  for (let i = 1; i <= 5; i += 1) {
    const res = await createPath(cookie, `Pro Subject ${i}`, `lim-pro-s${i}`)
    assert.equal(res.status, 201)
  }
  const sixth = await createPath(cookie, 'Pro Subject 6', 'lim-pro-s6')
  assert.equal(sixth.status, 403)
  assert.equal(sixth.body.error.code, 'path_limit_reached')
})

test('a verified own key unlocks the pro limit', { skip: !hasDb }, async () => {
  const cookie = await registerUser('limit-key@example.com')
  await User.updateOne(
    { email: 'limit-key@example.com' },
    { $set: { aiKeySealed: 'sealed-test-bundle', aiKeyLast4: '…wxyz', aiKeyVerifiedAt: new Date() } },
  )

  assert.equal((await createPath(cookie, 'Key Subject 1', 'lim-key-s1')).status, 201)
  assert.equal((await createPath(cookie, 'Key Subject 2', 'lim-key-s2')).status, 201)
})

/* ------------------------- paypal capture ------------------------- */

let captureDoc: Record<string, unknown> = {}

function stubPaypal(capture: Record<string, unknown>) {
  captureDoc = capture
  globalThis.fetch = (async (url: string | URL | Request) => {
    const urlStr = String(url)
    if (urlStr.includes('oauth2/token')) {
      return new Response(JSON.stringify({ access_token: 'sandbox-token', expires_in: 3600 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    if (urlStr.includes('/capture')) {
      return new Response(JSON.stringify(captureDoc), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    return new Response('Not found', { status: 404 })
  }) as unknown as typeof fetch
}

function completedCapture(customId: string, value = '6.00') {
  return {
    id: 'PAY-ORDER-1',
    status: 'COMPLETED',
    purchase_units: [
      {
        custom_id: customId,
        amount: { currency_code: 'USD', value },
        payments: {
          captures: [{ id: 'CAP-1', status: 'COMPLETED', amount: { currency_code: 'USD', value } }],
        },
      },
    ],
  }
}

test('capture grants pro only on exact verified payment', { skip: !hasDb }, async () => {
  const cookie = await registerUser('pay-good@example.com')
  const me = await request(app).get('/api/v1/me').set('Cookie', cookie)
  const userId = me.body.data.id as string

  stubPaypal(completedCapture(userId))
  const done = await request(app)
    .post('/api/v1/billing/paypal/capture')
    .set('Cookie', cookie)
    .send({ orderId: 'PAY-ORDER-1' })
  assert.equal(done.status, 200)
  assert.equal(done.body.data.plan, 'pro')

  const stored = await User.findOne({ email: 'pay-good@example.com' }).lean()
  assert.equal(stored?.paypalCaptureId, 'CAP-1')
  assert.equal(stored?.plan, 'pro')

  // Replaying the same capture is a harmless no-op.
  const replay = await request(app)
    .post('/api/v1/billing/paypal/capture')
    .set('Cookie', cookie)
    .send({ orderId: 'PAY-ORDER-1' })
  assert.equal(replay.status, 200)
  assert.equal(replay.body.data.alreadyPro, true)
})

test('capture rejects wrong amount, wrong owner, incomplete orders', { skip: !hasDb }, async () => {
  const cookie = await registerUser('pay-bad@example.com')
  const me = await request(app).get('/api/v1/me').set('Cookie', cookie)
  const userId = me.body.data.id as string

  stubPaypal(completedCapture(userId, '5.00'))
  const wrongAmount = await request(app)
    .post('/api/v1/billing/paypal/capture')
    .set('Cookie', cookie)
    .send({ orderId: 'PAY-ORDER-2' })
  assert.equal(wrongAmount.status, 400)

  stubPaypal(completedCapture('someone-else'))
  const wrongOwner = await request(app)
    .post('/api/v1/billing/paypal/capture')
    .set('Cookie', cookie)
    .send({ orderId: 'PAY-ORDER-3' })
  assert.equal(wrongOwner.status, 403)

  stubPaypal({ id: 'PAY-ORDER-4', status: 'APPROVAL_PENDING', purchase_units: [] })
  const incomplete = await request(app)
    .post('/api/v1/billing/paypal/capture')
    .set('Cookie', cookie)
    .send({ orderId: 'PAY-ORDER-4' })
  assert.equal(incomplete.status, 400)

  const stored = await User.findOne({ email: 'pay-bad@example.com' }).lean()
  assert.equal(stored?.plan, 'free')
})

/* --------------------------- own AI key --------------------------- */

test('saveAiKey verifies live, seals, and never returns the key', { skip: !hasDb }, async () => {
  const cookie = await registerUser('key-save@example.com')
  globalThis.fetch = (async () => {
    return new Response(JSON.stringify({ data: [{ id: 'deepseek-chat' }] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }) as unknown as typeof fetch

  const saved = await request(app)
    .post('/api/v1/billing/ai-key')
    .set('Cookie', cookie)
    .send({ provider: 'deepseek', key: 'sk-live-valid-key-1234567890' })
  assert.equal(saved.status, 200)
  assert.equal(saved.body.data.hasOwnKey, true)
  assert.equal(saved.body.data.aiKeyLast4, '…7890')
  assert.ok(!JSON.stringify(saved.body).includes('sk-live-valid-key'))

  const stored = await User.findOne({ email: 'key-save@example.com' }).select('+aiKeySealed').lean()
  assert.ok(stored?.aiKeySealed)
  assert.ok(!stored?.aiKeySealed?.includes('sk-live-valid-key'))

  const removed = await request(app).delete('/api/v1/billing/ai-key').set('Cookie', cookie)
  assert.equal(removed.status, 200)
  assert.equal(removed.body.data.hasOwnKey, false)
})

test('saveAiKey rejects keys DeepSeek refuses', { skip: !hasDb }, async () => {
  const cookie = await registerUser('key-bad@example.com')
  globalThis.fetch = (async () => {
    return new Response('Unauthorized', { status: 401 })
  }) as unknown as typeof fetch

  const res = await request(app)
    .post('/api/v1/billing/ai-key')
    .set('Cookie', cookie)
    .send({ provider: 'deepseek', key: 'sk-bogus-key-1234567890' })
  assert.equal(res.status, 400)
})
