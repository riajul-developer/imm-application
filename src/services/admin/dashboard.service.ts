import { Application } from "../../models/application.model"


export async function fetchDashboardStats() {
  const totalApplications = await Application.countDocuments()
  const pendingApplications = await Application.countDocuments({ status: 'pending' })
  const approvedApplications = await Application.countDocuments({ status: 'approved' })
  const rejectedApplications = await Application.countDocuments({ status: 'rejected' })

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const recentApplications = await Application.countDocuments({
    submittedAt: { $gte: sevenDaysAgo }
  })

  return {
    total: totalApplications,
    pending: pendingApplications,
    approved: approvedApplications,
    rejected: rejectedApplications,
    recentApplications
  }
}
