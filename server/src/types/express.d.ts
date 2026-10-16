import type { Express } from 'express'
import type { Role } from '../domain/index.js'

/* Server-side safety: the app's cookie session is never exposed as a
   readable value to application code; only `req.user` carries the id. */
declare global {
  namespace Express {
    interface User {
      id: string
      /** The account role, attached by `authenticate` for authorization. */
      role: Role
    }

    interface Request {
      /** Authenticated user, attached by the `authenticate` middleware. */
      user?: User
    }

    interface Response {
      /** 200 + envelope */
      ok<T>(data: T, meta?: object): Response
      /** 201 + envelope */
      created<T>(data: T, meta?: object): Response
      /** 204, no body */
      noContent(): Response
    }
  }
}

export {}