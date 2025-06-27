import { FastifyRequest, FastifyReply } from 'fastify'
import { checkUserCanCompleteProfile } from '../services/application.service'
import { badErrorResponse, serverErrorResponse } from '../utils/response.util'

export const checkApproval = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as any)?.userId
    
    const canComplete = await checkUserCanCompleteProfile(userId)
    
    if (!canComplete) {
      return badErrorResponse(reply, 'Please wait for application approval before completing profile')
    }
  } catch (error) {
    console.error('Check approval error:', error)
    return serverErrorResponse(reply, 'Failed to check approval status')
  }
}