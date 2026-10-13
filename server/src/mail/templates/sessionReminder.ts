import { renderLayout } from '../layout.js'
import type { RenderedEmail } from '../types.js'

export interface SessionReminderData {
  firstName: string
  pathTitle: string
  sessionTitle: string
  minutes: number
  ctaUrl: string
}

/** Nudges the learner on a scheduled day with today's session. */
export function sessionReminder({
  firstName,
  pathTitle,
  sessionTitle,
  minutes,
  ctaUrl,
}: SessionReminderData): RenderedEmail {
  const heading = `Today: ${sessionTitle}`
  const html = renderLayout({
    preheader: `${minutes} minutes on ${pathTitle}. Start whenever you are ready.`,
    heading,
    intro: `${firstName}, your next session on ${pathTitle} is ready. About ${minutes} minutes when you have the time.`,
    bodyHtml:
      '<p style="margin:0 0 16px;color:#55575e;font-size:15px;line-height:1.6;">Skipping a day is fine — the plan simply shifts. This is just a nudge, not a deadline.</p>',
    cta: { label: 'Start session', url: ctaUrl },
    footerNote: 'You can turn reminders off in Settings.',
  })
  const text = [
    `Today: ${sessionTitle}`,
    '',
    `${firstName}, your next session on ${pathTitle} is ready (about ${minutes} minutes).`,
    'Start whenever you are ready:',
    ctaUrl,
    '',
    '— Sawari',
  ].join('\n')
  return { subject: `Today's session: ${sessionTitle}`, html, text }
}
