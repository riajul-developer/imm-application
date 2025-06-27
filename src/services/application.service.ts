import { Application, IApplication } from '../models/application.model'
import { getUserProfile } from './profile.service'

export const createApplication = async (userId: string): Promise<IApplication> => {

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  
  const recentApplication = await Application.findOne({
    userId,
    submittedAt: { $gte: twentyFourHoursAgo }
  }).sort({ submittedAt: -1 })

  if (recentApplication) {
    const nextAllowedTime = new Date(recentApplication.submittedAt.getTime() + 24 * 60 * 60 * 1000)
    const hoursLeft = Math.ceil((nextAllowedTime.getTime() - Date.now()) / (1000 * 60 * 60))
    
    throw new Error(`You can apply again after ${hoursLeft} hours`)
  }

  const application = new Application({
    userId,
    status: 'submitted'
  })

  return await application.save()
}

export const getUserApplications = async (userId: string): Promise<IApplication[] | null> => {
  return await Application.find({ userId })
}

export const checkUserCanCompleteProfile = async (userId: string): Promise<boolean> => {
  const application = await Application.findOne({ userId })
  return application?.status === 'approved'
}

export const getAllApplications = async (
  filter: any = {},
  page: number = 1,
  limit: number = 10
) => {
  const skip = (page - 1) * limit

  const applications = await Application.find(filter)
    .populate('userId', 'phoneNumber')
    .populate('reviewedBy', 'name')
    .sort({ submittedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

  const total = await Application.countDocuments(filter)

  return {
    applications,
    pagination: {
      current: page,
      total: Math.ceil(total / limit),
      hasNext: skip + applications.length < total,
      hasPrev: page > 1
    }
  }
}

export const getApplicationById = async (id: string) => {
  const application = await Application.findById(id)
    .populate('userId', 'phoneNumber')
    .populate('reviewedBy', 'name')

  if (!application) {
    throw new Error('Application not found')
  }

  const profile = await getUserProfile(application.userId.toString())

  return {
    application,
    profile
  }
}

export const reviewApplication = async (
  id: string,
  adminUserId: string,
  status: 'approved' | 'rejected',
  adminNotes?: string,
  rejectionReason?: string
): Promise<IApplication> => {
  const application = await Application.findById(id)

  if (!application) {
    throw new Error('Application not found')
  }

  if (application.status === 'approved' || application.status === 'rejected') {
    throw new Error('Application already reviewed')
  }

  application.status = status
  application.reviewedAt = new Date()
  application.reviewedBy = adminUserId as any
  application.adminNotes = adminNotes
  
  if (status === 'rejected' && rejectionReason) {
    application.rejectionReason = rejectionReason
  }

  return await application.save()
}

export const getApplicationStats = async () => {
  const stats = await Application.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ])

  const total = await Application.countDocuments()

  return {
    total,
    submitted: stats.find(s => s._id === 'submitted')?.count || 0,
    'under-review': stats.find(s => s._id === 'under-review')?.count || 0,
    approved: stats.find(s => s._id === 'approved')?.count || 0,
    rejected: stats.find(s => s._id === 'rejected')?.count || 0
  }
}