import { z } from 'zod'

export const reviewApplicationSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  adminNotes: z.string().optional(),
  rejectionReason: z.string().optional()
})

export const getApplicationsQuerySchema = z.object({
  status: z.enum(['submitted', 'under-review', 'approved', 'rejected']).optional(),
  page: z.string().transform(val => parseInt(val)).default('1'),
  limit: z.string().transform(val => parseInt(val)).default('10')
})

export const updateStatusSchema = z.object({
  status: z.enum(['submitted', 'under-review', 'approved', 'rejected']),
  adminNotes: z.string().optional(),
  rejectionReason: z.string().optional()
});