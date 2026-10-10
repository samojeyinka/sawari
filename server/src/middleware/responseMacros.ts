import type { RequestHandler } from 'express'
import * as api from '../lib/ApiResponse.js'

/**
 * Response macros: `res.ok(data?, meta?)`, `res.created(data?)`, `res.noContent()`.
 * Keeps every controller free of wrapping logic and enforces the envelope shape.
 */
export const responseMacros: RequestHandler = (_, res, next) => {
  res.ok = (data, meta) => res.status(200).json(api.ok(data, meta))
  res.created = (data, meta) => res.status(201).json(api.ok(data, meta))
  res.noContent = () => res.status(204).end()
  next()
}