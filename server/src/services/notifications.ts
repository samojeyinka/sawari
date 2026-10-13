import { enqueue } from '../jobs/queue.js'
import type { RenderedEmail } from '../mail/types.js'
import {
  Notification,
  toSafeNotification,
  type NotificationKind,
  type SafeNotification,
} from '../models/Notification.js'

/* ------------------------------------------------------------------ */
/*  Notifications service.                                             */
/*  - createNotification(...): persists the in-app bell row.           */
/*  - It may carry an already-rendered email; the email is then        */
/*    queued as a durable job (send async, retries, no blocking on     */
/*    the request that triggered it).                                  */
/* ------------------------------------------------------------------ */

export interface CreateNotificationInput {
  userId: string
  kind: NotificationKind
  title: string
  body: string
  link?: string | null
  meta?: Record<string, unknown>
  email?: { to: string; rendered: RenderedEmail }
}

/** Queues an already-rendered email as a durable job (no in-app bell row). */
export async function queueEmail(to: string, rendered: RenderedEmail): Promise<void> {
  await enqueue('send-email', { to, ...rendered })
}

export async function createNotification(
  input: CreateNotificationInput,
): Promise<SafeNotification> {
  const notification = await Notification.create({
    user: input.userId,
    kind: input.kind,
    title: input.title,
    body: input.body,
    link: input.link ?? null,
    meta: input.meta,
  })

  if (input.email) {
    await queueEmail(input.email.to, input.email.rendered)
  }

  return toSafeNotification(notification)
}