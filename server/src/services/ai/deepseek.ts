import { env } from '../../config/env.js'

/* ------------------------------------------------------------------ */
/*  DeepSeek client (OpenAI-compatible chat completions).              */
/*  One helper: ask for JSON, get parsed JSON back. Never returns      */
/*  a raw model string to callers — everything below is validated.     */
/* ------------------------------------------------------------------ */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/** Thrown when no API key is configured — the app can fall back on this. */
export class AiUnavailableError extends Error {
  constructor(message = 'AI generation is not configured.') {
    super(message)
    this.name = 'AiUnavailableError'
  }
}

/** Thrown when DeepSeek is reachable but the request failed. */
export class AiRequestError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AiRequestError'
  }
}

const TIMEOUT_MS = 120_000

interface CompletionResponse {
  choices?: { message?: { content?: string } }[]
}

/**
 * Sends a chat request in JSON mode and returns the raw assistant content string.
 */
export async function chatCompletion(
  messages: ChatMessage[],
  options: { maxTokens?: number; temperature?: number; thinking?: boolean; apiKey?: string } = {},
): Promise<string> {
  const apiKey = options.apiKey ?? env.DEEPSEEK_API_KEY
  if (!apiKey) throw new AiUnavailableError()

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const payload: Record<string, unknown> = {
      model: env.DEEPSEEK_MODEL,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
      response_format: { type: 'json_object' },
    }
    if (options.thinking === false) {
      payload.thinking = { type: 'disabled' }
    }

    const response = await fetch(`${env.DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      throw new AiRequestError(
        `DeepSeek request failed (${response.status}). ${detail.slice(0, 200)}`.trim(),
      )
    }

    const json = (await response.json()) as CompletionResponse
    const content = json.choices?.[0]?.message?.content
    if (!content) throw new AiRequestError('DeepSeek returned an empty response.')

    return content
  } catch (error) {
    if (error instanceof AiUnavailableError || error instanceof AiRequestError) throw error
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new AiRequestError('DeepSeek request timed out.')
    }
    throw new AiRequestError(
      error instanceof Error ? `DeepSeek request failed: ${error.message}` : 'DeepSeek request failed.',
    )
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Sends a chat request in JSON mode and returns the parsed object.
 * Throws `AiUnavailableError` when unconfigured and `AiRequestError` on
 * a non-2xx response or unparseable body.
 */
export async function chatJson(
  messages: ChatMessage[],
  options: { maxTokens?: number; temperature?: number } = {},
): Promise<unknown> {
  const content = await chatCompletion(messages, options)
  try {
    return JSON.parse(content)
  } catch {
    throw new AiRequestError('DeepSeek returned invalid JSON.')
  }
}