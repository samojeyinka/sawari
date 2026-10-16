import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { env } from './config/env.js'
import { errorHandler } from './middleware/errorHandler.js'
import { notFound } from './middleware/notFound.js'
import { apiLimiter } from './middleware/rateLimiter.js'
import { responseMacros } from './middleware/responseMacros.js'
import { passport, registerPassport } from './passport/index.js'
import publicRoutes from './routes/public.routes.js'
import v1Routes from './routes/v1/index.js'

export function createApp(): express.Express {
  const app = express()

  app.disable('x-powered-by')
  app.set('trust proxy', 1)

  app.use(helmet())
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
    }),
  )
  app.use(express.json({ limit: '100kb' }))
  app.use(express.urlencoded({ extended: true }))
  app.use(cookieParser())

  registerPassport()
  app.use(passport.initialize())

  app.use(responseMacros)

  app.use('/api/v1', apiLimiter, v1Routes)

  // Server-rendered, crawlable public catalog surface (root-level, no auth).
  app.use(publicRoutes)

  app.use(notFound)
  app.use(errorHandler)

  return app
}