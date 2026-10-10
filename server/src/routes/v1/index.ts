import { Router } from 'express'
import authRoutes from './auth.routes.js'
import learningPathRoutes from './learningPaths.routes.js'
import meRoutes from './me.routes.js'
import projectRoutes from './projects.routes.js'

const router = Router()

router.get('/health', (_req, res) => {
  res.ok({ status: 'ok', uptime: process.uptime() })
})

router.use('/auth', authRoutes)
router.use('/me', meRoutes)
router.use('/learning-paths', learningPathRoutes)
router.use('/projects', projectRoutes)

export default router