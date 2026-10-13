import { renderLayout } from '../layout.js'
import type { RenderedEmail } from '../types.js'

export interface WelcomeData {
  firstName: string
  appUrl: string
}

/** Sent once when a new account is created. */
export function welcome({ firstName, appUrl }: WelcomeData): RenderedEmail {
  const heading = `Welcome to Sawari, ${firstName}`
  const html = renderLayout({
    preheader: 'Your account is ready. Build your first learning path.',
    heading,
    intro:
      'Sawari turns what you want to learn into a paced, hands-on path — short sessions, real practice, and a plan that adapts as you go.',
    bodyHtml:
      '<p style="margin:0 0 16px;color:#55575e;font-size:15px;line-height:1.6;">Your account is ready. When you have a moment, tell us what you want to learn and we will build the first path for you.</p>',
    cta: { label: 'Build my learning path', url: appUrl },
    footerNote: 'Sawari — learn by doing.',
  })
  const text = [
    `Welcome to Sawari, ${firstName}!`,
    '',
    'Sawari turns what you want to learn into a paced, hands-on path.',
    'Your account is ready. Build your first learning path here:',
    appUrl,
    '',
    '— Sawari',
  ].join('\n')
  return { subject: 'Welcome to Sawari', html, text }
}
