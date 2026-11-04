import { env } from '../../config/env.js'

export interface AiHealthResult {
  available: boolean
  model: string
  latencyMs: number
  error?: string
}

const HEALTH_TIMEOUT_MS = 10_000
const CACHE_TTL_MS = 15_000

let cachedHealth: { result: AiHealthResult; expiresAt: number } | null = null

/**
 * Verifies DeepSeek is reachable and responsive before the app relies on it.
 * Uses a minimal JSON-mode completion probe with a 10s timeout.
 */
export async function checkAiHealth(options: { fresh?: boolean } = {}): Promise<AiHealthResult> {
  const now = Date.now()
  if (!options.fresh && cachedHealth && cachedHealth.expiresAt > now) {
    return cachedHealth.result
  }

  const start = Date.now()

  if (!env.DEEPSEEK_API_KEY) {
    const result: AiHealthResult = {
      available: false,
      model: env.DEEPSEEK_MODEL,
      latencyMs: 0,
      error: 'AI generation is not configured.',
    }
    cachedHealth = { result, expiresAt: now + CACHE_TTL_MS }
    return result
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS)

  try {
    const response = await fetch(`${env.DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: env.DEEPSEEK_MODEL,
        messages: [
          { role: 'system', content: 'You are an API health probe. Reply ONLY with valid JSON: {"ok":true}' },
          { role: 'user', content: 'Ping' },
        ],
        max_tokens: 128,
        temperature: 0,
        response_format: { type: 'json_object' },
        thinking: { type: 'disabled' },
      }),
      signal: controller.signal,
    })

    const latencyMs = Date.now() - start

    if (!response.ok) {
      // Provider response bodies can contain billing or request details. Keep
      // those out of the API response and learner-facing interface.
      console.warn(`[ai] Health probe returned status ${response.status}.`)
      const result: AiHealthResult = {
        available: false,
        model: env.DEEPSEEK_MODEL,
        latencyMs,
        error: 'The AI service is temporarily unavailable.',
      }
      cachedHealth = { result, expiresAt: Date.now() + CACHE_TTL_MS }
      return result
    }

    const json = (await response.json()) as { choices?: { message?: { content?: string } }[] }
    const content = json.choices?.[0]?.message?.content
    if (!content) {
      const result: AiHealthResult = {
        available: false,
        model: env.DEEPSEEK_MODEL,
        latencyMs,
      error: 'The AI service returned an empty response.',
      }
      cachedHealth = { result, expiresAt: Date.now() + CACHE_TTL_MS }
      return result
    }

    try {
      JSON.parse(content)
    } catch {
      const result: AiHealthResult = {
        available: false,
        model: env.DEEPSEEK_MODEL,
        latencyMs,
      error: 'The AI service returned an invalid response.',
      }
      cachedHealth = { result, expiresAt: Date.now() + CACHE_TTL_MS }
      return result
    }

    const result: AiHealthResult = {
      available: true,
      model: env.DEEPSEEK_MODEL,
      latencyMs,
    }
    cachedHealth = { result, expiresAt: Date.now() + CACHE_TTL_MS }
    return result
  } catch (err) {
    const latencyMs = Date.now() - start
    const timedOut = err instanceof DOMException && err.name === 'AbortError'
    console.warn(`[ai] Health probe ${timedOut ? 'timed out' : 'failed'}.`)

    const result: AiHealthResult = {
      available: false,
      model: env.DEEPSEEK_MODEL,
      latencyMs,
      error: timedOut
        ? 'The AI service is taking too long to respond.'
        : 'The AI service is temporarily unavailable.',
    }
    cachedHealth = { result, expiresAt: Date.now() + CACHE_TTL_MS }
    return result
  } finally {
    clearTimeout(timer)
  }
}

/** Testing helper to reset cached probe state. */
export function resetAiHealthCache(): void {
  cachedHealth = null
}
