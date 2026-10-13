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

  /* --- background jobs (Mongo-backed queue) --- */
  QUEUE_POLL_MS: z.coerce.number().int().positive().default(2000),
  QUEUE_MAX_ATTEMPTS: z.coerce.number().int().positive().default(3),

  /* --- reminder scheduler (session reminders + weekly summary) --- */
  SCHEDULER_ENABLED: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value !== 'false'),
  SCHEDULER_POLL_MS: z.coerce.number().int().positive().default(60_000),
})

export type Env = z.infer<typeof envSchema>

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    const lines = result.error.issues.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    throw new Error(`Invalid environment configuration:\n${lines.join('\n')}`)
  }
  return result.data
}

export const env = loadEnv()

if (env.NODE_ENV === 'production' && env.JWT_SECRET === DEV_JWT_SECRET) {
  throw new Error('Refusing to boot production with the default JWT_SECRET. Set JWT_SECRET in .env.')
}

export const isOAuthConfigured = {
  github: Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET),
  google: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
} as const

/** Mail is only sent when a key is present and sending is not switched off. */
export const isMailConfigured = Boolean(env.RESEND_API_KEY) && env.MAIL_ENABLED

/** AI generation is only attempted when a DeepSeek key is present. */
export const isAiConfigured = Boolean(env.DEEPSEEK_API_KEY)