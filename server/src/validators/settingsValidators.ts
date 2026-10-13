import { z } from 'zod'
import { INTENSITIES, LEARNING_FORMATS, REMINDER_DAYS, WEEKLY_HOURS } from '../domain/index.js'

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
    restDay: z.boolean().optional(),
    projectFeedback: z.boolean().optional(),
    pathUpdates: z.boolean().optional(),
    productNews: z.boolean().optional(),
    weeklyHours: z.enum(WEEKLY_HOURS).optional(),
    intensity: z.enum(INTENSITIES).optional(),
    formats: z.array(z.enum(LEARNING_FORMATS)).max(6).optional(),
    sessionLength: z.coerce.number().int().min(5).max(240).optional(),
  })
  .strict()

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>
