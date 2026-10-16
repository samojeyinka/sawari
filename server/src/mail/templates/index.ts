import type { RenderedEmail } from '../types.js'
import { accountDeleteConfirm, type AccountDeleteConfirmData } from './accountDeleteConfirm.js'
import { accountDeleted, type AccountDeletedData } from './accountDeleted.js'
import { accountRestored, type AccountRestoredData } from './accountRestored.js'
import { emailChangeCode, type EmailChangeCodeData } from './emailChangeCode.js'
import { emailChanged, type EmailChangedData } from './emailChanged.js'
import { emailVerification, type EmailVerificationData } from './emailVerification.js'
import { pathReady, type PathReadyData } from './pathReady.js'
import { passwordChanged, type PasswordChangedData } from './passwordChanged.js'
import { passwordReset, type PasswordResetData } from './passwordReset.js'
import { proUpgraded, type ProUpgradedData } from './proUpgraded.js'
import { projectFeedback, type ProjectFeedbackData } from './projectFeedback.js'
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
  'email-changed': EmailChangedData
  'account-delete-confirm': AccountDeleteConfirmData
  'account-deleted': AccountDeletedData
  'account-restored': AccountRestoredData
  'password-reset': PasswordResetData
  'password-changed': PasswordChangedData
  'pro-upgraded': ProUpgradedData
  'project-feedback': ProjectFeedbackData
  'path-ready': PathReadyData
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
  'email-changed': emailChanged,
  'account-delete-confirm': accountDeleteConfirm,
  'account-deleted': accountDeleted,
  'account-restored': accountRestored,
  'password-reset': passwordReset,
  'password-changed': passwordChanged,
  'pro-upgraded': proUpgraded,
  'project-feedback': projectFeedback,
  'path-ready': pathReady,
  'session-reminder': sessionReminder,
  'weekly-summary': weeklySummary,
}
