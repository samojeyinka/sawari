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
  const html = renderLayout({
    preheader: `${minutes} minutes on ${pathTitle}. Start whenever you are ready.`,
    heading: sessionTitle,
    intro: `${firstName}, your next session on ${pathTitle} is ready. It takes about ${minutes} minutes.`,
    bodyHtml:
      '<p style="margin:0 0 16px;color:#333333;font-size:15px;line-height:1.65;">Skipping a day is fine. The plan shifts and you pick up where you left off.</p>',
    cta: { label: 'Start this session', url: ctaUrl },
    footerNote: 'You can turn reminders off in Settings.',
  })

  const text = [
    `Today's session: ${sessionTitle}`,
    '',
    `${firstName}, your next session on ${pathTitle} is ready. It takes about ${minutes} minutes.`,
    '',
    'Skipping a day is fine. The plan shifts and you pick up where you left off.',
    '',
    `Start this session: ${ctaUrl}`,
    '',
    'Sawari. Learn by doing.',
  ].join('\n')

  return { subject: `Today's session: ${sessionTitle}`, html, text }
}
