import type { RequestHandler } from 'express'
import { z } from 'zod'
import { httpError, type AppErrorDetails } from '../lib/AppError.js'

function toFieldErrors(error: z.ZodError): AppErrorDetails {
  const fields: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'request'
    ;(fields[key] ??= []).push(issue.message)
  }
  return { fields }
}

export type ValidationSource = 'body' | 'query' | 'params'

/**
 * FormRequest-style validation. Parses the given location through a zod
 * schema; on failure the handler is skipped and a structured 422 is sent.
 *
 * Schemas are expected to be STRICT (`z.strictObject`): unknown keys are
 * rejected so only "fillable" fields are ever accepted — this is where
 * mass-assignment becomes impossible.
 */
export function validate(schema: z.ZodType, source: ValidationSource = 'body'): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source])
    if (result.success) {
      // Express 5 exposes `req.query` as a getter-only accessor, so a plain
      // assignment throws; define it explicitly instead.
      if (source === 'query') {
        Object.defineProperty(req, 'query', {
          value: result.data,
          writable: true,
          configurable: true,
          enumerable: true,
        })
      } else {
        req[source] = result.data
      }
      next()
      return
    }
    next(
      httpError.unprocessable(
        'Request validation failed.',
        'validation_failed',
        toFieldErrors(result.error),
      ),
    )
  }
}

/** Pick only allowed keys from an object (server-side "fillable"). */
export function pickFrom<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Pick<T, K> {
  const picked = {} as Pick<T, K>
  for (const key of keys) {
    if (key in obj) picked[key] = obj[key]
  }
  return picked
}

/** Omit sensitive keys from a plain object before sending it to the client. */
export function hide<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: readonly K[],
): Omit<T, K> {
  const clone = { ...obj }
  for (const key of keys) delete clone[key]
  return clone
}