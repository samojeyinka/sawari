import { renderLayout } from '../layout.js'
import type { RenderedEmail } from '../types.js'

export interface EmailVerificationData {
  firstName: string
  code: string
  expiresMinutes?: number
}

/** Sent during registration or resend to verify email with a 6-digit code. */
export function emailVerification({
  firstName,
  code,
  expiresMinutes = 15,
}: EmailVerificationData): RenderedEmail {
  const bodyHtml = `
    <p style="margin:0 0 16px;color:#55575e;font-size:15px;line-height:1.6;">
      Hi ${firstName}, enter this 6-digit code in Sawari to verify your email and activate your account:
    </p>
    <div style="text-align:center;margin:24px 0;">
      <div style="display:inline-block;background:#f4f4f5;border:1px solid #e4e4e7;border-radius:12px;padding:16px 32px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:32px;font-weight:700;letter-spacing:10px;color:#18181b;">
        ${code}
      </div>
    </div>
    <p style="margin:0 0 16px;color:#71717a;font-size:13px;line-height:1.6;text-align:center;">
      This code will expire in ${expiresMinutes} minutes. If you did not create a Sawari account, you can safely ignore this email.
    </p>
  `

  const html = renderLayout({
    preheader: `Your Sawari verification code is ${code}`,
    heading: 'Verify your email address',
    intro: 'One quick step to activate your account and start your personalized learning path.',
    bodyHtml,
    footerNote: 'Sawari — deep, structured learning.',
  })

  const text = [
    `Hi ${firstName},`,
    '',
    `Your Sawari 6-digit verification code is: ${code}`,
    '',
    `This code expires in ${expiresMinutes} minutes.`,
    '',
    'If you did not request this, you can safely ignore this email.',
    '',
    '— Sawari',
  ].join('\n')

  return { subject: `${code} is your Sawari verification code`, html, text }
}
