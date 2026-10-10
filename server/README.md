# Sawari API

Backend for the Sawari learning platform.

## Stack
- Node 20+, Express 5, TypeScript (ESM), Mongoose 9, Zod 4, Passport (GitHub/Google OAuth), express-rate-limit.

## Getting started
```bash
cp .env.example .env   # then fill in values, e.g. TEST_MONGODB_URI for tests
npm install
npm run dev            # nodemon + tsx
```

## Scripts
| Script | Purpose |
| --- | --- |
| `npm run dev` | watch mode |
| `npm run build` | compile to `dist/` |
| `npm run start` | run compiled build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | oxlint |
| `npm test` | `tsx --test` — smoke tests always run; DB integration tests run when `TEST_MONGODB_URI` is set |

## Architecture
- `src/config/env.ts` — strictly validated environment (fails fast).
- `src/config/db.ts` — mongoose connection lifecycle.
- `src/config/auth.ts` — password policy, JWT signing, httpOnly cookie options.
- `src/domain/` — shared enums the schemas and validators are built from.
- `src/models/` — Mongoose models (User, LearningPath, Project).
- `src/validators/` — Zod FormRequest-style schemas (strict → "fillable" only).
- `src/passport/` — sessionless GitHub/Google strategies.
- `src/middleware/` — response macros, error handler, authenticate, validate, rate limiters.
- `src/controllers/` — route handlers only, no logic leak.
- `src/routes/v1/` — versioned routes (`/api/v1`).

## API conventions
- Every response uses one envelope: `{ success, data, meta }` or `{ success: false, error: { code, message, details } }`.
- Helpers on `res`: `res.ok(data, meta?)`, `res.created(data)`, `res.noContent()`.
- Auth is a JWT in an **httpOnly** cookie (`sawari_token`) — never readable by the frontend.
- Validation is strict; unknown request fields are rejected (prevents mass assignment).
- Query filters (`src/lib/queryFilters.ts`) whitelist `select`/`sort`/`limit`/`offset`
  per route: a client can never sort/select arbitrary fields or over-fetch documents.
- All domain endpoints are user-scoped: every query is filtered by `userId`, so one
  account can never read or mutate another's data.
- Paginated list responses return `meta: { page, limit, total, pages }`.

## Endpoints
```
GET    /api/v1/health

POST   /api/v1/auth/register   { firstName, lastName?, email, password }
POST   /api/v1/auth/login      { email, password }
POST   /api/v1/auth/logout
GET    /api/v1/auth/github     → redirect to GitHub → callback → frontend
GET    /api/v1/auth/google     → redirect to Google → callback → frontend

GET    /api/v1/me              (cookie)
PATCH  /api/v1/me              { firstName?, lastName? }

GET    /api/v1/learning-paths           ?page&limit&sort&select&subject
POST   /api/v1/learning-paths           { subject, goal?, experience?, reason?, weeklyHours, intensity, formats?, targetDate? }
GET    /api/v1/learning-paths/:id
PATCH  /api/v1/learning-paths/:id       (plan tuning + progress fields)
DELETE /api/v1/learning-paths/:id       (detaches linked projects)

GET    /api/v1/projects                 ?page&limit&sort&select&status&pathId
POST   /api/v1/projects                 { title, description?, pathId?, level?, estHours?, objectives?, tasks?, deliverables?, related? }
GET    /api/v1/projects/:id
PATCH  /api/v1/projects/:id             (status, completedTaskIds, submitted, feedback…)
DELETE /api/v1/projects/:id
```

## Environment (see `.env.example`)
- `FRONTEND_URL` — allowed CORS origin and post-OAuth redirect target.
- `OAUTH_REDIRECT_BASE` — base URL used to build provider callback URLs.
- `MONGODB_URI` / `TEST_MONGODB_URI` — app DB and integration-test DB (must differ in CI).
- `JWT_SECRET` — production refuses to boot with the dev default.
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` / `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — OAuth; endpoints 501 when absent.