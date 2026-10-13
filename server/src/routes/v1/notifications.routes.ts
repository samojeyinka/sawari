import { Router } from 'express'
import {
  deleteNotification,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  sendTestNotificationEmail,
} from '../../controllers/notification.controller.js'
import { authenticate } from '../../middleware/authenticate.js'
import { requireVerifiedEmail } from '../../middleware/requireVerifiedEmail.js'
import { testEmailLimiter } from '../../middleware/rateLimiter.js'
import { validate } from '../../middleware/validate.js'
import {
  notificationIdParamSchema,
  notificationListQuerySchema,
  sendTestEmailSchema,
} from '../../validators/notificationValidators.js'

const router = Router()

router.use(authenticate)
router.get('/', validate(notificationListQuerySchema, 'query'), listNotifications)
router.post('/read-all', markAllNotificationsRead)
router.post(
  '/test-email',
  requireVerifiedEmail,
  testEmailLimiter,
  validate(sendTestEmailSchema, 'body'),
  sendTestNotificationEmail,
)
router.post('/:id/read', validate(notificationIdParamSchema, 'params'), markNotificationRead)
router.delete('/:id', validate(notificationIdParamSchema, 'params'), deleteNotification)

export default router