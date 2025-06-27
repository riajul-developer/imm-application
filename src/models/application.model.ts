import mongoose from 'mongoose'

export type ApplicationStatus = 'submitted' | 'under-review' | 'approved' | 'rejected'

export interface IApplication extends mongoose.Document {
  userId: mongoose.Types.ObjectId
  status: ApplicationStatus
  submittedAt: Date
  reviewedAt?: Date
  reviewedBy?: mongoose.Types.ObjectId
  rejectionReason?: string
  adminNotes?: string
  createdAt: Date
  updatedAt: Date
}

const applicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['submitted', 'under-review', 'approved', 'rejected'],
      default: 'submitted'
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    reviewedAt: {
      type: Date
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rejectionReason: {
      type: String,
      trim: true
    },
    adminNotes: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
)

applicationSchema.index({ userId: 1 })
applicationSchema.index({ status: 1 })
applicationSchema.index({ submittedAt: -1 })

export const Application = mongoose.model<IApplication>('Application', applicationSchema)
