import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { env } from '../src/config/env.js'
import { generateSessionContent } from '../src/services/ai/index.js'
import {
  contentMessages,
  formatSessionContext,
  type SessionGenContext,
} from '../src/services/ai/prompts.js'
import { sessionResponseSchema } from '../src/services/ai/schemas.js'

/**
 * Session content generation contracts: path-aware context (anti-repeat),
 * multi-resource payloads, and stable id mapping. No database needed.
 */

const originalFetch = globalThis.fetch
const originalApiKey = env.DEEPSEEK_API_KEY

afterEach(() => {
  globalThis.fetch = originalFetch
  env.DEEPSEEK_API_KEY = originalApiKey
})

const context: SessionGenContext = {
  position: 2,
  total: 3,
  outline: [
    { order: 1, title: 'Ownership and Memory', description: 'Borrow checker basics.' },
    { order: 2, title: 'Data Types and Traits', description: 'Enums and structs.' },
    { order: 3, title: 'Error Handling', description: 'Result and Option.' },
  ],
  priorResources: [
    {
      sectionTitle: 'Ownership and Memory',
      title: 'Ownership Explained Visually',
      kind: 'video',
      url: 'https://www.youtube.com/watch?v=abc123',
    },
  ],
}

const section = { title: 'Data Types and Traits', description: 'Enums and structs.' }

test('formatSessionContext marks position and lists used resources', () => {
  const text = formatSessionContext(section, context)
  assert.match(text, /section 2 of 3/)
  assert.match(text, /"Ownership and Memory"[^[]*\[already covered\]/)
  assert.match(text, /"Data Types and Traits"[^[]*\[THIS SECTION\]/)
  assert.match(text, /"Error Handling"[^[]*\[upcoming — do not cover yet\]/)
  assert.match(text, /Ownership Explained Visually/)
  assert.match(text, /used in "Ownership and Memory"/)
})

test('formatSessionContext handles a first section with no prior resources', () => {
  const text = formatSessionContext(
    { title: 'Ownership and Memory', description: 'Borrow checker basics.' },
    { ...context, position: 1, priorResources: [] },
  )
  assert.match(text, /section 1 of 3/)
  assert.match(text, /none yet/)
})

test('contentMessages embeds the context block when provided', () => {
  const withContext = contentMessages({ subject: 'Rust', experience: null, reason: null, outcome: '', weeklyHours: '5', formats: [], intensity: 'balanced', targetDate: null }, section, context)
  assert.equal(withContext.length, 2)
  assert.match(withContext[1].content, /Path outline/)
  assert.match(withContext[1].content, /NEVER repeat/)

  const without = contentMessages({ subject: 'Rust', experience: null, reason: null, outcome: '', weeklyHours: '5', formats: [], intensity: 'balanced', targetDate: null }, section)
  assert.doesNotMatch(without[1].content, /Path outline/)
})

function validSessionPayload() {
  return {
    lesson: {
      title: 'Enums hit different',
      minutes: 15,
      intro: 'Enums model exclusive states.',
      blocks: [
        { type: 'p', text: 'An enum is a type with fixed variants.' },
        { type: 'p', text: 'Match exhaustiveness keeps refactors safe.' },
        { type: 'list', items: ['Option', 'Result'] },
        { type: 'note', title: 'Distinction', text: 'Enums vs structs.' },
      ],
    },
    resources: [
      {
        title: 'Enums in Practice',
        kind: 'video',
        source: 'SomeChannel',
        minutes: 12,
        summary: 'Walks through enum modeling.',
        body: ['Model states as variants.'],
        url: 'https://www.youtube.com/watch?v=def456',
      },
      {
        title: 'The Rust Book: Enums',
        kind: 'article',
        source: 'doc.rust-lang.org',
        minutes: 10,
        summary: 'Official docs on defining enums.',
        body: ['Read the defining enums chapter.'],
        url: 'https://doc.rust-lang.org/book/ch06-01-defining-an-enum.html',
      },
    ],
    practice: {
      title: 'Model a ticket',
      minutes: 10,
      brief: 'Model a support ticket with enums.',
      kind: 'written',
      prompt: 'Design the enum.',
      modelAnswer: 'Use variants Open, Assigned, Resolved.',
    },
    assessment: {
      title: 'Enums check',
      intro: 'Three questions.',
      minutes: 5,
      topic: 'enums',
      questions: [
        { prompt: 'What is an enum?', choices: ['a', 'b', 'c', 'd'], correctIndex: 0, explanation: 'Fixed variants.' },
        { prompt: 'What is Option?', choices: ['a', 'b', 'c', 'd'], correctIndex: 1, explanation: 'Some or None.' },
        { prompt: 'What is match?', choices: ['a', 'b', 'c', 'd'], correctIndex: 2, explanation: 'Exhaustive check.' },
      ],
    },
  }
}

test('sessionResponseSchema accepts 1-3 resources', () => {
  const one = { ...validSessionPayload(), resources: [validSessionPayload().resources[0]] }
  assert.equal(sessionResponseSchema.safeParse(one).success, true)

  const three = {
    ...validSessionPayload(),
    resources: [validSessionPayload().resources[0], validSessionPayload().resources[1], { ...validSessionPayload().resources[1], title: 'Third piece', url: 'https://example.com/third' }],
  }
  assert.equal(sessionResponseSchema.safeParse(three).success, true)

  assert.equal(sessionResponseSchema.safeParse({ ...validSessionPayload(), resources: [] }).success, false)

  const four = { ...validSessionPayload(), resources: [...three.resources, three.resources[0]] }
  assert.equal(sessionResponseSchema.safeParse(four).success, false)
})

test('generateSessionContent sends path context and maps resource ids', async () => {
  env.DEEPSEEK_API_KEY = 'test-key'
  let capturedBody = ''
  globalThis.fetch = (async (_url: unknown, init?: { body?: unknown }) => {
    capturedBody = String(init?.body ?? '')
    return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(validSessionPayload()) } }] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }) as unknown as typeof fetch

  const learner = { subject: 'Rust', experience: null, reason: null, outcome: '', weeklyHours: '5' as const, formats: [], intensity: 'balanced' as const, targetDate: null }
  const content = await generateSessionContent(learner, section, 'rust-s2', context)

  // The model saw the outline position and the already-used video.
  assert.match(capturedBody, /section 2 of 3/)
  assert.match(capturedBody, /Ownership Explained Visually/)
  assert.match(capturedBody, /youtube\.com\/watch\?v=abc123/)

  // Resources come back as an array with stable per-section ids.
  assert.equal(content.resources.length, 2)
  assert.equal(content.resources[0].id, 'rust-s2-res1')
  assert.equal(content.resources[1].id, 'rust-s2-res2')
  assert.equal(content.resources[0].kind, 'video')
  assert.equal(content.resources[1].kind, 'article')
  assert.equal(content.lesson.id, 'rust-s2-lsn')
})
