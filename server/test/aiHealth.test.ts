import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { env } from '../src/config/env.js'
import { checkAiHealth, resetAiHealthCache } from '../src/services/ai/health.js'

const originalFetch = globalThis.fetch
const originalApiKey = env.DEEPSEEK_API_KEY

beforeEach(() => {
  resetAiHealthCache()
})

afterEach(() => {
  globalThis.fetch = originalFetch
  env.DEEPSEEK_API_KEY = originalApiKey
  resetAiHealthCache()
})

test('checkAiHealth reports unavailable when no API key is configured', async () => {
  env.DEEPSEEK_API_KEY = undefined
  const res = await checkAiHealth({ fresh: true })
  assert.equal(res.available, false)
  assert.equal(res.error, 'AI generation is not configured.')
  assert.equal(res.latencyMs, 0)
})

test('checkAiHealth returns available: true on valid DeepSeek JSON response', async () => {
  env.DEEPSEEK_API_KEY = 'test-key'
  globalThis.fetch = (async () => {
    return new Response(JSON.stringify({
      choices: [{ message: { content: '{"ok":true}' } }],
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }) as unknown as typeof fetch

  const res = await checkAiHealth({ fresh: true })
  assert.equal(res.available, true)
  assert.equal(res.model, env.DEEPSEEK_MODEL)
  assert.ok(typeof res.latencyMs === 'number')
  assert.equal(res.error, undefined)
})

test('checkAiHealth handles non-2xx failure status from DeepSeek', async () => {
  env.DEEPSEEK_API_KEY = 'test-key'
  globalThis.fetch = (async () => {
    return new Response('Rate limit exceeded', { status: 429 })
  }) as unknown as typeof fetch

  const res = await checkAiHealth({ fresh: true })
  assert.equal(res.available, false)
  // Learners get a plain availability message, never the provider's status or body.
  assert.equal(res.error, 'The AI service is temporarily unavailable.')
  assert.ok(!res.error?.includes('429'))
  assert.ok(!res.error?.includes('Rate limit'))
})

test('checkAiHealth handles request timeout (AbortError)', async () => {
  env.DEEPSEEK_API_KEY = 'test-key'
  globalThis.fetch = (async () => {
    throw new DOMException('The operation was aborted', 'AbortError')
  }) as unknown as typeof fetch

  const res = await checkAiHealth({ fresh: true })
  assert.equal(res.available, false)
  assert.equal(res.error, 'The AI service is taking too long to respond.')
  assert.ok(!res.error?.includes('DeepSeek'))
})

test('checkAiHealth handles malformed JSON response', async () => {
  env.DEEPSEEK_API_KEY = 'test-key'
  globalThis.fetch = (async () => {
    return new Response(JSON.stringify({
      choices: [{ message: { content: 'not valid json' } }],
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }) as unknown as typeof fetch

  const res = await checkAiHealth({ fresh: true })
  assert.equal(res.available, false)
  assert.equal(res.error, 'The AI service returned an invalid response.')
  assert.ok(!res.error?.includes('not valid json'))
})
