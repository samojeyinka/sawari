import { z } from 'zod'
import { PROJECT_STATUSES } from '../domain/index.js'
import { isoDateTime, listQuerySchema, objectId } from './common.js'

export const projectTaskSchema = z.strictObject({
  id: z.string().min(1).max(60),
  title: z.string().trim().min(1).max(200),
  detail: z.string().max(1000).default(''),
})

export const projectFeedbackSchema = z.strictObject({
  strengths: z.array(z.string().max(500)).max(20).default([]),
  improve: z.array(z.string().max(500)).max(20).default([]),
  note: z.string().max(2000).default(''),
})

export const createProjectSchema = z.strictObject({
  title: z.string().trim().min(1).max(160),
  description: z.string().max(2000).default(''),
  pathId: objectId.nullable().default(null),
  level: z.string().max(80).default(''),
  estHours: z.number().min(0).default(0),
  objectives: z.array(z.string().max(300)).max(20).default([]),
  tasks: z.array(projectTaskSchema).max(100).default([]),
  deliverables: z.array(z.string().max(300)).max(20).default([]),
  related: z.array(z.string().max(120)).max(20).default([]),
})

export const updateProjectSchema = z.strictObject({
  title: z.string().trim().min(1).max(160).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
  level: z.string().max(80).optional(),
  estHours: z.number().min(0).optional(),
  objectives: z.array(z.string().max(300)).max(20).optional(),
  tasks: z.array(projectTaskSchema).max(100).optional(),
  deliverables: z.array(z.string().max(300)).max(20).optional(),
  related: z.array(z.string().max(120)).max(20).optional(),
  completedTaskIds: z.array(z.string().max(60)).max(200).optional(),
  submitted: z.boolean().optional(),
  reviewed: z.boolean().optional(),
  submittedAt: isoDateTime.nullable().optional(),
  submissionNote: z.string().max(2000).nullable().optional(),
  feedback: projectFeedbackSchema.nullable().optional(),
})

export const listProjectsQuery = listQuerySchema({
  status: z.enum(PROJECT_STATUSES).optional(),
  pathId: objectId.optional(),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>