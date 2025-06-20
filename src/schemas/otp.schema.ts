import { z } from 'zod'

export const sendOtpSchema = z.object({
  phoneNumber: z.string().regex(/^(\+88)?01[3-9]\d{8}$/, 'Invalid Bangladeshi phone number')
})

export const verifyOtpSchema = z.object({
  phoneNumber: z.string().regex(/^(\+88)?01[3-9]\d{8}$/, 'Invalid Bangladeshi phone number'),
  otp: z.string().length(6, 'OTP must be 6 digits')
})
