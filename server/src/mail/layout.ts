/* ------------------------------------------------------------------ */
/*  Shared email chrome. Plain white canvas, dark text, no cards, no    */
/*  rounded corners, no brand colours. Every style is inline so it      */
/*  holds up across email clients.                                      */
/* ------------------------------------------------------------------ */

const INK = '#111111'
const BODY = '#333333'
const MUTED = '#777777'

/** Escapes untrusted text before it is interpolated into HTML. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function paragraphs(items: string[]): string {
  return items
    .map(
      (text) =>
        `<p style="margin:0 0 16px;color:${BODY};font-size:15px;line-height:1.65;">${escapeHtml(
          text,
        )}</p>`,
    )
    .join('')
}

export function bulletList(items: string[]): string {
  const rows = items
    .map((text) => `<li style="margin:0 0 6px;">${escapeHtml(text)}</li>`)
    .join('')
  return `<ul style="margin:0 0 16px;padding-left:20px;color:${BODY};font-size:15px;line-height:1.65;">${rows}</ul>`
}

/** A plain text link. No button chrome, just something to click. */
export function ctaLink(label: string, url: string): string {
  return `<p style="margin:0 0 20px;font-size:15px;line-height:1.65;"><a href="${url}" target="_blank" style="color:${INK};text-decoration:underline;">${escapeHtml(
    label,
  )}</a></p>`
}

export interface LayoutOptions {
  preheader: string
  heading: string
  intro?: string
  bodyHtml?: string
  cta?: { label: string; url: string }
  footerNote?: string
}

/** Wraps content in a plain white canvas. */
export function renderLayout(options: LayoutOptions): string {
  const { preheader, heading, intro, bodyHtml, cta, footerNote } = options
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <title>${escapeHtml(heading)}</title>
  </head>
  <body style="margin:0;padding:0;background:#ffffff;">
    <span style="display:none!important;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;">${escapeHtml(
      preheader,
    )}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
            <tr>
              <td style="padding:32px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                <p style="margin:0 0 28px;color:${INK};font-size:15px;font-weight:600;">Sawari</p>
                <h1 style="margin:0 0 16px;color:${INK};font-size:20px;font-weight:600;line-height:1.35;">${escapeHtml(
                  heading,
                )}</h1>
                ${intro ? `<p style="margin:0 0 16px;color:${BODY};font-size:15px;line-height:1.65;">${escapeHtml(intro)}</p>` : ''}
                ${bodyHtml ?? ''}
                ${cta ? ctaLink(cta.label, cta.url) : ''}
                <p style="margin:32px 0 0;color:${MUTED};font-size:12.5px;line-height:1.6;">
                  ${footerNote ? `${escapeHtml(footerNote)}<br />` : ''}You are receiving this because you have a Sawari account.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}
