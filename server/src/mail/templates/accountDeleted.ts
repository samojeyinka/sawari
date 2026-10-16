import { renderLayout } from '../layout.js'
import type { RenderedEmail } from '../types.js'

export interface AccountDeletedData {
  firstName: string
  restoreUrl: string
  restoreDays?: number
}

/** Sent after an account is soft deleted. Carries the restore link. */
export function accountDeleted({
  firstName,
  restoreUrl,
  restoreDays = 30,
}: AccountDeletedData): RenderedEmail {
  const bodyHtml = `
    <p style="margin:0 0 16px;color:#333333;font-size:15px;line-height:1.65;">
      Your Sawari account has been deleted as requested. Your paths, projects and progress are kept for ${restoreDays} days. Open the link below any time before then to bring everything back.
    </p>
    <p style="margin:0 0 16px;color:#777777;font-size:13px;line-height:1.6;">
      After ${restoreDays} days your data is removed for good and cannot be recovered.
    </p>
  `

  const html = renderLayout({
    preheader: 'Your Sawari account was deleted',
    heading: 'Account deleted',
    intro: `Changed your mind? You have ${restoreDays} days to restore everything.`,
    bodyHtml,
    cta: { label: 'Restore your account', url: restoreUrl },
    footerNote: 'Sawari. Learn by doing.',
  })

  const text = [
    `Hi ${firstName},`,
    '',
    'Your Sawari account has been deleted as requested.',
    `Restore everything within ${restoreDays} days: ${restoreUrl}`,
    '',
    `After ${restoreDays} days your data is removed for good and cannot be recovered.`,
    '',
    'Sawari. Learn by doing.',
  ].join('\n')

  return { subject: 'Your Sawari account was deleted', html, text }
}
