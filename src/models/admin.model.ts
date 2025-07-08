import { Schema, model, Document } from 'mongoose'

export interface IAdmin extends Document {
  email: string
  password: string
  isVerified: boolean
  token?: string
  tokenExpiry?: Date
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
  isVerified: {
    type: Boolean,
    default: false
  },
  token: String,
  tokenExpiry: Date
}, {
  timestamps: true
})

export const Admin = model<IAdmin>('Admin', adminSchema)