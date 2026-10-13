import { renderLayout } from '../layout.js'
import type { RenderedEmail } from '../types.js'

export interface PasswordChangedData {
  firstName: string
}

/** Security confirmation sent after a password is reset or changed. */
export function passwordChanged({ firstName }: PasswordChangedData): RenderedEmail {
  const bodyHtml = `
    <p style="margin:0 0 16px;color:#55575e;font-size:15px;line-height:1.6;">
      Hi ${firstName}, your Sawari password was changed successfully. You can keep learning where you left off.
    </p>
    <p style="margin:0 0 16px;color:#71717a;font-size:13px;line-height:1.6;">
      If you did not make this change, reset your password immediately or contact support.
    </p>
  `

  const html = renderLayout({
    preheader: 'Your Sawari password was changed',
    heading: 'Your password was changed',
    intro: 'This is a confirmation that your account password has been updated.',
    bodyHtml,
    footerNote: 'Sawari — deep, structured learning.',
  })

  const text = [
    `Hi ${firstName},`,
    '',
    'Your Sawari password was changed successfully.',
    '',
    'If you did not make this change, reset your password immediately or contact support.',
    '',
    '— Sawari',
  ].join('\n')

  return { subject: 'Your Sawari password was changed', html, text }
}
