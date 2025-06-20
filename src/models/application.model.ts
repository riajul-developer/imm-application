import mongoose from 'mongoose'

export interface IApplication extends mongoose.Document {
  userId: mongoose.Types.ObjectId
  userProfileId: mongoose.Types.ObjectId
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: Date
  reviewedAt?: Date
  reviewedBy?: string
  applicationNumber: string
}

const applicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userProfileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserProfile',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: Date,
  reviewedBy: String,
  applicationNumber: {
    type: String,
    unique: true,
    required: true
  }
})

// Generate application number before saving
applicationSchema.pre('save', async function(next) {
  if (!this.applicationNumber) {
    const count = await mongoose.model('Application').countDocuments()
    this.applicationNumber = `APP${Date.now()}${(count + 1).toString().padStart(4, '0')}`
  }
  next()
})

export const Application = mongoose.model<IApplication>('Application', applicationSchema)
