import crypto from 'node:crypto'
import { env } from '../config/env.js'

/* ------------------------------------------------------------------ */
/*  Secret box: AES-256-GCM encryption for user-supplied API keys.     */
/*  Keys are never stored or logged in the clear — only the sealed     */
/*  `iv.ciphertext.tag` bundle (base64) touches the database.          */
/* ------------------------------------------------------------------ */

const DEV_SECRET = 'dev-only-insecure-secret-change-me-32b!!'

let cachedKey: Buffer | null = null

function keyBytes(): Buffer {
  if (cachedKey) return cachedKey
  let derived: Buffer
  if (env.AI_KEY_SECRET) {
    const raw = env.AI_KEY_SECRET.trim()
    derived = /^[0-9a-fA-F]{64}$/.test(raw)
      ? Buffer.from(raw, 'hex')
      : crypto.scryptSync(raw, 'sawari-ai-key-v1', 32)
  } else {
    if (env.NODE_ENV === 'production') {
      throw new Error('Refusing to seal secrets without AI_KEY_SECRET. Set AI_KEY_SECRET in .env.')
    }
    derived = crypto.scryptSync(DEV_SECRET, 'sawari-ai-key-v1', 32)
  }
  cachedKey = derived
  return derived
}

/** Seals plaintext into a portable `iv.ciphertext.tag` string (base64 parts). */
export function sealSecret(plain: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBytes(), iv)
  const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [iv, ciphertext, tag].map((part) => part.toString('base64')).join('.')
}

/** Opens a sealed bundle. Throws on tampering or wrong key. */
export function openSecret(sealed: string): string {
  const [ivB64, ctB64, tagB64] = sealed.split('.')
  if (!ivB64 || !ctB64 || !tagB64) throw new Error('Malformed sealed secret.')
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    keyBytes(),
    Buffer.from(ivB64, 'base64'),
  )
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
  return Buffer.concat([
    decipher.update(Buffer.from(ctB64, 'base64')),
    decipher.final(),
  ]).toString('utf8')
}

/** Last-4 fingerprint shown in UI ("…wxyz") — never the key itself. */
export function fingerprintSecret(plain: string): string {
  const clean = plain.trim()
  return clean.length <= 8 ? '••••' : `…${clean.slice(-4)}`
}

/** SHA-256 hex digest for short-lived codes/tokens (verification, email change). */
export function hashSecret(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex')
}

/** Constant-time comparison for hex digests (false on any shape mismatch). */
export function safeEqualHex(a: unknown, b: unknown): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  const aBuf = Buffer.from(a, 'hex')
  const bBuf = Buffer.from(b, 'hex')
  if (aBuf.length === 0 || aBuf.length !== bBuf.length) return false
  return crypto.timingSafeEqual(aBuf, bBuf)
}
