import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { Admin, IAdmin } from '../models/admin.model'
import { sendEmail, sendVerifyEmail } from '../utils/email.util'

export async function registerAdmin(email: string, password: string): Promise<IAdmin> {

    const adminCount = await Admin.countDocuments();

    if (adminCount > 0) {
        throw new Error('Admin account already exists. Only one admin is allowed.')
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

    await sendVerifyEmail(email, {
      verificationLink,
      expiryTime: '24 hours',
      companyName: process.env.COMPANY_NAME
    })

    return admin
    
}
export async function verifyEmail(token: string): Promise<IAdmin> {

  const admin = await Admin.findOne({
    token,
    tokenExpiry: { $gt: new Date() }
  })

  if (!admin) {
    throw new Error('Invalid or expired verification token.')
  }

  admin.isVerified = true
  admin.token = undefined
  admin.tokenExpiry = undefined
  await admin.save()

  return admin
}
export async function loginAdmin(email: string, password: string, request: any) {

  const admin = await Admin.findOne({ email })
  
  if (!admin) {
    throw new Error('Invalid credentials.')
  }

  if (!admin.isVerified) {
    throw new Error('Please verify your email first.')
  }

  const isPasswordValid = await bcrypt.compare(password, admin.password)
  if (!isPasswordValid) {
    throw new Error('Invalid credentials.')
  }

  const token = request.server.jwt.sign({ 
    adminId: admin._id, 
    email: admin.email,
    role: 'admin'
  })

  return { token, admin }
}
export async function forgetAuth(email: string): Promise<boolean> {

  const admin = await Admin.findOne({email})

  if (!admin) {
    throw new Error('Invalid email address.')
  }
  const token = crypto.randomBytes(32).toString('hex')
  const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)

  admin.token = token
  admin.tokenExpiry = tokenExpiry
  await admin.save()

  const verificationLink = `${process.env.FRONTEND_URL}/admin/reset-auth?token=${token}`

  await sendVerifyEmail(email, {
    verificationLink,
    expiryTime: '24 hours',
    companyName: process.env.COMPANY_NAME
  })

  return true
    
}
export async function resetAuth(email: string, password: string, token: string, request: any) {

  const admin = await Admin.findOne({
    token,
    tokenExpiry: { $gt: new Date() }
  })

  if (!admin) {
    throw new Error('Invalid or expired verification token.')
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  admin.email = email
  admin.password = hashedPassword
  admin.token = undefined
  admin.tokenExpiry = undefined
  await admin.save()

  const token2 = request.server.jwt.sign({ 
    adminId: admin._id, 
    email: admin.email,
    role: 'admin'
  })

  return { admin, token2 }
}