import { renderLayout } from '../layout.js'
import type { RenderedEmail } from '../types.js'

export interface EmailChangeCodeData {
  firstName: string
  code: string
  newEmail: string
  expiresMinutes?: number
}

/** 6 digit code sent to the new address to confirm an email change. */
export function emailChangeCode({
  firstName,
  code,
  newEmail,
  expiresMinutes = 15,
}: EmailChangeCodeData): RenderedEmail {
  const bodyHtml = `
    <p style="margin:0 0 8px;color:#111111;font-size:28px;font-weight:600;letter-spacing:6px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;">${code}</p>
    <p style="margin:0 0 16px;color:#777777;font-size:13px;line-height:1.6;">
      Enter it to confirm ${newEmail} as your account email. The code expires in ${expiresMinutes} minutes. If you did not request this, you can ignore this email.
    </p>
  `

  const html = renderLayout({
    preheader: `Your Sawari email change code is ${code}`,
    heading: 'Confirm your new email',
    intro: 'Enter this code to move your account to the new address.',
    bodyHtml,
    footerNote: 'Sawari. Learn by doing.',
  })

  const text = [
    `Hi ${firstName},`,
    '',
    `Your Sawari email change code is: ${code}`,
    '',
    `Enter it to confirm ${newEmail} as your account email. The code expires in ${expiresMinutes} minutes.`,
    '',
    'If you did not request this, you can ignore this email.',
    '',
    'Sawari. Learn by doing.',
  ].join('\n')

  return { subject: `${code} is your Sawari email change code`, html, text }
}
