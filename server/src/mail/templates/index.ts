import type { RenderedEmail } from '../types.js'
import { accountDeleteConfirm, type AccountDeleteConfirmData } from './accountDeleteConfirm.js'
import { accountDeleted, type AccountDeletedData } from './accountDeleted.js'
import { emailChangeCode, type EmailChangeCodeData } from './emailChangeCode.js'
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
  'email-change-code': EmailChangeCodeData
  'account-delete-confirm': AccountDeleteConfirmData
  'account-deleted': AccountDeletedData
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
  'email-change-code': emailChangeCode,
  'account-delete-confirm': accountDeleteConfirm,
  'account-deleted': accountDeleted,
  'password-reset': passwordReset,
  'password-changed': passwordChanged,
  'session-reminder': sessionReminder,
  'weekly-summary': weeklySummary,
}