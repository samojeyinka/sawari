# Backend Plan — Sawari API (Node + Express + TS + MongoDB)

**Approach:** A new `server/` workspace in this repo (own `package.json`/`tsconfig`, keeps the UI untouched). Express + Mongoose + JWT auth + zod validation. The API serves the same domain shape the UI already uses; the existing `src/data` mocks get ported to a one-time seed so the flow works against Mongo on first boot.

## Scope

- **In:** Auth (register/login/me), learning paths + setup, session content, activity completion → progress, assessment results, projects (submit/review), settings, profile, notifications. `/api/health` + graceful Mongo connect. Vite proxy + a thin `api` client on the frontend.
- **Out:** AI/path generation, refresh tokens/social login, payments, websockets, deployment.

## Action Items

- [ ] Scaffold `server/`: `npm init`, TS config, `nodemon` + `tsx` runner, install `express`, `mongoose`, `dotenv`, `cors`, `zod`, `jsonwebtoken`, `bcryptjs` (+ types).
- [ ] Add `src/config/env.ts` (validated via zod) with `PORT`, `MONGODB_URI`, `JWT_SECRET`; write `.env.example`; add a `db/connect.ts` that connects and logs.
- [ ] Build app shell `src/index.ts`: json/cors, `GET /api/health`, JSON 404 + central error middleware.
- [ ] Add `User` model + `routes/auth.ts`: `register`, `login` (bcrypt + JWT), `me` (Bearer guard middleware).
- [ ] Port domain models from `src/types/index.ts`: `LearningPath` (incl. `targetDate`), `SessionContent` (lesson/resource/practice/assessment), `Project`, plus activity/section progress. Use subdocs/schemas that mirror the UI enums.
- [ ] Implement auth-guarded routes: path CRUD + preferences, session content lookup, complete-activity (progress tick), assessment results, project submit/review, settings, profile, notifications.
- [ ] Write `src/seed/seed.ts` porting `src/data/paths.ts|content-*|projects.ts` so a fresh DB boots with the demo paths (empty-DB-only).
- [ ] Wire the frontend: add Vite proxy `/api → localhost:4000` and a `src/lib/api.ts` client the store can call in place of mock state.
- [ ] Validate: zod request schemas on all POST/PATCH routes; `npm run build` (tsc) + lint green; add supertest tests for auth + path creation; smoke `/api/health`.

## Open Questions

- **Auth:** JWT bearer tokens (default) — ok, or do you want sessions?
- **Layout:** `server/` folder inside this monorepo (default)? Or a separate repo?
- **Reading content:** ship via seeded Mongo docs (default) so it's queryable, vs compute on the fly?