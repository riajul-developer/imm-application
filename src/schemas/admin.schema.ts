import { z } from 'zod'

export const adminRegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

export const adminLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required')
})

export const forgetAuthSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const resetAuthSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  token: z.string().length(64, 'Token must be exactly 64 characters long')
})