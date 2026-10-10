import { z } from 'zod'
import { PASSWORD_POLICY } from '../config/auth.js'

const email = z
  .email('A valid email address is required.')
  .refine((value) => value.length <= 254, 'Email is too long.')
  .transform((value) => value.toLowerCase().trim())

export const emailSchema = email

export const passwordSchema = z
  .string('Password is required.')
  .max(128, 'Password is too long.')
  .superRefine((value, ctx) => {
    for (const rule of PASSWORD_POLICY) {
      if (!rule.test(value)) {
        ctx.addIssue({ code: 'custom', message: rule.message })
      }
    }
  })

export const registerSchema = z.strictObject({
  firstName: z.string('First name is required.').trim().min(1, 'First name is required.').max(80, 'First name is too long.'),
  lastName: z.string().trim().max(80, 'Last name is too long.').optional(),
  email: emailSchema,
  password: passwordSchema,
})

export const loginSchema = z.strictObject({
  email: emailSchema,
  password: z.string('Password is required.').min(1, 'Password is required.').max(128, 'Password is too long.'),
})

export const updateMeSchema = z.strictObject({
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z
    .string()
    .trim()
    .max(80)
    .transform((value) => (value.length === 0 ? null : value))
    .nullable()
    .optional(),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type UpdateMeInput = z.infer<typeof updateMeSchema>