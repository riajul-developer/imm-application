import { FastifyRequest, FastifyReply } from 'fastify'
import { ZodError } from 'zod'
import * as authService from '../../services/auth.service'
import { sendOtpSchema, verifyOtpSchema } from '../../schemas/otp.schema'
import { badErrorResponse, serverErrorResponse, successResponse, unauthorizedResponse } from '../../utils/response.util'
import { checkCanApply, getUserProfile, needAdditionalInfo } from '../../services/profile.service'
import { application } from '../../services/application.service'

export const sendOtp = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { phoneNumber } = sendOtpSchema.parse(request.body)
    await authService.sendOtp(phoneNumber)
    return successResponse(reply, 'OTP sent successfully')
  } catch (error) {
    if (error instanceof ZodError) {
      return badErrorResponse(reply, 'Validation failed', error.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      })))
    }
    return serverErrorResponse(reply, 'Failed to send OTP')
  }
}

export const verifyOtp = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { phoneNumber, otp } = verifyOtpSchema.parse(request.body)
    const token = await authService.verifyOtp(phoneNumber, otp, request)

    const decoded: any = request.server.jwt.verify(token)
    const userId = decoded.userId

    const profile = await getUserProfile(userId);
    const canApplication = await checkCanApply(userId);
    const additionalInfo = await needAdditionalInfo(userId);
    const myApplication = await application(userId);


    if (!profile) {
      return successResponse(reply, 'OTP verified successfully', { token })
    }
    
    const responseData = {
      canApplication,
      needAdditionalInfo: additionalInfo,
      ...profile.toObject()
    }

    if (myApplication) {
      responseData.application = myApplication
    }

    return successResponse(reply, 'OTP verified successfully', { token, profile : responseData })
  } catch (error) {

    if (error instanceof ZodError) {
      return badErrorResponse(reply, 'Validation failed', error.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      })))
    }
    if (error instanceof Error) {
      return unauthorizedResponse(reply, error.message)
    }
    return serverErrorResponse(reply, 'Failed to verify OTP')
  }
}