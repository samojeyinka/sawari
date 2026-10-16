import { renderLayout } from '../layout.js'
import type { RenderedEmail } from '../types.js'

export interface AccountDeleteConfirmData {
  firstName: string
  confirmUrl: string
  expiresHours?: number
}

/** Sent to confirm an account deletion request. Nothing is deleted yet. */
export function accountDeleteConfirm({
  firstName,
  confirmUrl,
  expiresHours = 24,
}: AccountDeleteConfirmData): RenderedEmail {
  const bodyHtml = `
    <p style="margin:0 0 16px;color:#333333;font-size:15px;line-height:1.65;">
      We received a request to delete your Sawari account. Confirm with the link below. Your paths, projects and progress are kept for 30 days in case you change your mind.
    </p>
    <p style="margin:0 0 16px;color:#777777;font-size:13px;line-height:1.6;">
      This link expires in ${expiresHours} hours. If you did not request this, you can ignore this email and nothing will change.
    </p>
  `

  const html = renderLayout({
    preheader: 'Confirm deleting your Sawari account',
    heading: 'Confirm account deletion',
    intro: 'One last step before your account is closed.',
    bodyHtml,
    cta: { label: 'Delete my account', url: confirmUrl },
    footerNote: 'Sawari. Learn by doing.',
  })

  const text = [
    `Hi ${firstName},`,
    '',
    'We received a request to delete your Sawari account.',
    `Confirm here: ${confirmUrl}`,
    '',
    `This link expires in ${expiresHours} hours. Your data is kept for 30 days afterwards in case you change your mind.`,
    '',
    'If you did not request this, you can ignore this email and nothing will change.',
    '',
    'Sawari. Learn by doing.',
  ].join('\n')

  return { subject: 'Confirm deleting your Sawari account', html, text }
}
