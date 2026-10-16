import { Router } from 'express'
import { env, isAiConfigured, isMailConfigured, isOAuthConfigured, isPaypalConfigured } from '../../config/env.js'
import aiRoutes from './ai.routes.js'
import adminRoutes from './admin.routes.js'
import authRoutes from './auth.routes.js'
import billingRoutes from './billing.routes.js'
import catalogRoutes from './catalog.routes.js'
import learningPathRoutes from './learningPaths.routes.js'
import meRoutes from './me.routes.js'
import notificationRoutes from './notifications.routes.js'
import projectRoutes from './projects.routes.js'
import settingsRoutes from './settings.routes.js'

const router = Router()

router.get('/health', (_req, res) => {
  res.ok({
    status: 'ok',
    uptime: process.uptime(),
    mailConfigured: isMailConfigured,
    aiConfigured: isAiConfigured,
    oauth: isOAuthConfigured,
    billingConfigured: isPaypalConfigured,
    env: env.NODE_ENV,
  })
})

router.use('/ai', aiRoutes)
router.use('/auth', authRoutes)
router.use('/billing', billingRoutes)
router.use('/me', meRoutes)
router.use('/settings', settingsRoutes)
router.use('/learning-paths', learningPathRoutes)
router.use('/projects', projectRoutes)
router.use('/notifications', notificationRoutes)
router.use('/catalog', catalogRoutes)
router.use('/admin', adminRoutes)

export default router