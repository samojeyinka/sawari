import { renderLayout } from '../layout.js'
import type { RenderedEmail } from '../types.js'

export interface AccountDeletedData {
  firstName: string
  restoreUrl: string
  restoreDays?: number
}

/** Sent after an account is soft-deleted. Carries the restore link. */
export function accountDeleted({
  firstName,
  restoreUrl,
  restoreDays = 30,
}: AccountDeletedData): RenderedEmail {
  const bodyHtml = `
    <p style="margin:0 0 16px;color:#55575e;font-size:15px;line-height:1.6;">
      Hi ${firstName}, your Sawari account has been deleted as requested. Your paths, projects and progress are kept for ${restoreDays} days — click below any time before then to bring everything back:
    </p>
    <p style="margin:0 0 16px;color:#71717a;font-size:13px;line-height:1.6;">
      After ${restoreDays} days your data is permanently removed and cannot be recovered.
    </p>
  `

  const html = renderLayout({
    preheader: 'Your Sawari account was deleted',
    heading: 'Account deleted',
    intro: `Changed your mind? You have ${restoreDays} days to restore everything.`,
    bodyHtml,
    cta: { label: 'Restore my account', url: restoreUrl },
    footerNote: 'Sawari — deep, structured learning.',
  })

  const text = [
    `Hi ${firstName},`,
    '',
    'Your Sawari account has been deleted as requested.',
    `Restore everything within ${restoreDays} days: ${restoreUrl}`,
    '',
    `After ${restoreDays} days your data is permanently removed and cannot be recovered.`,
    '',
    '— Sawari',
  ].join('\n')

  return { subject: 'Your Sawari account was deleted', html, text }
}
