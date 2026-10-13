import { Resend } from 'resend'
import { env, isMailConfigured } from '../config/env.js'
import { emailTemplates, type EmailTemplateName, type EmailTemplates } from './templates/index.js'
import type { EmailMessage, RenderedEmail } from './types.js'

/* ------------------------------------------------------------------ */
/*  Mail client. One entry point for everything outbound.              */
/*  - renderTemplate(name, data): pure, type-checked rendering.        */
/*  - sendEmail(message): actually dispatches via Resend, or logs      */
/*    when sending is disabled (dev/tests without a key).              */
/* ------------------------------------------------------------------ */

let client: Resend | null = null

function getClient(): Resend {
  client ??= new Resend(env.RESEND_API_KEY)
  return client
}

/** Render a named template to a fully-formed email. */
export function renderTemplate<K extends EmailTemplateName>(
  name: K,
  data: EmailTemplates[K],
): RenderedEmail {
  return emailTemplates[name](data)
}

/**
 * Send a rendered email. When `RESEND_API_KEY` is absent or `MAIL_ENABLED`
 * is false this logs a stub line instead of hitting the network — which is
 * the sandbox behaviour for local dev and tests.
 */
export async function sendEmail(message: EmailMessage): Promise<void> {
  if (!isMailConfigured) {
    console.log(`[mail] disabled — would send "${message.subject}" to ${message.to}`)
    return
  }
  const { error } = await getClient().emails.send({
    from: env.MAIL_FROM,
    to: message.to,
    subject: message.subject,
    html: message.html,
    text: message.text,
  })
  if (error) {
    throw new Error(`Resend refused the email: ${error.message ?? 'unknown error'}`)
  }
}