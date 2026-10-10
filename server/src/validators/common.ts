import { z } from 'zod'

/** 24-hex Mongo ObjectId. Used for path/params validation. */
export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id.')

export const idParamSchema = z.object({ id: objectId })

/** ISO calendar date, `YYYY-MM-DD`. */
export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected an ISO date (YYYY-MM-DD).')
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Invalid date.')

/**
 * Non-strict query schema: unlike request bodies, query strings may carry
 * extra keys, so we strip the unknown ones instead of rejecting the request.
 * Unknown keys are also never used to build a DB query (see queryFilters).
 */
export function listQuerySchema<T extends z.ZodRawShape>(shape: T) {
  return z.object({
    page: z.coerce.number().int().min(1).max(100_000).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    sort: z.string().max(200).optional(),
    select: z.string().max(300).optional(),
    ...shape,
  })
}