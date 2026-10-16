import { renderLayout } from '../layout.js'
import type { RenderedEmail } from '../types.js'

export interface WelcomeData {
  firstName: string
  appUrl: string
}

/** Sent once when a new account is created, whichever way you signed up. */
export function welcome({ firstName, appUrl }: WelcomeData): RenderedEmail {
  const html = renderLayout({
    preheader: 'Your Sawari account is ready.',
    heading: `Welcome, ${firstName}`,
    intro:
      'Your account is ready. Sawari turns what you want to learn into a short, steady plan you can actually keep up with.',
    bodyHtml:
      '<p style="margin:0 0 16px;color:#333333;font-size:15px;line-height:1.65;">Tell us what you want to learn and we will build your first path. Nothing is set in stone, so you can change it whenever you like.</p>',
    cta: { label: 'Build your first path', url: appUrl },
    footerNote: 'Sawari. Learn by doing.',
  })

  const text = [
    `Hi ${firstName},`,
    '',
    'Welcome to Sawari. Your account is ready.',
    '',
    'Tell us what you want to learn and we will build your first path:',
    appUrl,
    '',
    'Sawari. Learn by doing.',
  ].join('\n')

  return { subject: 'Welcome to Sawari', html, text }
}
