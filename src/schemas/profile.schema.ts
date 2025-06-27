import { z } from 'zod'

const phoneValidation = z.string()
  .refine((phone) => {
    const cleanPhone = phone.replace(/[\s-]/g, '')
    
    if (cleanPhone.startsWith('+880')) {
      return /^\+880\d{10}$/.test(cleanPhone)
    }
    
    if (cleanPhone.startsWith('01')) {
      return /^01\d{9}$/.test(cleanPhone)
    }
    
    return false
  }, {
    message: 'Invalid phone number phone'
  })


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
    phoneNumber: phoneValidation,
  })
})

const isAtLeast18 = (dateStr: string) => {
  const dob = new Date(dateStr)
  const today = new Date()

  const age = today.getFullYear() - dob.getFullYear()
  const hasHadBirthdayThisYear =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate())

  const finalAge = hasHadBirthdayThisYear ? age : age - 1

  return finalAge >= 18
}

export const userProfileBasicInfoSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  dateOfBirth: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid date of birth',
    })
    .refine(isAtLeast18, {
      message: 'You must be at least 18 years old',
    }),
})

export const userProfileIdentitySchema = z.object({
  number: z.string().regex(/^\d{13}$|^\d{17}$/, 'Invalid document number')
})

export const emergencyContactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number')
})

export const addressSchema = z.object({
  present: z.object({
    district: z.string().min(1, 'Present district is required'),
    upazila: z.string().min(1, 'Present upazila is required'),
    street: z.string().min(1, 'Present street is required')
  }),
  permanent: z.object({
    district: z.string().min(1, 'Permanent district is required'),
    upazila: z.string().min(1, 'Permanent upazila is required'),
    street: z.string().min(1, 'Permanent street is required')
  })
})

export const otherSchema = z.object({
  fathersName: z.string().min(1, 'Father\'s name is required'),
  mothersName: z.string().min(1, 'Mother\'s name is required'),
  religion: z.string().min(1, 'Religion is required'),
  gender: z.enum(['male', 'female', 'other'], {
    errorMap: () => ({ message: 'Gender must be male, female, or other' })
  }),
  maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed'], {
    errorMap: () => ({ message: 'Invalid marital status' })
  })
})

export const userProfileEducationSchema = z.object({
  degree: z.string().min(2, 'Degree name must be at least 2 characters'),
  cgpaOrGpa: z.number()
    .min(0, 'CGPA/GPA cannot be negative')
    .max(5.0, 'CGPA/GPA cannot exceed 5.0')
    .optional(),
  passingYear: z.number()
    .min(1950, 'Passing year must be after 1950')
    .max(new Date().getFullYear() + 1, 'Passing year cannot be more than next year')
    .int('Passing year must be a valid year')
})

