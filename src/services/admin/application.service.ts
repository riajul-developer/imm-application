export async function fetchApplications(query: any) {
  const { name, phone, email, education, startDate, endDate, page = 1, limit = 10, status } = query
  const filter: any = {}

  let applications = await Application.find(filter)
    .populate({ path: 'userProfileId', model: 'UserProfile' })
    .sort({ submittedAt: -1 })

  if (name || phone || email || education) {
    applications = applications.filter(app => {
      const profile = app.userProfileId as any
      if (!profile) return false
      if (name && !profile.fullName.toLowerCase().includes(name.toLowerCase())) return false
      if (phone && !profile.phoneNumber.includes(phone)) return false
      if (email && !profile.emailAddress.toLowerCase().includes(email.toLowerCase())) return false
      if (education && !profile.educationalQualifications.toLowerCase().includes(education.toLowerCase())) return false
      return true
    })
  }

  if (status && ['pending', 'approved', 'rejected'].includes(status)) {
    applications = applications.filter(app => app.status === status)
  }

  if (startDate || endDate) {
    applications = applications.filter(app => {
      const submittedDate = new Date(app.submittedAt)
      if (startDate && submittedDate < new Date(startDate)) return false
      if (endDate && submittedDate > new Date(endDate)) return false
      return true
    })
  }

  const total = applications.length
  const startIndex = (page - 1) * limit
  const paginatedApplications = applications.slice(startIndex, startIndex + parseInt(limit))

  return {
    applications: paginatedApplications,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    total
  }
}

export async function fetchApplicationById(id: string) {
  return await Application.findById(id)
    .populate('userProfileId')
    .populate('userId', 'phoneNumber')
}

export async function updateApplicationStatus(id: string, status: 'approved' | 'rejected', user: any) {
  if (!['approved', 'rejected'].includes(status)) {
    throw new Error('Invalid status')
  }

  const application = await Application.findByIdAndUpdate(
    id,
    {
      status,
      reviewedAt: new Date(),
      reviewedBy: user.email
    },
    { new: true }
  ).populate('userProfileId')

  if (!application) {
    throw new Error('Application not found')
  }

  const profile = application.userProfileId as any
  const message = status === 'approved'
    ? `Congratulations ${profile.fullName}! Your application (${application.applicationNumber}) has been approved.`
    : `Dear ${profile.fullName}, Your application (${application.applicationNumber}) has been rejected. Please contact admin for more details.`

  await sendSMS(profile.phoneNumber, message)

  return { success: true, message: `Application ${status} successfully` }
}