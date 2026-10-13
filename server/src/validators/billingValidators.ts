import { z } from 'zod'

export const captureOrderSchema = z.strictObject({
  orderId: z.string('Order id is required.').trim().min(5).max(64),
})

export const saveAiKeySchema = z.strictObject({
  provider: z.literal('deepseek', 'Only DeepSeek keys are supported right now.'),
  key: z.string('API key is required.').trim().min(10).max(200),
})

export type CaptureOrderInput = z.infer<typeof captureOrderSchema>
export type SaveAiKeyInput = z.infer<typeof saveAiKeySchema>
