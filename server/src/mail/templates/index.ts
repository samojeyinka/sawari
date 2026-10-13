import type { RenderedEmail } from '../types.js'
import { emailVerification, type EmailVerificationData } from './emailVerification.js'
import { passwordChanged, type PasswordChangedData } from './passwordChanged.js'
import { passwordReset, type PasswordResetData } from './passwordReset.js'
import { sessionReminder, type SessionReminderData } from './sessionReminder.js'
import { weeklySummary, type WeeklySummaryData } from './weeklySummary.js'
import { welcome, type WelcomeData } from './welcome.js'

/* ------------------------------------------------------------------ */
/*  Template registry. Add a new email by adding its data interface,   */
/*  its render function, and one entry here — the type safety flows    */
/*  through so callers can only pass the data it actually expects.     */
/* ------------------------------------------------------------------ */

export interface EmailTemplates {
  welcome: WelcomeData
  'email-verification': EmailVerificationData
  'password-reset': PasswordResetData
  'password-changed': PasswordChangedData
  'session-reminder': SessionReminderData
  'weekly-summary': WeeklySummaryData
}

export type EmailTemplateName = keyof EmailTemplates

export const emailTemplates: {
  [K in EmailTemplateName]: (data: EmailTemplates[K]) => RenderedEmail
} = {
  welcome,
  'email-verification': emailVerification,
  'password-reset': passwordReset,
  'password-changed': passwordChanged,
  'session-reminder': sessionReminder,
  'weekly-summary': weeklySummary,
}