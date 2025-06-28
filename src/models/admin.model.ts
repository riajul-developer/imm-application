import { Schema, model, Document } from 'mongoose'

interface IAdmin extends Document {
  email: string
  password: string
  isEmailVerified: boolean
  token?: string
  tokenExpiry?: Date
  otp?: string
  otpExpiry?: Date
  createdAt: Date
  updatedAt: Date
}

const adminSchema = new Schema<IAdmin>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  token: String,
  tokenExpiry: Date,
  otp: String,
  otpExpiry: Date
}, {
  timestamps: true
})

export const Admin = model<IAdmin>('Admin', adminSchema)