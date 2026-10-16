import { renderLayout } from '../layout.js'
import type { RenderedEmail } from '../types.js'

export interface PathReadyData {
  firstName: string
  pathTitle: string
  sections: number
  ctaUrl: string
}

/** Sent once an AI generated learning path is finished and ready to use. */
export function pathReady({
  firstName,
  pathTitle,
  sections,
  ctaUrl,
}: PathReadyData): RenderedEmail {
  const html = renderLayout({
    preheader: `Your path "${pathTitle}" is ready.`,
    heading: 'Your path is ready',
    intro: `${firstName}, we built "${pathTitle}" into ${sections} sections.`,
    bodyHtml:
      '<p style="margin:0 0 16px;color:#333333;font-size:15px;line-height:1.65;">Open it and start your first session whenever you like.</p>',
    cta: { label: 'Open your path', url: ctaUrl },
    footerNote: 'Sawari. Learn by doing.',
  })

  const text = [
    `Hi ${firstName},`,
    '',
    `We built "${pathTitle}" into ${sections} sections.`,
    '',
    'Open it and start your first session whenever you like:',
    ctaUrl,
    '',
    'Sawari. Learn by doing.',
  ].join('\n')

  return { subject: 'Your learning path is ready', html, text }
}
