import { z } from 'zod'
import { idParamSchema, listQuerySchema } from './common.js'

const TRUTHY = z.enum(['true', 'false']).optional()

/** `GET /notifications?unread=true&page=&limit=` */
export const notificationListQuerySchema = listQuerySchema({
  unread: TRUTHY,
})

/** `POST /notifications/:id/read` */
export const notificationIdParamSchema = idParamSchema

/** `POST /notifications/test-email` — strict empty body: the test always goes
    to the caller's own account email. No arbitrary recipient (anti-spam). */
export const sendTestEmailSchema = z.strictObject({})

export type SendTestEmailInput = z.infer<typeof sendTestEmailSchema>