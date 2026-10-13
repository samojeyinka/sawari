import { Router } from 'express'
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  sendTestNotificationEmail,
} from '../../controllers/notification.controller.js'
import { authenticate } from '../../middleware/authenticate.js'
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
router.post('/test-email', validate(sendTestEmailSchema, 'body'), sendTestNotificationEmail)
router.post('/:id/read', validate(notificationIdParamSchema, 'params'), markNotificationRead)

export default router