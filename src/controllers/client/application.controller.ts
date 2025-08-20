import { FastifyRequest, FastifyReply } from 'fastify'
import {
  createApplication,
  getUserApplications,
} from '../../services/application.service'
import { successResponse, badErrorResponse, serverErrorResponse, unauthorizedResponse } from '../../utils/response.util'
import { getUserProfile } from '../../services/profile.service'

// Submit application
export const appliedApplication = async (request: FastifyRequest, reply: FastifyReply) => {

  try {
    const userId = (request.user as any)?.userId
    if (!userId) {
      return unauthorizedResponse(reply, 'Unauthorized user')
    }

    const profile = await getUserProfile(userId)
    if (!profile) {
      return badErrorResponse(reply, 'Please fill up some profile information first')
    }

    const hasFirstPhaseData = profile.basic && profile.identity && profile.address &&
                      profile.emergencyContact && profile.other && profile.cvFile

    if (!hasFirstPhaseData) {
      return badErrorResponse(reply, 'Please fill up at least some profile information before applying')
    }

    const application = await createApplication(userId)

    return successResponse(reply, 'Applied successfully! Please wait for admin approval', application)

  } catch (error) {
    if (error instanceof Error && error.message.includes('You can apply again after')) {
      return badErrorResponse(reply, error.message)
    }
    console.error('Submit application error:', error)
    return serverErrorResponse(reply, 'Failed to submit application')
  }
}

// Get my application status
export const getMyApplication = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as any)?.userId
    if (!userId) {
      return badErrorResponse(reply, 'Unauthorized user')
    }

    const application = await getUserApplications(userId)

    if (!application) {
      return successResponse(reply, 'No application found', { 
        hasApplied: false,
        application: null 
      })
    }

    return successResponse(reply, 'Application status retrieved successfully', application)

  } catch (error) {
    console.error('Get application error:', error)
    return serverErrorResponse(reply, 'Failed to retrieve application')
  }
}
