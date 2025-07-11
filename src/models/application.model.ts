import mongoose from 'mongoose'

export type ApplicationStatus = 'submitted' | 'under-review' | 'approved' | 'rejected'

export interface IApplication extends mongoose.Document {
  userId: mongoose.Types.ObjectId
  status: ApplicationStatus
  submittedAt: Date
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
