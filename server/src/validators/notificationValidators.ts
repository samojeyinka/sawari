import { z } from 'zod'
import { idParamSchema, listQuerySchema } from './common.js'

const TRUTHY = z.enum(['true', 'false']).optional()

/** `GET /notifications?unread=true&page=&limit=` */
export const notificationListQuerySchema = listQuerySchema({
  unread: TRUTHY,
})

/** `POST /notifications/:id/read` */
export const notificationIdParamSchema = idParamSchema

/** `POST /notifications/test-email` */
export const sendTestEmailSchema = z.object({
  targetEmail: z.string().email().optional(),
})

export type SendTestEmailInput = z.infer<typeof sendTestEmailSchema>