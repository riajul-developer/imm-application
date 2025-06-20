import { FastifyRequest, FastifyReply } from 'fastify'
import { ZodError } from 'zod'
import * as authService from '../../services/client/auth.service'
import { sendOtpSchema, verifyOtpSchema } from '../../schemas/otp.schema'
import { badErrorResponse, serverErrorResponse, successResponse } from '../../utils/response.util'

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
    return successResponse(reply, 'OTP verified successfully', { token })
  } catch (error) {
    if (error instanceof ZodError) {
      return badErrorResponse(reply, 'Validation failed', error.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      })))
    }
    return serverErrorResponse(reply, 'Failed to verify OTP')
  }
}