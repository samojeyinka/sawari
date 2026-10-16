import { renderLayout } from '../layout.js'
import type { RenderedEmail } from '../types.js'

export interface AccountRestoredData {
  firstName: string
  appUrl: string
}

/** Sent when a soft deleted account is restored. */
export function accountRestored({ firstName, appUrl }: AccountRestoredData): RenderedEmail {
  const html = renderLayout({
    preheader: 'Your Sawari account has been restored.',
    heading: 'Your account is back',
    intro: `Welcome back, ${firstName}. Your Sawari account has been restored and everything is where you left it.`,
    bodyHtml:
      '<p style="margin:0 0 16px;color:#333333;font-size:15px;line-height:1.65;">Sign in to pick up your path and carry on from your last session.</p>',
    cta: { label: 'Open Sawari', url: appUrl },
    footerNote: 'Sawari. Learn by doing.',
  })

  const text = [
    `Hi ${firstName},`,
    '',
    'Welcome back. Your Sawari account has been restored and everything is where you left it.',
    '',
    'Sign in to pick up your path:',
    appUrl,
    '',
    'Sawari. Learn by doing.',
  ].join('\n')

  return { subject: 'Your Sawari account is restored', html, text }
}
