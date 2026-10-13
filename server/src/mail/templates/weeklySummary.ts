import { renderLayout } from '../layout.js'
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
  const heading = 'Your week on Sawari'
  const html = renderLayout({
    preheader: `${sessionsCompleted} sessions, ${minutes} minutes. Next up: ${focus}.`,
    heading,
    intro: `Here is how your week went, ${firstName}.`,
    bodyHtml: `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
        <tr>
          <td style="width:50%;background:#f4f1ea;border-radius:8px;padding:12px 14px;">
            <div style="color:#83858d;font-size:12px;letter-spacing:0.04em;text-transform:uppercase;">Sessions</div>
            <div style="color:#17181c;font-size:20px;font-weight:600;">${sessionsCompleted}</div>
          </td>
          <td style="width:4px;"></td>
          <td style="width:50%;background:#f4f1ea;border-radius:8px;padding:12px 14px;">
            <div style="color:#83858d;font-size:12px;letter-spacing:0.04em;text-transform:uppercase;">Minutes</div>
            <div style="color:#17181c;font-size:20px;font-weight:600;">${minutes}</div>
          </td>
        </tr>
      </table>
      ${
        streakWeek > 1
          ? `<p style="margin:0 0 16px;color:#55575e;font-size:15px;line-height:1.6;">That is ${streakWeek} focused weeks in a row. The streak is doing its job.</p>`
          : ''
      }
      <p style="margin:0 0 16px;color:#55575e;font-size:15px;line-height:1.6;">Next up: <strong>${focus}</strong>.</p>`,
    cta: { label: 'Open your path', url: ctaUrl },
    footerNote: 'Coming weekly. You can switch this off in Settings.',
  })
  const text = [
    'Your week on Sawari',
    '',
    `Sessions completed: ${sessionsCompleted}`,
    `Minutes learned: ${minutes}`,
    streakWeek > 1 ? `Weeks in a row: ${streakWeek}` : '',
    `Next up: ${focus}`,
    '',
    'Open your path:',
    ctaUrl,
    '',
    '— Sawari',
  ]
    .filter(Boolean)
    .join('\n')
  return { subject: `Your week on Sawari: ${sessionsCompleted} sessions`, html, text }
}