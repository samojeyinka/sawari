import { escapeHtml, renderLayout } from '../layout.js'
import type { RenderedEmail } from '../types.js'

export interface WeeklySummaryData {
  firstName: string
  sessionsCompleted: number
  minutes: number
  streakWeek: number
  focus: string
  ctaUrl: string
}

/** Weekly rollup of what the learner finished and what is next. */
export function weeklySummary({
  firstName,
  sessionsCompleted,
  minutes,
  streakWeek,
  focus,
  ctaUrl,
}: WeeklySummaryData): RenderedEmail {
  const bodyHtml = `
      <p style="margin:0 0 8px;color:#333333;font-size:15px;line-height:1.65;">Sessions completed: ${sessionsCompleted}</p>
      <p style="margin:0 0 8px;color:#333333;font-size:15px;line-height:1.65;">Minutes learned: ${minutes}</p>
      ${
        streakWeek > 1
          ? `<p style="margin:0 0 8px;color:#333333;font-size:15px;line-height:1.65;">That is ${streakWeek} weeks in a row. Nice work.</p>`
          : ''
      }
      <p style="margin:0 0 16px;color:#333333;font-size:15px;line-height:1.65;">Next up: <strong>${escapeHtml(focus)}</strong></p>`

  const html = renderLayout({
    preheader: `${sessionsCompleted} sessions, ${minutes} minutes. Next up: ${focus}.`,
    heading: 'Your week on Sawari',
    intro: `Here is how your week went, ${firstName}.`,
    bodyHtml,
    cta: { label: 'Open your path', url: ctaUrl },
    footerNote: 'This comes every week. You can switch it off in Settings.',
  })

  const text = [
    'Your week on Sawari',
    '',
    `Sessions completed: ${sessionsCompleted}`,
    `Minutes learned: ${minutes}`,
    streakWeek > 1 ? `Weeks in a row: ${streakWeek}` : '',
    `Next up: ${focus}`,
    '',
    `Open your path: ${ctaUrl}`,
    '',
    'Sawari. Learn by doing.',
  ]
    .filter(Boolean)
    .join('\n')

  return { subject: `Your week on Sawari: ${sessionsCompleted} sessions`, html, text }
}
