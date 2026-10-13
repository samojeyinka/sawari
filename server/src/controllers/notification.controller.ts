import type { NextFunction, Request, Response } from 'express'
import { env, isMailConfigured } from '../config/env.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import { httpError } from '../lib/AppError.js'
import { pageMeta, parsePagination } from '../lib/queryFilters.js'
import { sendEmail } from '../mail/index.js'
import { sessionReminder } from '../mail/templates/sessionReminder.js'
import { LearningPath } from '../models/LearningPath.js'
import { Notification, toSafeNotification } from '../models/Notification.js'
import { User } from '../models/User.js'
import { createNotification } from '../services/notifications.js'

/* ------------------------------- list ----------------------------- */

export const listNotifications = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { page, limit, skip } = parsePagination(req, { defaultLimit: 20 })

    const filter: Record<string, unknown> = { user: req.user!.id }
    if (req.query.unread === 'true') filter.read = false

    const [items, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ user: req.user!.id, read: false }),
    ])

    res.ok(items.map(toSafeNotification), {
      ...pageMeta(page, limit, total),
      unreadCount,
    })
  },
)

/* ---------------------------- mark one read ----------------------- */

export const markNotificationRead = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user!.id },
      { $set: { read: true } },
      { returnDocument: 'after' },
    ).lean()
    if (!notification) throw httpError.notFound('Notification not found.')
    res.ok(toSafeNotification(notification))
  },
)

export const markAllNotificationsRead = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    await Notification.updateMany(
      { user: req.user!.id, read: false },
      { $set: { read: true } },
    )
    res.ok({ unreadCount: 0 })
  },
)

/* ------------------------------ dismiss --------------------------- */

export const deleteNotification = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const deleted = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user!.id,
    }).lean()
    if (!deleted) throw httpError.notFound('Notification not found.')
    res.noContent()
  },
)

/* -------------------------- send test email ----------------------- */

export const sendTestNotificationEmail = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    // Fail closed when mail is unconfigured instead of claiming delivery.
    if (!isMailConfigured) {
      throw httpError.serviceUnavailable(
        'Email delivery is not configured on this server.',
        'mail_unconfigured',
      )
    }

    const user = await User.findById(req.user!.id)
    if (!user) throw httpError.notFound('User not found.')

    // The test always goes to the caller's own account email — never to an
    // arbitrary address (this endpoint must not be usable as a spam relay).
    const recipient = user.email

    const path = await LearningPath.findOne({ userId: user._id }).sort({ createdAt: -1 })
    const section = path
      ? (path.sections.find((s) => s.id === path.currentSectionId) ??
         path.sections.find((s) => s.status === 'current') ??
         path.sections[0])
      : null

    const pathTitle = path?.subject ?? 'Full-Stack Engineering'
    const sessionTitle = section?.title ?? 'Architecture & Core Patterns'
    const minutes = section?.minutes ?? 30
    const ctaUrl = section
      ? `${env.FRONTEND_URL}/app/session/${section.id}`
      : `${env.FRONTEND_URL}/app/today`

    const rendered = sessionReminder({
      firstName: user.firstName || 'Learner',
      pathTitle,
      sessionTitle,
      minutes,
      ctaUrl,
    })

    let delivered = false
    let deliveryError: string | undefined

    try {
      await sendEmail({
        to: recipient,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
      })
      delivered = true
    } catch (err) {
      deliveryError = err instanceof Error ? err.message : String(err)
    }

    const notification = await createNotification({
      userId: user._id.toString(),
      kind: 'session',
      title: `Reminder: ${sessionTitle}`,
      body: delivered
        ? `Preview session reminder delivered to ${recipient}.`
        : `Preview reminder dispatch failed: ${deliveryError}`,
      link: section ? `/app/session/${section.id}` : '/app/today',
      meta: { testEmail: true, recipient, delivered },
    })

    res.ok({
      delivered,
      recipient,
      subject: rendered.subject,
      inAppNotificationId: notification.id,
      error: deliveryError,
      message: delivered
        ? `Test reminder email successfully dispatched to ${recipient}. Check your inbox!`
        : `Email delivery failed: ${deliveryError}`,
    })
  },
)