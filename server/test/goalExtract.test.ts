import 'dotenv/config'
import assert from 'node:assert/strict'
import { after, afterEach, before, test } from 'node:test'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { connectDb, disconnectDb } from '../src/config/db.js'
import { User } from '../src/models/User.js'
import {
  admireSearchMessages,
  goalExtractMessages,
  type GoalExtractionMode,
} from '../src/services/ai/prompts.js'
import {
  admireCandidatesResponseSchema,
  goalExtractionResponseSchema,
} from '../src/services/ai/schemas.js'

/**
 * Goal extraction contracts: prompt shape, response schema, and the
 * POST /ai/extract-goal endpoint (AI stubbed, real DB + auth).
 */

const validGoal = {
  subject: 'Public Speaking',
  outcome: 'Deliver a keynote without notes.',
  skills: ['Message', 'Structure', 'Delivery', 'Voice & pacing', 'Storytelling'],
  label: 'Amara Osei',
  note: "Niche read from Amara Osei's profile",
}

test('goal extraction schema accepts a well-formed goal', () => {
  assert.equal(goalExtractionResponseSchema.safeParse(validGoal).success, true)
})

test('goal extraction schema rejects filler and short lists', () => {
  assert.equal(
    goalExtractionResponseSchema.safeParse({ ...validGoal, skills: ['One', 'Two'] }).success,
    false,
  )
  assert.equal(
    goalExtractionResponseSchema.safeParse({ ...validGoal, subject: 'X' }).success,
    false,
  )
})

test('goalExtractMessages carries mode and input', () => {
  for (const mode of ['admire', 'build'] as GoalExtractionMode[]) {
    const messages = goalExtractMessages(mode, 'some input here')
    assert.equal(messages.length, 2)
    assert.match(messages[1].content, new RegExp(`Mode: ${mode}`))
    assert.match(messages[1].content, /some input here/)
    assert.match(messages[0].content, /Return only valid JSON/)
  }
})

/* --------------------------- admire search ------------------------ */

const validCandidates = {
  candidates: [
    {
      name: 'Amara Osei',
      role: 'Product designer, design systems',
      blurb: 'Builds design systems for large product teams and teaches the craft.',
      subject: 'Product Design',
      skills: ['Design systems', 'Typography', 'Prototyping', 'User research', 'Handoff'],
    },
    {
      name: 'Nadia Rahim',
      role: 'Design lead, editorial products',
      blurb: 'Leads editorial design and typography for digital publications.',
      subject: 'Editorial Design',
      skills: ['Layout', 'Typography', 'Grids', 'Print', 'Art direction'],
    },
    {
      name: 'Marta Silva',
      role: 'UX researcher, product',
      blurb: 'Runs research programmes that shape product decisions.',
      subject: 'UX Research',
      skills: ['Interviewing', 'Usability testing', 'Synthesis', 'Journey maps', 'Metrics'],
    },
  ],
}

const validCandidate = validCandidates.candidates[0]

test('admire candidates schema accepts a well-formed list', () => {
  assert.equal(admireCandidatesResponseSchema.safeParse(validCandidates).success, true)
})

test('admire candidates schema rejects too few candidates and thin skills', () => {
  assert.equal(admireCandidatesResponseSchema.safeParse({ candidates: [] }).success, false)
  assert.equal(
    admireCandidatesResponseSchema.safeParse({
      candidates: [{ ...validCandidate, skills: ['One'] }],
    }).success,
    false,
  )
})

test('admireSearchMessages carries the query', () => {
  const messages = admireSearchMessages('a designer known for design systems')
  assert.equal(messages.length, 2)
  assert.match(messages[1].content, /a designer known for design systems/)
  assert.match(messages[0].content, /Return only valid JSON/)
})

/* --------------------------- endpoint ----------------------------- */

const hasDb = Boolean(process.env.TEST_MONGODB_URI)
const app = createApp()
const originalFetch = globalThis.fetch

before(async () => {
  if (!hasDb) return
  await connectDb(process.env.TEST_MONGODB_URI!)
  await User.deleteMany({})
})

after(async () => {
  if (hasDb) await disconnectDb()
})

afterEach(() => {
  globalThis.fetch = originalFetch
})

async function authCookie(email: string): Promise<string> {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ firstName: 'Goal', email, password: 'StrongPass1!' })
  assert.equal(res.status, 201)
  // Writes require a verified email: verify directly (email delivery is stubbed).
  await User.updateOne({ email }, { $set: { emailVerified: true } })
  return (res.headers['set-cookie']?.[0] as string).split(';')[0]
}

test('POST /ai/extract-goal returns the model goal', { skip: !hasDb }, async () => {
  const cookie = await authCookie('goal-ai@example.com')
  globalThis.fetch = (async () => {
    return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(validGoal) } }] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }) as unknown as typeof fetch

  const res = await request(app)
    .post('/api/v1/ai/extract-goal')
    .set('Cookie', cookie)
    .send({ mode: 'admire', input: 'Amara Osei, keynote speaker' })
  assert.equal(res.status, 200)
  assert.equal(res.body.data.subject, 'Public Speaking')
  assert.equal(res.body.data.skills.length, 5)
  assert.equal(res.body.data.label, 'Amara Osei')
})

test('POST /ai/extract-goal validates its input', { skip: !hasDb }, async () => {
  const cookie = await authCookie('goal-bad@example.com')
  const short = await request(app)
    .post('/api/v1/ai/extract-goal')
    .set('Cookie', cookie)
    .send({ mode: 'build', input: 'x' })
  assert.equal(short.status, 422)

  const badMode = await request(app)
    .post('/api/v1/ai/extract-goal')
    .set('Cookie', cookie)
    .send({ mode: 'topic', input: 'a proper build idea here' })
  assert.equal(badMode.status, 422)

  const anon = await request(app)
    .post('/api/v1/ai/extract-goal')
    .send({ mode: 'build', input: 'a proper build idea here' })
  assert.equal(anon.status, 401)
})

test('POST /ai/admire-candidates returns model candidates', { skip: !hasDb }, async () => {
  const cookie = await authCookie('admire-ai@example.com')
  globalThis.fetch = (async () => {
    return new Response(
      JSON.stringify({ choices: [{ message: { content: JSON.stringify(validCandidates) } }] }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  }) as unknown as typeof fetch

  const res = await request(app)
    .post('/api/v1/ai/admire-candidates')
    .set('Cookie', cookie)
    .send({ query: 'a designer known for design systems' })
  assert.equal(res.status, 200)
  assert.equal(res.body.data.candidates.length, 3)
  assert.equal(res.body.data.candidates[0].name, 'Amara Osei')
  assert.equal(res.body.data.candidates[0].skills.length, 5)
})

test('POST /ai/admire-candidates validates its input', { skip: !hasDb }, async () => {
  const cookie = await authCookie('admire-bad@example.com')
  const short = await request(app)
    .post('/api/v1/ai/admire-candidates')
    .set('Cookie', cookie)
    .send({ query: 'x' })
  assert.equal(short.status, 422)

  const anon = await request(app)
    .post('/api/v1/ai/admire-candidates')
    .send({ query: 'a designer known for design systems' })
  assert.equal(anon.status, 401)
})
