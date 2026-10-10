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