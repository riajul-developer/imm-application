import { z } from 'zod'

export const sendOtpSchema = z.object({
  phoneNumber: z.string().regex(/^(\+88)?01[3-9]\d{8}$/, 'Invalid Bangladeshi phone number')
})

export const verifyOtpSchema = z.object({
  phoneNumber: z.string().regex(/^(\+88)?01[3-9]\d{8}$/, 'Invalid Bangladeshi phone number'),
  otp: z.string().length(6, 'OTP must be 6 digits')
})

export const applicationSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  dateOfBirth: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date'),
  phoneNumber: z.string().regex(/^(\+88)?01[3-9]\d{8}$/, 'Invalid phone number'),
  educationalQualifications: z.string().min(1, 'Educational qualification is required'),
  nationalIdCard: z.string().min(10, 'National ID must be at least 10 digits'),
  fatherName: z.string().min(2, 'Father name is required'),
  motherName: z.string().min(2, 'Mother name is required'),
  presentAddress: z.object({
    village: z.string().min(1, 'Village is required'),
    postOffice: z.string().min(1, 'Post office is required'),
    policeStation: z.string().min(1, 'Police station is required'),
    district: z.string().min(1, 'District is required')
  }),
  permanentAddress: z.object({
    village: z.string().min(1, 'Village is required'),
    postOffice: z.string().min(1, 'Post office is required'),
    policeStation: z.string().min(1, 'Police station is required'),
    district: z.string().min(1, 'District is required')
  }),
  emailAddress: z.string().email('Invalid email address'),
  religion: z.string().min(1, 'Religion is required'),
  emergencyContact: z.object({
    name: z.string().min(2, 'Emergency contact name is required'),
    phoneNumber: z.string().regex(/^(\+88)?01[3-9]\d{8}$/, 'Invalid emergency contact phone')
  })
})

export const adminLoginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})