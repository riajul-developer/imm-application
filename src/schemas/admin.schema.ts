import { z } from 'zod'

export const adminRegisterSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

export const adminLoginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required')
})

export const sendEmailOtpSchema = z.object({
  email: z.string().email('Invalid email')
})

export const verifyEmailOtpSchema = z.object({
  email: z.string().email('Invalid email'),
  otp: z.string().length(6, 'OTP must be 6 digits')
})

export const updateCredentialsSchema = z.object({
  email: z.string().email('Invalid email').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  otp: z.string().length(6, 'OTP must be 6 digits')
})