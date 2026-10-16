import { renderLayout } from '../layout.js'
import type { RenderedEmail } from '../types.js'

export interface EmailVerificationData {
  firstName: string
  code: string
  expiresMinutes?: number
}

/** Sent during registration or resend to verify email with a 6 digit code. */
export function emailVerification({
  firstName,
  code,
  expiresMinutes = 15,
}: EmailVerificationData): RenderedEmail {
  const bodyHtml = `
    <p style="margin:0 0 8px;color:#111111;font-size:28px;font-weight:600;letter-spacing:6px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;">${code}</p>
    <p style="margin:0 0 16px;color:#777777;font-size:13px;line-height:1.6;">
      This code expires in ${expiresMinutes} minutes. If you did not create a Sawari account, you can ignore this email.
    </p>
  `

  const html = renderLayout({
    preheader: `Your Sawari verification code is ${code}`,
    heading: 'Verify your email',
    intro: 'Enter this code to verify your email and finish setting up your account.',
    bodyHtml,
    footerNote: 'Sawari. Learn by doing.',
  })

  const text = [
    `Hi ${firstName},`,
    '',
    `Your Sawari verification code is: ${code}`,
    '',
    `Enter it in Sawari to verify your email. The code expires in ${expiresMinutes} minutes.`,
    '',
    'If you did not create a Sawari account, you can ignore this email.',
    '',
    'Sawari. Learn by doing.',
  ].join('\n')

  return { subject: `${code} is your Sawari verification code`, html, text }
}
