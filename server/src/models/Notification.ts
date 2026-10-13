import mongoose, { type Document, type Model, Schema, type Types } from 'mongoose'

/* ------------------------------------------------------------------ */
/*  Notifications: what lands in the in-app bell. One row per user,    */
/*  oldest stays visible until read; the kinds mirror the client's     */
/*  bell categories.                                                   */
/* ------------------------------------------------------------------ */

export const NOTIFICATION_KINDS = ['session', 'project', 'path', 'account'] as const
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number]

export interface SafeNotification {
  id: string
  kind: NotificationKind
  title: string
  body: string
  read: boolean
  link: string | null
  createdAt: string
}

export interface NotificationDocument extends Document {
  _id: Types.ObjectId
  user: Types.ObjectId
  kind: NotificationKind
  title: string
  body: string
  read: boolean
  link?: string | null
  meta?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

interface NotificationModel extends Model<NotificationDocument> {
  listForUser(userId: string): Promise<NotificationDocument[]>
}

const notificationSchema = new Schema<NotificationDocument, NotificationModel>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    kind: { type: String, enum: NOTIFICATION_KINDS, required: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    body: { type: String, required: true, trim: true, maxlength: 400 },
    read: { type: Boolean, default: false },
    link: { type: String, default: null, maxlength: 1000 },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
)

notificationSchema.index({ user: 1, createdAt: -1 })
notificationSchema.index({ user: 1, read: 1 })

export const Notification: Model<NotificationDocument> = mongoose.model<
  NotificationDocument,
  NotificationModel
>('Notification', notificationSchema)

/** Views a notification document as the shape that may leave the API. */
export function toSafeNotification(doc: {
  _id: Types.ObjectId
  kind: NotificationKind
  title: string
  body: string
  read: boolean
  link?: string | null
  createdAt: Date
}): SafeNotification {
  return {
    id: doc._id.toString(),
    kind: doc.kind,
    title: doc.title,
    body: doc.body,
    read: doc.read,
    link: doc.link?.length ? doc.link : null,
    createdAt: doc.createdAt.toISOString(),
  }
}