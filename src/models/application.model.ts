import mongoose from 'mongoose'

export type ApplicationStatus = 'applied' | 'scheduled' | 'selected' | 'under-review' | 'submitted'

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
      enum: ['applied', 'scheduled', 'selected', 'under-review', 'submitted'],
      default: 'applied'
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
