import { z } from 'zod'

export const userProfileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  dateOfBirth: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date'),
  phoneNumber: z.string().regex(/^(\+88)?01[3-9]\d{8}$/, 'Invalid phone number'),
  educationalQualifications: z.string().min(1, 'Educational qualification is required'),
  fatherName: z.string().min(2, 'Father name is required'),
  motherName: z.string().min(2, 'Mother name is required'),
  presentAddress: z.object({
    district: z.string().min(1, 'District is required'),
    upazila: z.string().min(1, 'Upazila is required'),
    address: z.string().min(1, 'Police station is required'),
  }),
  permanentAddress: z.object({
    district: z.string().min(1, 'District is required'),
    upazila: z.string().min(1, 'Upazila is required'),
    address: z.string().min(1, 'Address is required'),
  }),
  emailAddress: z.string().email('Invalid email address'),
  religion: z.string().min(1, 'Religion is required'),
  emergencyContact: z.object({
    name: z.string().min(2, 'Emergency contact name is required'),
    phoneNumber: z.string().regex(/^(\+88)?01[3-9]\d{8}$/, 'Invalid emergency contact phone')
  })
})


export const userProfileBasicInfoSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  dateOfBirth: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date'),
  email: z.string().email('Invalid email address'),
  phone: z.string(),
})