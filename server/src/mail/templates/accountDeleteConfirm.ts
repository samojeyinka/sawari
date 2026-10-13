import { renderLayout } from '../layout.js'
import type { RenderedEmail } from '../types.js'

export interface AccountDeleteConfirmData {
  firstName: string
  confirmUrl: string
  expiresHours?: number
}

/** Sent to confirm an account-deletion request. Nothing is deleted yet. */
export function accountDeleteConfirm({
  firstName,
  confirmUrl,
  expiresHours = 24,
}: AccountDeleteConfirmData): RenderedEmail {
  const bodyHtml = `
    <p style="margin:0 0 16px;color:#55575e;font-size:15px;line-height:1.6;">
      Hi ${firstName}, we received a request to delete your Sawari account. Click the button below to confirm — your paths, projects and progress will be kept for 30 days in case you change your mind:
    </p>
    <p style="margin:0 0 16px;color:#71717a;font-size:13px;line-height:1.6;">
      This link expires in ${expiresHours} hours. If you did not request this, you can safely ignore this email — nothing will change.
    </p>
  `

  const html = renderLayout({
    preheader: 'Confirm deleting your Sawari account',
    heading: 'Confirm account deletion',
    intro: 'One last step before your account is closed.',
    bodyHtml,
    cta: { label: 'Delete my account', url: confirmUrl },
    footerNote: 'Sawari — deep, structured learning.',
  })

  const text = [
    `Hi ${firstName},`,
    '',
    'We received a request to delete your Sawari account.',
    `Open this link to confirm: ${confirmUrl}`,
    '',
    `This link expires in ${expiresHours} hours. Your data is kept for 30 days afterwards in case you change your mind.`,
    '',
    'If you did not request this, you can safely ignore this email.',
    '',
    '— Sawari',
  ].join('\n')

  return { subject: 'Confirm deleting your Sawari account', html, text }
}
