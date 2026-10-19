import { renderLayout } from '../layout.js'
import type { RenderedEmail } from '../types.js'

export interface CourseCertificateData {
  firstName: string
  subject: string
  credentialId: string
  certificateUrl: string
  issuedDate: string
}

/** Sent when a learner completes all sections of a verified catalog course. */
export function courseCertificate({
  firstName,
  subject,
  credentialId,
  certificateUrl,
  issuedDate,
}: CourseCertificateData): RenderedEmail {
  const html = renderLayout({
    preheader: `Congratulations ${firstName}, your certificate for ${subject} is ready.`,
    heading: 'Certificate of completion',
    intro: `${firstName}, you have completed all sections of ${subject}.`,
    bodyHtml: `
<p style="margin:0 0 16px;color:#333333;font-size:15px;line-height:1.65;">
  Your verified credential has been issued under credential number <strong>${credentialId}</strong> on ${issuedDate}.
</p>
<p style="margin:0 0 16px;color:#333333;font-size:15px;line-height:1.65;">
  You can view, download, or print your certificate anytime using your personal link below.
</p>`,
    cta: { label: 'View and print certificate', url: certificateUrl },
    footerNote: 'Sawari credentials are authenticated and permanently archived.',
  })

  const text = [
    `Hi ${firstName},`,
    '',
    `Congratulations on completing all sections of ${subject}.`,
    '',
    `Your verified credential has been issued under number ${credentialId} on ${issuedDate}.`,
    '',
    'View and print your certificate here:',
    certificateUrl,
    '',
    'Sawari credentials are authenticated and permanently archived.',
  ].join('\n')

  return { subject: `Certificate of completion: ${subject}`, html, text }
}
