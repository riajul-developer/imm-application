import { z } from 'zod'

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

export const userBasicInfoSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  educationLevel: z.string().min(2, 'Education level must be at least 2 characters'),
  gender: z.enum(['male', 'female', 'undisclosed'], {
    errorMap: () => ({ message: 'Gender must be male, female, or undisclosed' })
  }),
  dateOfBirth: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid date of birth',
    })
    .refine(isAtLeast18, {
      message: 'You must be at least 18 years old',
    }),
})

export const userIdentitySchema = z.object({
  number: z.string().min(1, 'Document number is required')
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
})

export const uploadFileSchema = z.object({
  name: z.enum(['cv', 'testimonial', 'myVerified', 'commitment']),
})

export const workInfoSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  projectName: z.string().min(1, 'Project name is required'),
  branch: z.string().min(1, 'Branch is required'),
  shift: z.string().min(1, 'Shift is required'),
  reference: z.string().optional() 
});


export const userEducationSchema = z.object({
  degree: z.string().min(2, 'Degree name must be at least 2 characters'),
  cgpaOrGpa: z.union([
      z.coerce.number()
      .min(0, 'CGPA/GPA cannot be negative')
      .max(5.0, 'CGPA/GPA cannot exceed 5.0'),
      z.literal('').transform(() => undefined)
    ]).optional(),
  passingYear: z.coerce.number()
    .int('Passing year must be a valid year')
    .min(1950, 'Passing year must be after 1950')
    .max(new Date().getFullYear() + 1, 'Passing year cannot be more than next year')
});

export const userTestimonialSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters')
});

export const userMyVerifiedSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters')
});

export const userCommitmentNoteSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters')
});