import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { Admin } from '../models/admin.model'
import { sendEmail } from '../utils/email.util'
import { sendSMS } from '../utils/sms.util'

export async function registerAdmin(email: string, password: string) {

    const adminCount = await Admin.countDocuments();

    if (adminCount > 0) {
        throw new Error('Admin account already exists. Only one admin is allowed')
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    
    const token = crypto.randomBytes(32).toString('hex')
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) 

    const admin = new Admin({
        email,
        password: hashedPassword,
        token,
        tokenExpiry
    })

    await admin.save()

    const verificationLink = `${process.env.FRONTEND_URL}/admin/verify-email?token=${token}`
    await sendEmail(
        email,
        'Verify Your Admin Account',
        `Click here to verify your account: ${verificationLink}. Link expires in 24 hours.`
    )

    return admin
}

export async function verifyEmail(token: string) {
  const admin = await Admin.findOne({
    emailVerificationToken: token,
    emailVerificationExpiry: { $gt: new Date() }
  })

  if (!admin) {
    throw new Error('Invalid or expired verification token')
  }

  admin.isEmailVerified = true
  admin.emailVerificationToken = undefined
  admin.emailVerificationExpiry = undefined
  await admin.save()

  return admin
}

export async function loginAdmin(email: string, password: string, request: any) {
  const admin = await Admin.findOne({ email })
  
  if (!admin) {
    throw new Error('Invalid credentials')
  }

  if (!admin.isEmailVerified) {
    throw new Error('Please verify your email first')
  }

  const isPasswordValid = await bcrypt.compare(password, admin.password)
  if (!isPasswordValid) {
    throw new Error('Invalid credentials')
  }

  // Generate JWT token
  const token = request.server.jwt.sign({ 
    adminId: admin._id, 
    email: admin.email,
    role: 'admin'
  })

  return { token, admin }
}

export async function sendEmailOtp(email: string) {
  const admin = await Admin.findOne({ email })
  if (!admin) {
    throw new Error('Admin not found')
  }

  if (!admin.isEmailVerified) {
    throw new Error('Please verify your email first')
  }

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  admin.otp = otp
  admin.otpExpiry = otpExpiry
  await admin.save()

  // Send OTP via email
  await sendEmail(
    email,
    'Your OTP Code',
    `Your OTP code is: ${otp}. Valid for 10 minutes.`
  )

  return true
}

export async function verifyEmailOtp(email: string, otp: string) {
  const admin = await Admin.findOne({ email })

  if (!admin || admin.otp !== otp || !admin.otpExpiry || admin.otpExpiry < new Date()) {
    throw new Error('Invalid or expired OTP')
  }

  // Clear OTP after verification
  admin.otp = undefined
  admin.otpExpiry = undefined
  await admin.save()

  return admin
}

export async function updateCredentials(
  currentEmail: string, 
  otp: string, 
  newEmail?: string, 
  newPassword?: string,
  request?: any
) {
  // First verify OTP
  const admin = await verifyEmailOtp(currentEmail, otp)

  const updateData: any = {}

  if (newEmail && newEmail !== currentEmail) {
    // Check if new email already exists
    const existingAdmin = await Admin.findOne({ email: newEmail })
    if (existingAdmin) {
      throw new Error('Email already exists')
    }
    updateData.email = newEmail.toLowerCase()
    updateData.isEmailVerified = false // Need to verify new email
    
    // Generate new verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex')
    const emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)
    
    updateData.emailVerificationToken = emailVerificationToken
    updateData.emailVerificationExpiry = emailVerificationExpiry

    // Send verification email to new address
    const verificationLink = `${process.env.FRONTEND_URL}/admin/verify-email?token=${emailVerificationToken}`
    await sendEmail(
      newEmail,
      'Verify Your New Email',
      `Click here to verify your new email: ${verificationLink}. Link expires in 24 hours.`
    )
  }

  if (newPassword) {
    updateData.password = await bcrypt.hash(newPassword, 12)
  }

  // Update admin
  const updatedAdmin = await Admin.findByIdAndUpdate(
    admin._id,
    updateData,
    { new: true }
  )

  // Generate new token if request is provided
  let newToken = null
  if (request && updatedAdmin) {
    newToken = request.server.jwt.sign({ 
      adminId: updatedAdmin._id, 
      email: updatedAdmin.email,
      role: 'admin'
    })
  }

  return { admin: updatedAdmin, token: newToken }
}