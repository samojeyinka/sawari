import { escapeHtml, renderLayout } from '../layout.js'
import type { RenderedEmail } from '../types.js'

export interface ProjectFeedbackData {
  firstName: string
  projectTitle: string
  summary: string
  ctaUrl: string
}

/** Sent when an AI review of a submitted project is ready. */
export function projectFeedback({
  firstName,
  projectTitle,
  summary,
  ctaUrl,
}: ProjectFeedbackData): RenderedEmail {
  const bodyHtml = `
    <p style="margin:0 0 16px;color:#333333;font-size:15px;line-height:1.65;">${escapeHtml(summary)}</p>
    <p style="margin:0 0 16px;color:#777777;font-size:13px;line-height:1.6;">Open the project to read the full review and see what to try next.</p>
  `

  const html = renderLayout({
    preheader: `Your review of ${projectTitle} is ready.`,
    heading: `Feedback on ${projectTitle}`,
    intro: `${firstName}, your project review is ready.`,
    bodyHtml,
    cta: { label: 'Read the full review', url: ctaUrl },
    footerNote: 'Sawari. Learn by doing.',
  })

  const text = [
    `Hi ${firstName},`,
    '',
    `Your review of "${projectTitle}" is ready.`,
    '',
    summary,
    '',
    `Read the full review: ${ctaUrl}`,
    '',
    'Sawari. Learn by doing.',
  ].join('\n')

  return { subject: `Feedback on ${projectTitle}`, html, text }
}
