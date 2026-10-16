import { renderLayout } from '../layout.js'
import type { RenderedEmail } from '../types.js'

export interface ProUpgradedData {
  firstName: string
  pathLimit: number
  appUrl: string
}

/** Receipt style confirmation sent right after a Pro upgrade. */
export function proUpgraded({ firstName, pathLimit, appUrl }: ProUpgradedData): RenderedEmail {
  const html = renderLayout({
    preheader: 'Your Sawari Pro upgrade went through.',
    heading: 'You are on Sawari Pro',
    intro: `Thanks, ${firstName}. Your payment went through and Pro is now active on your account.`,
    bodyHtml: `<p style="margin:0 0 16px;color:#333333;font-size:15px;line-height:1.65;">You can now hold up to ${pathLimit} learning paths at the same time.</p>`,
    cta: { label: 'Open Sawari', url: appUrl },
    footerNote: 'Sawari. Learn by doing.',
  })

  const text = [
    `Hi ${firstName},`,
    '',
    'Thanks. Your payment went through and Sawari Pro is now active on your account.',
    '',
    `You can now hold up to ${pathLimit} learning paths at the same time.`,
    '',
    'Open Sawari:',
    appUrl,
    '',
    'Sawari. Learn by doing.',
  ].join('\n')

  return { subject: 'Your Sawari Pro upgrade is active', html, text }
}
