import { z } from 'zod'
import { REMINDER_DAYS } from '../domain/index.js'

/** `PATCH /settings` — every field optional; the body is merged over what exists. */
export const updateSettingsSchema = z
  .object({
    dailyReminder: z.boolean().optional(),
    weeklySummary: z.boolean().optional(),
    timezone: z.string().min(1).max(60).optional(),
    reminderTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use 24h HH:MM, e.g. 19:00.')
      .optional(),
    reminderDays: z.array(z.enum(REMINDER_DAYS)).max(7).optional(),
  })
  .strict()

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>
