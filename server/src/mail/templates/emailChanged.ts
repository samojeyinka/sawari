import { renderLayout } from '../layout.js'
import type { RenderedEmail } from '../types.js'

export interface EmailChangedData {
  firstName: string
  newEmail: string
}

/**
 * Security notice sent to the previous address after an email change, so a
 * mailbox that is losing the account still gets told.
 */
export function emailChanged({ firstName, newEmail }: EmailChangedData): RenderedEmail {
  const html = renderLayout({
    preheader: 'The email on your Sawari account was changed.',
    heading: 'Your account email changed',
    intro: `Hi ${firstName}, the email on your Sawari account was changed to ${newEmail}.`,
    bodyHtml:
      '<p style="margin:0 0 16px;color:#333333;font-size:15px;line-height:1.65;">If this was you, there is nothing else to do. If you did not make this change, reply to this email right away so we can help you secure your account.</p>',
    footerNote: 'Sawari. Learn by doing.',
  })

  const text = [
    `Hi ${firstName},`,
    '',
    `The email on your Sawari account was changed to ${newEmail}.`,
    '',
    'If this was you, there is nothing else to do.',
    'If you did not make this change, reply to this email right away so we can help you secure your account.',
    '',
    'Sawari. Learn by doing.',
  ].join('\n')

  return { subject: 'Your Sawari account email changed', html, text }
}
