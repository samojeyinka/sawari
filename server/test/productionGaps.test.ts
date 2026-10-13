import 'dotenv/config'
import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { connectDb, disconnectDb } from '../src/config/db.js'
import { AUTH_COOKIE, signAuthToken } from '../src/config/auth.js'
import { isMailConfigured } from '../src/config/env.js'
import { LearningPath } from '../src/models/LearningPath.js'
import { Notification } from '../src/models/Notification.js'
import { Project } from '../src/models/Project.js'
import { SessionContentModel } from '../src/models/SessionContent.js'
import { User } from '../src/models/User.js'

const hasDb = Boolean(process.env.TEST_MONGODB_URI)
const app = createApp()

before(async () => {
  if (!hasDb) return
  await connectDb(process.env.TEST_MONGODB_URI!)
  await Promise.all([
    User.deleteMany({}),
    LearningPath.deleteMany({}),
    Project.deleteMany({}),
    Notification.deleteMany({}),
    SessionContentModel.deleteMany({}),
  ])
})

after(async () => {
  if (hasDb) await disconnectDb()
})

async function registerUser(email: string, firstName = 'Gap'): Promise<string> {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ firstName, email, password: 'StrongPass1!' })
  assert.equal(res.status, 201)
  return (res.headers['set-cookie']?.[0] as string).split(';')[0]
}

async function verifyUser(email: string): Promise<void> {
  await User.updateOne({ email }, { $set: { emailVerified: true } })
}

function cookieFor(userId: string): string {
  return `${AUTH_COOKIE}=${signAuthToken(userId)}`
}

test('OAuth account can set an initial password (no current check)', { skip: !hasDb }, async () => {
  const oauthUser = await User.create({
    provider: 'google',
    providerId: 'google-123',
    email: 'gap-oauth@example.com',
    firstName: 'Oauth',
    emailVerified: true,
  })
  const cookie = cookieFor(oauthUser._id.toString())

  const set = await request(app)
    .post('/api/v1/auth/set-password')
    .set('Cookie', cookie)
    .send({ newPassword: 'StrongPass1!' })
  assert.equal(set.status, 200)

  // The new password works for login.
  const login = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'gap-oauth@example.com', password: 'StrongPass1!' })
  assert.equal(login.status, 200)

  // Setting twice is rejected — use change-password from here on.
  const again = await request(app)
    .post('/api/v1/auth/set-password')
    .set('Cookie', cookie)
    .send({ newPassword: 'AnotherPass1!' })
  assert.equal(again.status, 400)
})

test('local account cannot use set-password (already has one)', { skip: !hasDb }, async () => {
  const cookie = await registerUser('gap-local@example.com')
  const res = await request(app)
    .post('/api/v1/auth/set-password')
    .set('Cookie', cookie)
    .send({ newPassword: 'AnotherPass1!' })
  assert.equal(res.status, 400)
})

test('unverified local sessions: reads open, writes gated', { skip: !hasDb }, async () => {
  const cookie = await registerUser('gap-unverified@example.com')

  const list = await request(app).get('/api/v1/learning-paths').set('Cookie', cookie)
  assert.equal(list.status, 200)

  const write = await request(app)
    .post('/api/v1/learning-paths')
    .set('Cookie', cookie)
    .send({
      subject: 'Gated',
      weeklyHours: '5',
      intensity: 'balanced',
      sections: [],
    })
  assert.equal(write.status, 403)
  assert.equal(write.body.error.code, 'email_unverified')
})

test('health surfaces mail configuration', { skip: !hasDb }, async () => {
  const res = await request(app).get('/api/v1/health')
  assert.equal(res.status, 200)
  assert.equal(res.body.data.mailConfigured, isMailConfigured)
})

test('timezones must be real IANA names', { skip: !hasDb }, async () => {
  const cookie = await registerUser('gap-tz@example.com')

  const junk = await request(app)
    .patch('/api/v1/settings')
    .set('Cookie', cookie)
    .send({ timezone: 'Narnia/Nope' })
  assert.equal(junk.status, 422)

  const good = await request(app)
    .patch('/api/v1/settings')
    .set('Cookie', cookie)
    .send({ timezone: 'Europe/London' })
  assert.equal(good.status, 200)
  assert.equal(good.body.data.timezone, 'Europe/London')
})

test('test-email rejects arbitrary recipients and fails closed', { skip: !hasDb }, async () => {
  const email = 'gap-testmail@example.com'
  const cookie = await registerUser(email)
  await verifyUser(email)

  // Strict body: no targetEmail allowed.
  const spam = await request(app)
    .post('/api/v1/notifications/test-email')
    .set('Cookie', cookie)
    .send({ targetEmail: 'someone-else@example.com' })
  assert.equal(spam.status, 422)

  const res = await request(app)
    .post('/api/v1/notifications/test-email')
    .set('Cookie', cookie)
    .send({})
  if (isMailConfigured) {
    assert.equal(res.status, 200)
    assert.equal(res.body.data.recipient, email)
  } else {
    assert.equal(res.status, 503)
    assert.equal(res.body.error.code, 'mail_unconfigured')
  }
})

test('notifications can be dismissed', { skip: !hasDb }, async () => {
  const cookie = await registerUser('gap-dismiss@example.com')

  const list = await request(app).get('/api/v1/notifications').set('Cookie', cookie)
  assert.equal(list.status, 200)
  const id = list.body.data[0].id as string

  const del = await request(app).delete(`/api/v1/notifications/${id}`).set('Cookie', cookie)
  assert.equal(del.status, 204)

  const after = await request(app).get('/api/v1/notifications').set('Cookie', cookie)
  assert.equal(after.body.meta.total, 0)
})

test('deleting a path cascades to cached session content', { skip: !hasDb }, async () => {
  const email = 'gap-cascade@example.com'
  const cookie = await registerUser(email)
  await verifyUser(email)

  const created = await request(app)
    .post('/api/v1/learning-paths')
    .set('Cookie', cookie)
    .send({
      subject: 'Cascade',
      weeklyHours: '5',
      intensity: 'balanced',
      sections: [
        {
          id: 'sec-1',
          order: 1,
          title: 'One',
          description: '',
          minutes: 30,
          status: 'current',
          doneMinutes: 0,
        },
      ],
    })
  assert.equal(created.status, 201)
  const pathId = created.body.data.id as string
  const user = await User.findOne({ email }).lean()

  await SessionContentModel.create({
    userId: user!._id,
    pathId,
    sectionId: 'sec-1',
    content: { lesson: null, resources: [], practice: null, assessment: null },
    modelName: 'test',
  })
  assert.equal(await SessionContentModel.countDocuments({ pathId }), 1)

  const del = await request(app).delete(`/api/v1/learning-paths/${pathId}`).set('Cookie', cookie)
  assert.equal(del.status, 204)
  assert.equal(await SessionContentModel.countDocuments({ pathId }), 0)
})

test('unbounded arrays and freeform dates are rejected', { skip: !hasDb }, async () => {
  const email = 'gap-bounds@example.com'
  const cookie = await registerUser(email)
  await verifyUser(email)

  const created = await request(app)
    .post('/api/v1/learning-paths')
    .set('Cookie', cookie)
    .send({
      subject: 'Bounds',
      weeklyHours: '5',
      intensity: 'balanced',
      sections: [
        {
          id: 'sec-1',
          order: 1,
          title: 'One',
          description: '',
          minutes: 30,
          status: 'current',
          doneMinutes: 0,
        },
      ],
    })
  assert.equal(created.status, 201)
  const pathId = created.body.data.id as string

  const huge = await request(app)
    .patch(`/api/v1/learning-paths/${pathId}`)
    .set('Cookie', cookie)
    .send({ completedActivities: Array.from({ length: 2001 }, (_, i) => `act-${i}`) })
  assert.equal(huge.status, 422)

  const badDate = await request(app)
    .patch(`/api/v1/learning-paths/${pathId}`)
    .set('Cookie', cookie)
    .send({ assessmentResults: { quiz1: { score: 1, total: 2, date: 'whenever', firstAttempt: true } } })
  assert.equal(badDate.status, 422)

  const project = await request(app)
    .post('/api/v1/projects')
    .set('Cookie', cookie)
    .send({ title: 'Bounds project' })
  assert.equal(project.status, 201)

  const badSubmitted = await request(app)
    .patch(`/api/v1/projects/${project.body.data.id}`)
    .set('Cookie', cookie)
    .send({ submittedAt: 'not-a-date' })
  assert.equal(badSubmitted.status, 422)
})
