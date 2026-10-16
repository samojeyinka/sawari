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
    <p style="margin:0 0 16px;color:#333333;font-size:15px;line-height:1.65;">
      We received a request to reset your Sawari password. Choose a new one with the link below.
    </p>
    <p style="margin:0 0 16px;color:#777777;font-size:13px;line-height:1.6;">
      This link expires in ${expiresMinutes} minutes. If you did not request this, you can ignore this email and your password will stay the same.
    </p>
  `

  const html = renderLayout({
    preheader: 'Reset your Sawari password',
    heading: 'Reset your password',
    intro: 'Choose a new password to get back into your learning path.',
    bodyHtml,
    cta: { label: 'Reset your password', url: resetUrl },
    footerNote: 'Sawari. Learn by doing.',
  })

  const text = [
    `Hi ${firstName},`,
    '',
    'We received a request to reset your Sawari password.',
    `Choose a new one here: ${resetUrl}`,
    '',
    `This link expires in ${expiresMinutes} minutes.`,
    '',
    'If you did not request this, you can ignore this email and your password will stay the same.',
    '',
    'Sawari. Learn by doing.',
  ].join('\n')

  return { subject: 'Reset your Sawari password', html, text }
}
