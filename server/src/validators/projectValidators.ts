import { z } from 'zod'
import { PROJECT_STATUSES } from '../domain/index.js'
import { listQuerySchema, objectId } from './common.js'

export const projectTaskSchema = z.strictObject({
  id: z.string().min(1).max(60),
  title: z.string().trim().min(1).max(200),
  detail: z.string().max(1000).default(''),
})

export const projectFeedbackSchema = z.strictObject({
  strengths: z.array(z.string().max(500)).default([]),
  improve: z.array(z.string().max(500)).default([]),
  note: z.string().max(2000).default(''),
})

export const createProjectSchema = z.strictObject({
  title: z.string().trim().min(1).max(160),
  description: z.string().max(2000).default(''),
  pathId: objectId.nullable().default(null),
  level: z.string().max(80).default(''),
  estHours: z.number().min(0).default(0),
  objectives: z.array(z.string().max(300)).default([]),
  tasks: z.array(projectTaskSchema).default([]),
  deliverables: z.array(z.string().max(300)).default([]),
  related: z.array(z.string().max(120)).default([]),
})

export const updateProjectSchema = z.strictObject({
  title: z.string().trim().min(1).max(160).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
  level: z.string().max(80).optional(),
  estHours: z.number().min(0).optional(),
  objectives: z.array(z.string().max(300)).optional(),
  tasks: z.array(projectTaskSchema).optional(),
  deliverables: z.array(z.string().max(300)).optional(),
  related: z.array(z.string().max(120)).optional(),
  completedTaskIds: z.array(z.string().max(60)).optional(),
  submitted: z.boolean().optional(),
  reviewed: z.boolean().optional(),
  submittedAt: z.string().max(40).nullable().optional(),
  feedback: projectFeedbackSchema.nullable().optional(),
})

export const listProjectsQuery = listQuerySchema({
  status: z.enum(PROJECT_STATUSES).optional(),
  pathId: objectId.optional(),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>