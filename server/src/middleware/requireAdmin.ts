import type { RequestHandler } from 'express'
import { httpError } from '../lib/AppError.js'

/**
 * Admin-only gate. Must run after `authenticate`, which attaches the account
 * role to `req.user`. Non-admins get a 403; anonymous users a 401.
 */
export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (!req.user) {
    next(httpError.unauthorized('Authentication required. Please log in.'))
    return
  }
  if (req.user.role !== 'admin') {
    next(httpError.forbidden('Admins only.', 'admin_only'))
    return
  }
  next()
}
