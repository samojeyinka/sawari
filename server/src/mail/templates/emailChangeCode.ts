import { renderLayout } from '../layout.js'
import type { RenderedEmail } from '../types.js'

export interface EmailChangeCodeData {
  firstName: string
  code: string
  newEmail: string
  expiresMinutes?: number
}

/** 6-digit code sent to the NEW address to confirm an email change. */
export function emailChangeCode({
  firstName,
  code,
  newEmail,
  expiresMinutes = 15,
}: EmailChangeCodeData): RenderedEmail {
  const bodyHtml = `
    <p style="margin:0 0 16px;color:#55575e;font-size:15px;line-height:1.6;">
      Hi ${firstName}, enter this 6-digit code in Sawari to confirm ${newEmail} as your new account email:
    </p>
    <div style="text-align:center;margin:24px 0;">
      <div style="display:inline-block;background:#f4f4f5;border:1px solid #e4e4e7;border-radius:12px;padding:16px 32px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:32px;font-weight:700;letter-spacing:10px;color:#18181b;">
        ${code}
      </div>
    </div>
    <p style="margin:0 0 16px;color:#71717a;font-size:13px;line-height:1.6;text-align:center;">
      This code will expire in ${expiresMinutes} minutes. If you did not request this, you can safely ignore this email.
    </p>
  `

  const html = renderLayout({
    preheader: `Your Sawari email-change code is ${code}`,
    heading: 'Confirm your new email',
    intro: 'One quick step to move your account to the new address.',
    bodyHtml,
    footerNote: 'Sawari — deep, structured learning.',
  })

  const text = [
    `Hi ${firstName},`,
    '',
    `Your Sawari 6-digit email-change code is: ${code}`,
    `Enter it to confirm ${newEmail} as your new account email.`,
    '',
    `This code expires in ${expiresMinutes} minutes.`,
    '',
    'If you did not request this, you can safely ignore this email.',
    '',
    '— Sawari',
  ].join('\n')

  return { subject: `${code} is your Sawari email-change code`, html, text }
}
