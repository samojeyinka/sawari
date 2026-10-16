import 'dotenv/config'
import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { connectDb, disconnectDb } from '../src/config/db.js'
import { CatalogPath } from '../src/models/CatalogPath.js'
import { CatalogReview } from '../src/models/CatalogReview.js'
import { LearningPath } from '../src/models/LearningPath.js'
import { SessionContentModel } from '../src/models/SessionContent.js'
import { User } from '../src/models/User.js'

/**
 * Public catalog: admins author paths, anyone reads them without auth, and
 * verified learners enroll (creating a personal copy) and leave reviews.
 */
const hasDb = Boolean(process.env.TEST_MONGODB_URI)
const app = createApp()

before(async () => {
  if (!hasDb) return
  await connectDb(process.env.TEST_MONGODB_URI!)
  await Promise.all([
    User.deleteMany({}),
    LearningPath.deleteMany({}),
    CatalogPath.deleteMany({}),
    CatalogReview.deleteMany({}),
    SessionContentModel.deleteMany({}),
  ])
})

after(async () => {
  if (hasDb) await disconnectDb()
})

interface Account {
  cookie: string
  id: string
}

async function registerUser(
  email: string,
  opts: { verified?: boolean; admin?: boolean } = {},
): Promise<Account> {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ firstName: 'Cat', email, password: 'StrongPass1!' })
  assert.equal(res.status, 201)
  const cookie = (res.headers['set-cookie']?.[0] as string).split(';')[0]

  const set: Record<string, unknown> = {}
  if (opts.verified) set.emailVerified = true
  if (opts.admin) set.role = 'admin'
  const user = await User.findOneAndUpdate({ email }, { $set: set }, { returnDocument: 'after' })
  return { cookie, id: user!._id.toString() }
}

function sectionInput(title = 'Foundations') {
  return {
    title,
    description: 'Where it all begins.',
    minutes: 45,
    content: {
      lesson: {
        title: 'Welcome',
        minutes: 20,
        intro: 'A short introduction.',
        blocks: [{ type: 'p', text: 'Start with the basics.' }],
      },
      resources: [
        {
          title: 'The primer',
          kind: 'article',
          source: 'Sawari Docs',
          minutes: 10,
          summary: 'A gentle primer.',
          body: ['First line.', 'Second line.'],
        },
      ],
      practice: {
        kind: 'written',
        title: 'Try it',
        minutes: 15,
        brief: 'Write a short answer.',
        prompt: 'Explain the basics.',
        modelAnswer: 'The basics are ...',
      },
      assessment: {
        title: 'Check yourself',
        intro: 'Three quick questions.',
        minutes: 10,
        questions: [
          {
            prompt: 'What is 2 + 2?',
            choices: ['3', '4', '5'],
            correctIndex: 1,
            explanation: 'Two plus two is four.',
          },
        ],
      },
    },
  }
}

function catalogPayload(overrides: Record<string, unknown> = {}) {
  return {
    subject: 'Intro to Bread Baking',
    summary: 'Bake your first loaf.',
    goal: 'Bake a simple sourdough loaf.',
    level: 'beginner',
    tags: ['baking', 'cooking'],
    weeklyHours: '5',
    intensity: 'balanced',
    formats: ['articles', 'projects'],
    expectedWeeks: 4,
    expectedHours: 20,
    sections: [sectionInput()],
    published: true,
    ...overrides,
  }
}

async function createCatalog(admin: Account, overrides: Record<string, unknown> = {}) {
  const res = await request(app)
    .post('/api/v1/admin/catalog-paths')
    .set('Cookie', admin.cookie)
    .send(catalogPayload(overrides))
  assert.equal(res.status, 201, JSON.stringify(res.body))
  return res.body.data as Record<string, unknown>
}

/* ------------------------------ access ---------------------------- */

test('catalog admin routes are gated to admins', { skip: !hasDb }, async () => {
  const member = await registerUser('catalog-member@example.com', { verified: true })
  const anon = await request(app).get('/api/v1/admin/catalog-paths')
  assert.equal(anon.status, 401)

  const forbidden = await request(app)
    .get('/api/v1/admin/catalog-paths')
    .set('Cookie', member.cookie)
  assert.equal(forbidden.status, 403)
  assert.equal(forbidden.body.error.code, 'admin_only')
})

/* --------------------------- create + read ------------------------ */

test('admin creates a published path and the public can read it', { skip: !hasDb }, async () => {
  const admin = await registerUser('catalog-admin@example.com', { admin: true, verified: true })
  const created = await createCatalog(admin)

  assert.equal(created.slug, 'intro-to-bread-baking')
  assert.equal(created.published, true)
  const sections = created.sections as Array<{ id: string }>
  assert.equal(sections.length, 1)
  assert.ok(sections[0].id)

  // Public list: no auth required, content omitted from cards.
  const list = await request(app).get('/api/v1/catalog')
  assert.equal(list.status, 200)
  assert.equal(list.body.meta.total, 1)
  assert.equal(list.body.data[0].slug, 'intro-to-bread-baking')

  // Public detail by slug: full authored content.
  const detail = await request(app).get('/api/v1/catalog/intro-to-bread-baking')
  assert.equal(detail.status, 200)
  assert.equal(detail.body.data.subject, 'Intro to Bread Baking')
  assert.ok(detail.body.data.sections[0].content.lesson.title)

  assert.equal((await request(app).get('/api/v1/catalog/nope')).status, 404)
})

test('unpublished paths are hidden from the public', { skip: !hasDb }, async () => {
  const admin = await registerUser('catalog-admin-2@example.com', { admin: true, verified: true })
  const created = await createCatalog(admin, {
    subject: 'Hidden Draft',
    published: false,
  })

  const detail = await request(app).get(`/api/v1/catalog/${created.slug}`)
  assert.equal(detail.status, 404)

  const list = await request(app).get('/api/v1/catalog')
  const slugs = (list.body.data as Array<{ slug: string }>).map((p) => p.slug)
  assert.ok(!slugs.includes(created.slug as string))

  // Publishing makes it visible.
  const published = await request(app)
    .post(`/api/v1/admin/catalog-paths/${created.id}/publish`)
    .set('Cookie', admin.cookie)
  assert.equal(published.status, 200)
  assert.equal((await request(app).get(`/api/v1/catalog/${created.slug}`)).status, 200)
})

test('invalid catalog content is rejected with 422', { skip: !hasDb }, async () => {
  const admin = await registerUser('catalog-admin-3@example.com', { admin: true, verified: true })
  const bad = catalogPayload({ sections: [{ title: 'Empty', content: { lesson: { title: 'x' } } }] })
  const res = await request(app)
    .post('/api/v1/admin/catalog-paths')
    .set('Cookie', admin.cookie)
    .send(bad)
  assert.equal(res.status, 422)
})

/* ------------------------ section id stability -------------------- */

test('editing a path preserves existing section ids', { skip: !hasDb }, async () => {
  const admin = await registerUser('catalog-admin-4@example.com', { admin: true, verified: true })
  const created = await createCatalog(admin, { subject: 'Stable Ids' })
  const firstId = (created.sections as Array<{ id: string }>)[0].id

  // Send the id back with changed content: the id must survive.
  const edited = await request(app)
    .patch(`/api/v1/admin/catalog-paths/${created.id}`)
    .set('Cookie', admin.cookie)
    .send({ sections: [{ ...sectionInput('Foundations v2'), id: firstId }] })
  assert.equal(edited.status, 200, JSON.stringify(edited.body))
  const keptId = (edited.body.data.sections as Array<{ id: string }>)[0].id
  assert.equal(keptId, firstId)

  // Replacing without sending ids keeps ids by position.
  const repositioned = await request(app)
    .patch(`/api/v1/admin/catalog-paths/${created.id}`)
    .set('Cookie', admin.cookie)
    .send({ sections: [sectionInput('Foundations v3')] })
  assert.equal(repositioned.status, 200)
  assert.equal(
    (repositioned.body.data.sections as Array<{ id: string }>)[0].id,
    firstId,
  )
})

/* ------------------------------ enroll ---------------------------- */

test('a verified learner enrolls and gets a personal copy', { skip: !hasDb }, async () => {
  const admin = await registerUser('catalog-admin-5@example.com', { admin: true, verified: true })
  const created = await createCatalog(admin, { subject: 'Enrollable Path' })
  const learner = await registerUser('catalog-learner@example.com', { verified: true })

  const enrolled = await request(app)
    .post(`/api/v1/catalog/${created.slug}/enroll`)
    .set('Cookie', learner.cookie)
  assert.equal(enrolled.status, 201, JSON.stringify(enrolled.body))
  const path = enrolled.body.data as Record<string, unknown>
  assert.equal(path.catalogPathId, created.id)
  assert.equal(path.subject, 'Enrollable Path')
  const sections = path.sections as Array<{ status: string }>
  assert.equal(sections[0].status, 'current')

  // Session content was cached so the learner can open it immediately.
  const cached = await SessionContentModel.countDocuments({ pathId: path.id })
  assert.equal(cached, 1)

  // Enrollment counter incremented.
  assert.equal((await CatalogPath.findById(created.id))!.enrollments, 1)

  // Re-enrolling is idempotent: same path, counter unchanged.
  const again = await request(app)
    .post(`/api/v1/catalog/${created.slug}/enroll`)
    .set('Cookie', learner.cookie)
  assert.equal(again.status, 201)
  assert.equal(again.body.data.id, path.id)
  assert.equal((await CatalogPath.findById(created.id))!.enrollments, 1)

  // Deleting the personal copy decrements the counter again.
  const del = await request(app)
    .delete(`/api/v1/learning-paths/${path.id}`)
    .set('Cookie', learner.cookie)
  assert.equal(del.status, 204)
  assert.equal((await CatalogPath.findById(created.id))!.enrollments, 0)
})

test('unverified learners cannot enroll', { skip: !hasDb }, async () => {
  const admin = await registerUser('catalog-admin-6@example.com', { admin: true, verified: true })
  const created = await createCatalog(admin, { subject: 'Verify Gate' })
  const fresh = await registerUser('catalog-unverified@example.com')

  const res = await request(app)
    .post(`/api/v1/catalog/${created.slug}/enroll`)
    .set('Cookie', fresh.cookie)
  assert.equal(res.status, 403)
  assert.equal(res.body.error.code, 'email_unverified')

  const anon = await request(app).post(`/api/v1/catalog/${created.slug}/enroll`)
  assert.equal(anon.status, 401)
})

/* ------------------------------ reviews --------------------------- */

test('learners review a published path and aggregates update', { skip: !hasDb }, async () => {
  const admin = await registerUser('catalog-admin-7@example.com', { admin: true, verified: true })
  const created = await createCatalog(admin, { subject: 'Reviewable Path' })
  const learner = await registerUser('catalog-reviewer@example.com', { verified: true })

  const posted = await request(app)
    .post(`/api/v1/catalog/${created.slug}/reviews`)
    .set('Cookie', learner.cookie)
    .send({ rating: 5, text: 'Excellent start.' })
  assert.equal(posted.status, 201, JSON.stringify(posted.body))
  assert.equal(posted.body.data.rating, 5)
  assert.equal(posted.body.data.author, 'Cat')

  const publicReviews = await request(app).get(`/api/v1/catalog/${created.slug}/reviews`)
  assert.equal(publicReviews.status, 200)
  assert.equal(publicReviews.body.meta.total, 1)

  let catalog = await CatalogPath.findById(created.id)
  assert.equal(catalog!.reviewsCount, 1)
  assert.equal(catalog!.reviewsAvg, 5)

  // The same learner editing their review replaces it, not duplicates.
  const edited = await request(app)
    .post(`/api/v1/catalog/${created.slug}/reviews`)
    .set('Cookie', learner.cookie)
    .send({ rating: 3, text: 'Still good.' })
  assert.equal(edited.status, 201)

  catalog = await CatalogPath.findById(created.id)
  assert.equal(catalog!.reviewsCount, 1)
  assert.equal(catalog!.reviewsAvg, 3)
})

/* ------------------- server-rendered public pages ----------------- */

test('the public explore pages are server-rendered and crawlable', { skip: !hasDb }, async () => {
  const admin = await registerUser('catalog-admin-8@example.com', { admin: true, verified: true })
  const created = await createCatalog(admin, { subject: 'Crawlable Sourdough Path' })
  const slug = created.slug as string

  // List page.
  const list = await request(app).get('/explore')
  assert.equal(list.status, 200)
  assert.match(list.headers['content-type'] ?? '', /text\/html/)
  assert.match(list.text, /Explore learning paths/)
  assert.match(list.text, /Crawlable Sourdough Path/)

  // Detail page carries meta + JSON-LD Course.
  const detail = await request(app).get(`/explore/${slug}`)
  assert.equal(detail.status, 200)
  assert.match(detail.text, /<link rel="canonical"/)
  assert.match(detail.text, /application\/ld\+json/)
  assert.match(detail.text, /"@type":"Course"/)
  assert.match(detail.text, /Crawlable Sourdough Path/)

  // Unknown slug renders an HTML 404, not the JSON envelope.
  const missing = await request(app).get('/explore/does-not-exist')
  assert.equal(missing.status, 404)
  assert.match(missing.text, /Path not found/)

  // Sitemap + robots.
  const sitemap = await request(app).get('/sitemap.xml')
  assert.equal(sitemap.status, 200)
  assert.match(sitemap.text, /<urlset/)
  assert.match(sitemap.text, new RegExp(`/explore/${slug}`))

  const robots = await request(app).get('/robots.txt')
  assert.equal(robots.status, 200)
  assert.match(robots.text, /Sitemap:/)
  assert.match(robots.text, /Disallow: \/app\//)
})

