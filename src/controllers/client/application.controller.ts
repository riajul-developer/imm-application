import { FastifyRequest, FastifyReply } from 'fastify'
import {
  createApplication,
  getUserApplications,
  checkUserCanCompleteProfile,
} from '../../services/application.service'
import { successResponse, badErrorResponse, serverErrorResponse } from '../../utils/response.util'
import { getUserProfile } from '../../services/profile.service'

// Submit application
export const submitApplication = async (request: FastifyRequest, reply: FastifyReply) => {

  try {
    const userId = (request.user as any)?.userId
    if (!userId) {
      return badErrorResponse(reply, 'Unauthorized user')
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

    return successResponse(reply, 'Submitted successfully! Please wait for admin approval', application)

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

// Check if user can complete profile
export const canCompleteProfile = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as any)?.userId
    if (!userId) {
      return badErrorResponse(reply, 'Unauthorized user')
    }

    const application = await getUserApplication(userId)

    if (!application) {
      return successResponse(reply, 'Profile completion status', { 
        canComplete: false,
        reason: 'No application submitted'
      })
    }

    const canComplete = await checkUserCanCompleteProfile(userId)

    return successResponse(reply, 'Profile completion status', {
      canComplete,
      applicationStatus: application.status,
      reason: canComplete ? 'You can complete your profile' : 
              application.status === 'rejected' ? 'Application rejected' :
              'Application pending approval'
    })

  } catch (error) {
    console.error('Check profile completion error:', error)
    return serverErrorResponse(reply, 'Failed to check profile completion status')
  }
}