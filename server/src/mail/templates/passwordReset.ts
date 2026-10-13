import { renderLayout } from '../layout.js'
import type { RenderedEmail } from '../types.js'

export interface PasswordResetData {
  firstName: string
  resetUrl: string
  expiresMinutes?: number
}

/** Sent when a learner requests a password reset link. */
export function passwordReset({
  firstName,
  resetUrl,
  expiresMinutes = 60,
}: PasswordResetData): RenderedEmail {
  const bodyHtml = `
    <p style="margin:0 0 16px;color:#55575e;font-size:15px;line-height:1.6;">
      Hi ${firstName}, we received a request to reset your Sawari password. Click the button below to choose a new one:
    </p>
    <p style="margin:0 0 16px;color:#71717a;font-size:13px;line-height:1.6;">
      This link expires in ${expiresMinutes} minutes. If you did not request a reset, you can safely ignore this email — your password will not change.
    </p>
  `

  const html = renderLayout({
    preheader: 'Reset your Sawari password',
    heading: 'Reset your password',
    intro: 'Choose a new password to get back into your learning path.',
    bodyHtml,
    cta: { label: 'Reset password', url: resetUrl },
    footerNote: 'Sawari — deep, structured learning.',
  })

  const text = [
    `Hi ${firstName},`,
    '',
    'We received a request to reset your Sawari password.',
    `Open this link to choose a new one: ${resetUrl}`,
    '',
    `This link expires in ${expiresMinutes} minutes.`,
    '',
    'If you did not request this, you can safely ignore this email.',
    '',
    '— Sawari',
  ].join('\n')

  return { subject: 'Reset your Sawari password', html, text }
}
