import { env } from '../config/env.js'
import { User } from '../models/User.js'
import { openSecret } from '../lib/secrets.js'

/* ------------------------------------------------------------------ */
/*  User-supplied DeepSeek keys: live validation + sealed resolution.  */
/* ------------------------------------------------------------------ */

export class UserKeyError extends Error {
  readonly status: number
  constructor(message: string, status = 400) {
    super(message)
    this.name = 'UserKeyError'
    this.status = status
  }
}

/** Live-checks a raw DeepSeek key with a cheap /models probe. Throws otherwise. */
export async function verifyDeepSeekKey(rawKey: string): Promise<void> {
  const key = rawKey.trim()
  if (key.length < 10 || key.length > 200) {
    throw new UserKeyError('That key does not look right. Copy the full key from DeepSeek.')
  }
  let response: Response
  try {
    response = await fetch(`${env.DEEPSEEK_BASE_URL}/models`, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(15_000),
    })
  } catch {
    throw new UserKeyError('Could not reach DeepSeek to check the key. Try again.', 502)
  }
  if (response.status === 401 || response.status === 403) {
    throw new UserKeyError('DeepSeek rejected that key. Check it and try again.')
  }
  if (!response.ok) {
    throw new UserKeyError(`DeepSeek check failed (${response.status}). Try again.`, 502)
  }
}

/**
 * Returns the user's decrypted DeepSeek key, or undefined when they have none
 * (or it no longer opens — treated as absent, never fatal to the request).
 */
export async function resolveUserKey(userId: string): Promise<string | undefined> {
  const user = await User.findById(userId).select('+aiKeySealed')
  const sealed = user?.aiKeySealed
  if (!sealed) return undefined
  try {
    return openSecret(sealed)
  } catch {
    console.warn('[billing] stored AI key would not open; treating as absent')
    return undefined
  }
}
