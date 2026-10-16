import { renderLayout } from '../layout.js'
import type { RenderedEmail } from '../types.js'

export interface PasswordChangedData {
  firstName: string
}

/** Security confirmation sent after a password is reset or changed. */
export function passwordChanged({ firstName }: PasswordChangedData): RenderedEmail {
  const bodyHtml = `
    <p style="margin:0 0 16px;color:#333333;font-size:15px;line-height:1.65;">
      Your Sawari password was changed and you can keep learning where you left off.
    </p>
    <p style="margin:0 0 16px;color:#777777;font-size:13px;line-height:1.6;">
      If this was not you, reset your password right away and reply to this email so we can help.
    </p>
  `

  const html = renderLayout({
    preheader: 'Your Sawari password was changed',
    heading: 'Your password was changed',
    intro: 'A quick note to confirm that your account password was updated.',
    bodyHtml,
    footerNote: 'Sawari. Learn by doing.',
  })

  const text = [
    `Hi ${firstName},`,
    '',
    'Your Sawari password was changed.',
    '',
    'If this was not you, reset your password right away and reply to this email so we can help.',
    '',
    'Sawari. Learn by doing.',
  ].join('\n')

  return { subject: 'Your Sawari password was changed', html, text }
}
