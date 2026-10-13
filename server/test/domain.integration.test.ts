import 'dotenv/config'
import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { connectDb, disconnectDb } from '../src/config/db.js'
import { Job } from '../src/models/Job.js'
import { LearningPath } from '../src/models/LearningPath.js'
import { Notification } from '../src/models/Notification.js'
import { Project } from '../src/models/Project.js'
import { User } from '../src/models/User.js'
import { runSchedulerTick } from '../src/jobs/scheduler.js'

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
    Job.deleteMany({}),
  ])
})

after(async () => {
  if (hasDb) await disconnectDb()
})

async function registerUser(email: string): Promise<string> {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ firstName: 'Sam', email, password: 'StrongPass1!' })
  assert.equal(res.status, 201)
  // Writes require a verified email: verify directly (email delivery is stubbed).
  await User.updateOne({ email }, { $set: { emailVerified: true } })
  return (res.headers['set-cookie']?.[0] as string).split(';')[0]
}

test('learning path + project lifecycle, scoped per user', { skip: !hasDb }, async () => {
  const cookieA = await registerUser('domain-a@example.com')
  const cookieB = await registerUser('domain-b@example.com')

  /* ---------------------------- learning path ---------------------- */
  const created = await request(app)
    .post('/api/v1/learning-paths')
    .set('Cookie', cookieA)
    .send({
      subject: 'Project Management',
      goal: 'Lead my first project confidently',
      experience: 'beginner',
      reason: 'career',
      weeklyHours: '5',
      intensity: 'balanced',
      formats: ['videos', 'exercises'],
      targetDate: '2026-12-31',
      sections: [
        {
          id: 'sec-1',
          order: 1,
          title: 'Foundations',
          description: 'The basics',
          minutes: 30,
          status: 'current',
          doneMinutes: 0,
        },
        {
          id: 'sec-2',
          order: 2,
          title: 'In practice',
          description: 'Apply it',
          minutes: 45,
          status: 'locked',
          doneMinutes: 0,
        },
      ],
    })
  assert.equal(created.status, 201)
  assert.equal(created.body.success, true)
  assert.ok(created.body.data.id)
  assert.equal(created.body.data.userId, undefined)
  assert.equal(created.body.data.subject, 'Project Management')
  // sections supplied at creation are persisted and returned
  assert.equal(created.body.data.sections.length, 2)
  assert.equal(created.body.data.sections[0].id, 'sec-1')
  assert.equal(created.body.data.sections[1].title, 'In practice')
  const pathId = created.body.data.id as string

  // list (paginated, includes meta, hides sections)
  const list = await request(app).get('/api/v1/learning-paths').set('Cookie', cookieA)
  assert.equal(list.status, 200)
  assert.equal(list.body.meta.total, 1)
  assert.equal(list.body.meta.page, 1)
  assert.equal(list.body.data[0].id, pathId)

  // get
  const got = await request(app).get(`/api/v1/learning-paths/${pathId}`).set('Cookie', cookieA)
  assert.equal(got.status, 200)
  assert.equal(got.body.data.subject, 'Project Management')

  // update progress fields
  const updated = await request(app)
    .patch(`/api/v1/learning-paths/${pathId}`)
    .set('Cookie', cookieA)
    .send({ targetDate: '2027-01-15', currentSectionId: 'sec-1' })
  assert.equal(updated.status, 200)
  assert.equal(updated.body.data.targetDate, '2027-01-15')
  assert.equal(updated.body.data.currentSectionId, 'sec-1')

  // unknown fillable field rejected
  const badField = await request(app)
    .patch(`/api/v1/learning-paths/${pathId}`)
    .set('Cookie', cookieA)
    .send({ isAdmin: true })
  assert.equal(badField.status, 422)

  // malformed id
  const badId = await request(app).get('/api/v1/learning-paths/not-an-id').set('Cookie', cookieA)
  assert.equal(badId.status, 422)

  // isolation: user B cannot read user A's path
  const forbidden = await request(app)
    .get(`/api/v1/learning-paths/${pathId}`)
    .set('Cookie', cookieB)
  assert.equal(forbidden.status, 404)

  // unauthenticated
  const anon = await request(app).get('/api/v1/learning-paths')
  assert.equal(anon.status, 401)

  /* ------------------------------ project -------------------------- */
  const proj = await request(app)
    .post('/api/v1/projects')
    .set('Cookie', cookieA)
    .send({
      title: 'Plan a launch',
      description: 'Ship a small feature end to end',
      pathId,
      level: 'Beginner',
      estHours: 4,
      objectives: ['Scope it', 'Track it'],
      tasks: [
        { id: 't1', title: 'Write the brief', detail: 'One page' },
        { id: 't2', title: 'Build it', detail: 'MVP' },
      ],
      deliverables: ['A shipped feature'],
      related: ['Scoping', 'Prioritisation'],
    })
  assert.equal(proj.status, 201)
  assert.equal(proj.body.data.completedTaskIds.length, 0)
  const projectId = proj.body.data.id as string

  // pathId must belong to the caller
  const wrongParent = await request(app)
    .post('/api/v1/projects')
    .set('Cookie', cookieB)
    .send({ title: 'Sneaky', pathId })
  assert.equal(wrongParent.status, 400)

  // filtered list
  const projList = await request(app)
    .get(`/api/v1/projects?status=available&pathId=${pathId}`)
    .set('Cookie', cookieA)
  assert.equal(projList.status, 200)
  assert.equal(projList.body.meta.total, 1)

  // progress update
  const projUpd = await request(app)
    .patch(`/api/v1/projects/${projectId}`)
    .set('Cookie', cookieA)
    .send({ completedTaskIds: ['t1'], submitted: true })
  assert.equal(projUpd.status, 200)
  assert.deepEqual(projUpd.body.data.completedTaskIds, ['t1'])
  assert.equal(projUpd.body.data.submitted, true)

  /* ------------------------------ deletes -------------------------- */
  const delPath = await request(app).delete(`/api/v1/learning-paths/${pathId}`).set('Cookie', cookieA)
  assert.equal(delPath.status, 204)

  // project was detached, then we remove it
  const detached = await request(app).get(`/api/v1/projects/${projectId}`).set('Cookie', cookieA)
  assert.equal(detached.status, 200)
  assert.equal(detached.body.data.pathId, null)

  const delProj = await request(app).delete(`/api/v1/projects/${projectId}`).set('Cookie', cookieA)
  assert.equal(delProj.status, 204)

  const gone = await request(app).get(`/api/v1/learning-paths/${pathId}`).set('Cookie', cookieA)
  assert.equal(gone.status, 404)
})

test('register creates a verification notification and queues the email', { skip: !hasDb }, async () => {
  const email = 'notif-a@example.com'
  const cookie = await registerUser(email)

  // the verification notification is created for the new account
  const list = await request(app).get('/api/v1/notifications').set('Cookie', cookie)
  assert.equal(list.status, 200)
  assert.equal(list.body.meta.unreadCount, 1)
  assert.equal(list.body.meta.total, 1)
  assert.equal(list.body.data[0].kind, 'account')
  assert.equal(list.body.data[0].read, false)
  assert.equal(list.body.data[0].title, 'Verify your email address')
  const notificationId = list.body.data[0].id as string

  // the welcome email was enqueued as a durable job for this recipient
  const queued = await Job.findOne({ name: 'send-email', 'payload.to': email }).lean()
  assert.ok(queued, 'expected a send-email job')
  assert.equal((queued!.payload as { to: string }).to, email)

  // marking one read returns the updated row and lowers the unread count
  const read = await request(app)
    .post(`/api/v1/notifications/${notificationId}/read`)
    .set('Cookie', cookie)
  assert.equal(read.status, 200)
  assert.equal(read.body.data.read, true)

  const afterRead = await request(app).get('/api/v1/notifications').set('Cookie', cookie)
  assert.equal(afterRead.body.meta.unreadCount, 0)

  // isolation: another user never sees it
  const otherCookie = await registerUser('notif-b@example.com')
  const otherList = await request(app).get('/api/v1/notifications').set('Cookie', otherCookie)
  assert.equal(otherList.body.meta.total, 1)
  assert.notEqual(otherList.body.data[0].id, notificationId)

  // read-all clears anything unread for the caller
  const readAll = await request(app).post('/api/v1/notifications/read-all').set('Cookie', otherCookie)
  assert.equal(readAll.status, 200)
  assert.equal(readAll.body.data.unreadCount, 0)

  const anon = await request(app).get('/api/v1/notifications')
  assert.equal(anon.status, 401)
})

test('settings endpoint and reminder scheduler', { skip: !hasDb }, async () => {
  const email = 'schedule-a@example.com'
  const cookie = await registerUser(email)

  // defaults come back for a fresh account
  const initial = await request(app).get('/api/v1/settings').set('Cookie', cookie)
  assert.equal(initial.status, 200)
  assert.equal(initial.body.data.dailyReminder, true)
  assert.equal(initial.body.data.timezone, 'UTC')
  assert.deepEqual(initial.body.data.reminderDays, ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])

  // unknown field rejected (strict body)
  const bad = await request(app)
    .patch('/api/v1/settings')
    .set('Cookie', cookie)
    .send({ monthly: true })
  assert.equal(bad.status, 422)

  // choose a Monday delivery time; disable the weekly summary to isolate the reminder
  const patched = await request(app)
    .patch('/api/v1/settings')
    .set('Cookie', cookie)
    .send({ timezone: 'UTC', reminderTime: '09:00', reminderDays: ['Mon'], weeklySummary: false })
  assert.equal(patched.status, 200)
  assert.equal(patched.body.data.reminderTime, '09:00')
  assert.deepEqual(patched.body.data.reminderDays, ['Mon'])
  assert.equal(patched.body.data.weeklySummary, false)

  // a path with an active section to remind about
  const created = await request(app)
    .post('/api/v1/learning-paths')
    .set('Cookie', cookie)
    .send({
      subject: 'Public Speaking',
      weeklyHours: '5',
      intensity: 'balanced',
      sections: [
        {
          id: 'sec-1',
          order: 1,
          title: 'Finding your voice',
          description: '',
          minutes: 30,
          status: 'current',
          doneMinutes: 0,
        },
      ],
    })
  assert.equal(created.status, 201)
  await request(app)
    .patch(`/api/v1/learning-paths/${created.body.data.id}`)
    .set('Cookie', cookie)
    .send({ currentSectionId: 'sec-1' })

  const monday = new Date('2026-03-02T09:00:00Z') // a Monday, 09:00 UTC
  await runSchedulerTick(monday)

  const user = await User.findOne({ email })
  assert.ok(user, 'expected the user to exist')
  assert.ok(user!.reminderLastSentAt, 'expected reminderLastSentAt to be set')

  const reminders = await Notification.find({ user: user!._id, kind: 'session' }).lean()
  assert.equal(reminders.length, 1)
  assert.match(reminders[0]!.title, /^Today:/)

  // a second tick on the same local day must not double-send
  await runSchedulerTick(new Date('2026-03-02T09:02:00Z'))
  const stillOne = await Notification.countDocuments({ user: user!._id, kind: 'session' })
  assert.equal(stillOne, 1)
})