import 'dotenv/config'
import assert from 'node:assert/strict'
import { after, afterEach, before, test } from 'node:test'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { connectDb, disconnectDb } from '../src/config/db.js'
import { Project } from '../src/models/Project.js'
import { User } from '../src/models/User.js'

/**
 * Project review pipeline: submit (with note) -> AI review -> persisted
 * feedback. DeepSeek is stubbed; DB + auth are real.
 */
const hasDb = Boolean(process.env.TEST_MONGODB_URI)
const app = createApp()
const originalFetch = globalThis.fetch

before(async () => {
  if (!hasDb) return
  await connectDb(process.env.TEST_MONGODB_URI!)
  await Promise.all([User.deleteMany({}), Project.deleteMany({})])
})

after(async () => {
  if (hasDb) await disconnectDb()
})

afterEach(() => {
  globalThis.fetch = originalFetch
})

async function registerUser(email: string): Promise<string> {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ firstName: 'Rev', email, password: 'StrongPass1!' })
  assert.equal(res.status, 201)
  // Writes require a verified email: verify directly (email delivery is stubbed).
  await User.updateOne({ email }, { $set: { emailVerified: true } })
  return (res.headers['set-cookie']?.[0] as string).split(';')[0]
}

async function createProject(cookie: string): Promise<string> {
  const res = await request(app)
    .post('/api/v1/projects')
    .set('Cookie', cookie)
    .send({
      title: 'Ship the landing page',
      description: 'Design and copy for launch',
      level: 'Beginner',
      estHours: 4,
      objectives: ['Write the copy', 'Lay out the page'],
      tasks: [
        { id: 't1', title: 'Draft headlines', detail: 'Three options' },
        { id: 't2', title: 'Build the page', detail: 'MVP' },
      ],
    })
  assert.equal(res.status, 201)
  return res.body.data.id as string
}

function stubReviewAi(review: unknown) {
  globalThis.fetch = (async () => {
    return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(review) } }] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }) as unknown as typeof fetch
}

const modelReview = {
  strengths: ['Headlines map to the brief', 'Both tasks finished'],
  improve: ['Tighten the hero copy', 'Add one social proof block'],
  note: 'Solid first ship. Two tweaks and it is ready to share.',
}

test('submit with note -> AI review persists real feedback', { skip: !hasDb }, async () => {
  const cookie = await registerUser('review-flow@example.com')
  const projectId = await createProject(cookie)

  const submitted = await request(app)
    .patch(`/api/v1/projects/${projectId}`)
    .set('Cookie', cookie)
    .send({ completedTaskIds: ['t1', 't2'], submitted: true, submissionNote: 'Cut scope to hero only.' })
  assert.equal(submitted.status, 200)
  assert.equal(submitted.body.data.submissionNote, 'Cut scope to hero only.')

  stubReviewAi(modelReview)
  const reviewed = await request(app).post(`/api/v1/projects/${projectId}/review`).set('Cookie', cookie)
  assert.equal(reviewed.status, 200)
  assert.equal(reviewed.body.data.reviewed, true)
  assert.equal(reviewed.body.data.status, 'completed')
  assert.deepEqual(reviewed.body.data.feedback.strengths, modelReview.strengths)
  assert.deepEqual(reviewed.body.data.feedback.improve, modelReview.improve)
  assert.equal(reviewed.body.data.feedback.note, modelReview.note)

  const stored = await Project.findById(projectId).lean()
  assert.equal(stored?.feedback?.note, modelReview.note)
  assert.equal(stored?.submissionNote, 'Cut scope to hero only.')
})

test('review requires submission and ownership', { skip: !hasDb }, async () => {
  const cookie = await registerUser('review-guard@example.com')
  const other = await registerUser('review-other@example.com')
  const projectId = await createProject(cookie)

  stubReviewAi(modelReview)
  const tooEarly = await request(app).post(`/api/v1/projects/${projectId}/review`).set('Cookie', cookie)
  assert.equal(tooEarly.status, 400)

  const foreign = await request(app).post(`/api/v1/projects/${projectId}/review`).set('Cookie', other)
  assert.equal(foreign.status, 404)

  const anon = await request(app).post(`/api/v1/projects/${projectId}/review`)
  assert.equal(anon.status, 401)

  const missing = await request(app)
    .post('/api/v1/projects/000000000000000000000000/review')
    .set('Cookie', cookie)
  assert.equal(missing.status, 404)
})
