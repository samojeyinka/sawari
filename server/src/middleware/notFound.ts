import type { RequestHandler } from 'express'
import { fail } from '../lib/ApiResponse.js'

export const notFound: RequestHandler = (req, res) => {
  res.status(404).json(
    fail('not_found', `Route ${req.method} ${req.originalUrl} does not exist.`),
  )
}