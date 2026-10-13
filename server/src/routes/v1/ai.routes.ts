import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { authLimiter } from '../../middleware/rateLimiter.js'
import { validate } from '../../middleware/validate.js'
import { asyncHandler } from '../../lib/asyncHandler.js'
import { checkAiHealth } from '../../services/ai/health.js'
import { estimateTimeline, extractGoal, reviewPractice } from '../../services/ai/index.js'
import { resolveUserKey } from '../../services/userKey.js'
import type { ExtractGoalInput } from '../../validators/learningPathValidators.js'
import {
  extractGoalValidator,
  reviewPracticeValidator,
  timelineEstimateValidator,
} from '../../validators/learningPathValidators.js'

const router = Router()

router.use(authenticate)

router.get(
  '/health',
  asyncHandler(async (_req, res) => {
    const health = await checkAiHealth({ fresh: true })
    res.ok(health)
  }),
)

router.post(
  '/extract-goal',
  authLimiter,
  validate(extractGoalValidator),
  asyncHandler(async (req, res) => {
    const body = req.body as ExtractGoalInput
    const goal = await extractGoal(body.mode, body.input, await resolveUserKey(req.user!.id))
    res.ok(goal)
  }),
)

router.post(
  '/timeline',
  validate(timelineEstimateValidator),
  asyncHandler(async (req, res) => {
    const estimate = await estimateTimeline(req.body, await resolveUserKey(req.user!.id))
    res.ok(estimate)
  }),
)

router.post(
  '/review-practice',
  validate(reviewPracticeValidator),
  asyncHandler(async (req, res) => {
    const review = await reviewPractice(req.body, await resolveUserKey(req.user!.id))
    res.ok(review)
  }),
)

export default router
