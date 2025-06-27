export const reviewApplicationAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const adminUserId = (request.user as any)?.userId
    const { id } = (request.params as any)

    if (!adminUserId) {
      return badErrorResponse(reply, 'Unauthorized user')
    }

    const { status, adminNotes, rejectionReason } = reviewApplicationSchema.parse(request.body)

    const application = await reviewApplication(id, adminUserId, status, adminNotes, rejectionReason)

    const message = status === 'approved' 
      ? 'Application approved successfully' 
      : 'Application rejected successfully'

    return successResponse(reply, message, application)

  } catch (error) {
    if (error instanceof ZodError) {
      return badErrorResponse(reply, 'Validation failed', error.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      })))
    }
    if (error instanceof Error && (
      error.message === 'Application not found' || 
      error.message === 'Application already reviewed'
    )) {
      return badErrorResponse(reply, error.message)
    }
    console.error('Review application error:', error)
    return serverErrorResponse(reply, 'Failed to review application')
  }
}

// Get application statistics (Admin only)
export const getApplicationStatsAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const stats = await getApplicationStats()

    return successResponse(reply, 'Application statistics retrieved', stats)

  } catch (error) {
    console.error('Get application stats error:', error)
    return serverErrorResponse(reply, 'Failed to retrieve application statistics')
  }
}