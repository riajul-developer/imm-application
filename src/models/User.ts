import mongoose from 'mongoose'

export interface IUser extends mongoose.Document {
  phoneNumber: string
  otp?: string
  otpExpiry?: Date
  isVerified: boolean
  createdAt: Date
}

const userSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true
  },
  otp: String,
  otpExpiry: Date,
  isVerified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

export const User = mongoose.model<IUser>('User', userSchema)
