import { z } from 'zod'

/* ------------------------------------------------------------------ */
/*  Environment: validated once at boot. Unknown OS variables are      */
/*  ignored; missing/malformed known config fails fast.                 */
/* ------------------------------------------------------------------ */

const DEV_JWT_SECRET = 'dev-only-insecure-secret-change-me'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  FRONTEND_URL: z.url().default('http://localhost:5173'),
  OAUTH_REDIRECT_BASE: z.url().default('http://localhost:4000'),

  MONGODB_URI: z.string().min(1).default('mongodb://127.0.0.1:27017/sawari'),
  TEST_MONGODB_URI: z.string().optional(),

  JWT_SECRET: z.string().min(16).default(DEV_JWT_SECRET),
  JWT_EXPIRES_IN: z.string().default('7d'),

  COOKIE_DOMAIN: z.string().optional(),

  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  /* --- outbound email (Resend) ---
     Without RESEND_API_KEY mail is logged instead of sent, so dev and tests
     never hit the network. MAIL_FROM defaults to the Resend test sender. */
  RESEND_API_KEY: z.string().optional(),
  MAIL_FROM: z.string().min(3).default('Sawari <onboarding@resend.dev>'),
  MAIL_ENABLED: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value !== 'false'),

  /* --- AI generation (DeepSeek, OpenAI-compatible) --- */
  DEEPSEEK_API_KEY: z.string().optional(),
  DEEPSEEK_BASE_URL: z.url().default('https://api.deepseek.com'),
  DEEPSEEK_MODEL: z.string().default('deepseek-chat'),

  /* --- user-supplied DeepSeek keys (AES-256-GCM, hex, 32 bytes) --- */
  AI_KEY_SECRET: z.string().optional(),

  /* --- PayPal one-time billing (sandbox by default) --- */
  PAYPAL_CLIENT_ID: z.string().optional(),
  PAYPAL_CLIENT_SECRET: z.string().optional(),
  PAYPAL_MODE: z.enum(['sandbox', 'live']).default('sandbox'),
  PRO_PRICE_USD: z.string().default('6.00'),
  FREE_PATH_LIMIT: z.coerce.number().int().positive().default(1),
  PRO_PATH_LIMIT: z.coerce.number().int().positive().default(5),

  /* --- background jobs (Mongo-backed queue) --- */
  QUEUE_POLL_MS: z.coerce.number().int().positive().default(2000),
  QUEUE_MAX_ATTEMPTS: z.coerce.number().int().positive().default(3),
  /** Jobs run in parallel up to this many; a slow build can't block mail. */
  QUEUE_CONCURRENCY: z.coerce.number().int().min(1).max(32).default(4),

  /* --- reminder scheduler (session reminders + weekly summary) --- */
  SCHEDULER_ENABLED: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value !== 'false'),
  SCHEDULER_POLL_MS: z.coerce.number().int().positive().default(60_000),
})

export type Env = z.infer<typeof envSchema>

/**
 * Production must never boot degraded-but-listening. Development and tests
 * keep the forgiving defaults so `npm run dev` / `npm test` need no secrets;
 * production refuses to start when a required value is missing or still
 * pointing at localhost, and reports every gap at once.
 */
function assertProductionConfig(env: Env): void {
  if (env.NODE_ENV !== 'production') return

  const missing: string[] = []
  const isDefault = (value: string, fallback: string) => value === fallback

  if (isDefault(env.MONGODB_URI, 'mongodb://127.0.0.1:27017/sawari')) {
    missing.push('MONGODB_URI')
  }
  if (isDefault(env.FRONTEND_URL, 'http://localhost:5173')) missing.push('FRONTEND_URL')
  if (env.JWT_SECRET === DEV_JWT_SECRET) missing.push('JWT_SECRET')
  // Mail carries verification + password reset: silent unless explicitly off.
  if (env.MAIL_ENABLED && !env.RESEND_API_KEY) missing.push('RESEND_API_KEY')
  // Path building is the product; an own-key fallback still needs this base key.
  if (!env.DEEPSEEK_API_KEY) missing.push('DEEPSEEK_API_KEY')
  // Sealing user-supplied keys throws without it (see lib/secrets.ts).
  if (!env.AI_KEY_SECRET) missing.push('AI_KEY_SECRET')

  if (missing.length > 0) {
    throw new Error(
      `Refusing to boot production with missing/placeholder configuration:\n` +
        missing.map((name) => `  - ${name}`).join('\n') +
        '\nSet them in .env (copy .env.example).',
    )
  }
}

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    const lines = result.error.issues.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    throw new Error(`Invalid environment configuration:\n${lines.join('\n')}`)
  }
  assertProductionConfig(result.data)
  return result.data
}

export const env = loadEnv()

export const isOAuthConfigured = {
  github: Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET),
  google: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
} as const

/** Mail is only sent when a key is present and sending is not switched off. */
export const isMailConfigured = Boolean(env.RESEND_API_KEY) && env.MAIL_ENABLED

/** PayPal checkout is only offered when client + secret are both present. */
export const isPaypalConfigured = Boolean(env.PAYPAL_CLIENT_ID) && Boolean(env.PAYPAL_CLIENT_SECRET)

/** AI generation is only attempted when a DeepSeek key is present. */
export const isAiConfigured = Boolean(env.DEEPSEEK_API_KEY)