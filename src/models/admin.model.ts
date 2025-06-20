import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

export interface IAdmin extends mongoose.Document {
  email: string
  password: string
  createdAt: Date
  comparePassword(candidatePassword: string): Promise<boolean>
}

const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

adminSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password)
}

export const Admin = mongoose.model<IAdmin>('Admin', adminSchema)
