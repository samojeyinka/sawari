import type { Request } from 'express'

/* ------------------------------------------------------------------ */
/*  Query filters: turn untrusted query strings into safe mongoose      */
/*  options. Field names are always checked against a per-route         */
/*  allow-list, so a client can never sort/select/project arbitrary     */
/*  fields (query-injection) or drag the whole document.                */
/* ------------------------------------------------------------------ */

export interface Pagination {
  page: number
  limit: number
  skip: number
}

export interface PageMeta {
  page: number
  limit: number
  total: number
  pages: number
}

const MAX_LIMIT = 100
const DEFAULT_LIMIT = 20
const MAX_PAGE = 100_000

function toInt(value: unknown, fallback: number): number {
  const n = Number.parseInt(String(value ?? ''), 10)
  return Number.isFinite(n) ? n : fallback
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function parsePagination(
  req: Request,
  options: { defaultLimit?: number; maxLimit?: number } = {},
): Pagination {
  const maxLimit = options.maxLimit ?? MAX_LIMIT
  const page = clamp(toInt(req.query.page, 1), 1, MAX_PAGE)
  const limit = clamp(toInt(req.query.limit, options.defaultLimit ?? DEFAULT_LIMIT), 1, maxLimit)
  return { page, limit, skip: (page - 1) * limit }
}

/**
 * `?sort=-createdAt,title` → `{ createdAt: -1, title: 1 }`.
 * Fields not in `allowed` are silently ignored.
 */
export function parseSort(
  req: Request,
  allowed: readonly string[],
  fallback = '-createdAt',
): Record<string, 1 | -1> {
  const raw = typeof req.query.sort === 'string' ? req.query.sort : fallback
  const sort: Record<string, 1 | -1> = {}
  for (const token of raw.split(',')) {
    const trimmed = token.trim()
    if (!trimmed) continue
    const descending = trimmed.startsWith('-')
    const field = descending ? trimmed.slice(1) : trimmed
    if (allowed.includes(field)) sort[field] = descending ? -1 : 1
  }
  return Object.keys(sort).length ? sort : { createdAt: -1 }
}

/**
 * `?select=subject,targetDate` → `{ subject: 1, targetDate: 1 }`.
 * Only allow-listed fields are projected; unknown fields are dropped.
 * Returns `undefined` when nothing valid was requested (full document).
 */
export function parseSelect(
  req: Request,
  allowed: readonly string[],
): Record<string, 1> | undefined {
  if (typeof req.query.select !== 'string' || req.query.select.length === 0) return undefined
  const projection: Record<string, 1> = {}
  for (const token of req.query.select.split(',')) {
    const field = token.trim()
    if (allowed.includes(field)) projection[field] = 1
  }
  return Object.keys(projection).length ? projection : undefined
}

export function pageMeta(page: number, limit: number, total: number): PageMeta {
  return { page, limit, total, pages: limit > 0 ? Math.ceil(total / limit) : 0 }
}

/** Escape user input before it goes into a `$regex` (prevents ReDoS/injection). */
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}