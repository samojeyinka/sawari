/* ------------------------------------------------------------------ */
/*  Shared email chrome. One table-based shell keeps every template     */
/*  visually consistent and email-client-safe (inline styles only).     */
/* ------------------------------------------------------------------ */

const COLORS = {
  band: '#001e2b',
  panel: '#0b2a3a',
  accent: '#0f766e',
  accentText: '#ffffff',
  ink: '#17181c',
  body: '#55575e',
  muted: '#83858d',
  line: '#e8e6e1',
  canvas: '#faf9f7',
} as const

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
        `<p style="margin:0 0 16px;color:${COLORS.body};font-size:15px;line-height:1.6;">${escapeHtml(
          text,
        )}</p>`,
    )
    .join('')
}

export function bulletList(items: string[]): string {
  const rows = items
    .map(
      (text) =>
        `<li style="margin:0 0 8px;color:${COLORS.body};font-size:15px;line-height:1.6;">${escapeHtml(
          text,
        )}</li>`,
    )
    .join('')
  return `<ul style="margin:0 0 16px;padding-left:20px;">${rows}</ul>`
}

export function button(label: string, url: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;">
      <tr>
        <td style="border-radius:8px;background:${COLORS.accent};">
          <a href="${url}" target="_blank" style="display:inline-block;padding:12px 22px;color:${COLORS.accentText};font-size:15px;font-weight:600;text-decoration:none;">${escapeHtml(
            label,
          )}</a>
        </td>
      </tr>
    </table>`
}

export interface LayoutOptions {
  preheader: string
  heading: string
  intro?: string
  bodyHtml?: string
  cta?: { label: string; url: string }
  footerNote?: string
}

/** Wraps content in the Sawari navy band shell. */
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
  <body style="margin:0;padding:0;background:${COLORS.canvas};font-family:system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <span style="display:none!important;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;">${escapeHtml(
      preheader,
    )}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.canvas};padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
            <tr>
              <td style="background:${COLORS.band};border-radius:14px 14px 0 0;padding:22px 28px;">
                <span style="color:#f2f5f7;font-size:18px;font-weight:600;letter-spacing:-0.02em;">Sawari</span>
              </td>
            </tr>
            <tr>
              <td style="background:#ffffff;border:1px solid ${COLORS.line};border-top:0;border-radius:0 0 14px 14px;padding:28px;">
                <h1 style="margin:0 0 16px;color:${COLORS.ink};font-size:20px;line-height:1.3;">${escapeHtml(
                  heading,
                )}</h1>
                ${intro ? `<p style="margin:0 0 16px;color:${COLORS.body};font-size:15px;line-height:1.6;">${escapeHtml(intro)}</p>` : ''}
                ${bodyHtml ?? ''}
                ${cta ? button(cta.label, cta.url) : ''}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px;color:${COLORS.muted};font-size:12px;line-height:1.6;text-align:center;">
                ${footerNote ? `${escapeHtml(footerNote)}<br />` : ''}
                You are receiving this because you have a Sawari account.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}
