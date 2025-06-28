import { FastifyRequest, FastifyReply } from 'fastify'
import { ZodError } from 'zod'
import * as adminService from '../../services/admin.service'
import {
  adminRegisterSchema,
  adminLoginSchema,
  verifyEmailSchema,
  sendEmailOtpSchema,
  verifyEmailOtpSchema,
  updateCredentialsSchema
} from '../../schemas/admin.schema'
import { badErrorResponse, serverErrorResponse, successResponse } from '../../utils/response.util'

export const registerAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { email, password } = adminRegisterSchema.parse(request.body)
    
    await adminService.registerAdmin(email, password)
    
    return successResponse(reply, 'Registered successfully. Please check your email for verification')
  } catch (error) {
    if (error instanceof ZodError) {
      return badErrorResponse(reply, 'Validation failed', error.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      })))
    }
        
    return serverErrorResponse(reply, 'Failed to register admin')
  }
}

export const verifyEmail = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { token } = verifyEmailSchema.parse(request.query)
    
    await adminService.verifyEmail(token)
    
    return successResponse(reply, 'Email verified successfully. You can now login.')
  } catch (error) {
    if (error instanceof ZodError) {
      return badErrorResponse(reply, 'Validation failed', error.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      })))
    }
    
    if (error instanceof Error) {
      return badErrorResponse(reply, error.message)
    }
    
    return serverErrorResponse(reply, 'Failed to verify email')
  }
}

export const loginAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { email, password } = adminLoginSchema.parse(request.body)
    
    const { token, admin } = await adminService.loginAdmin(email, password, request)
    
    return successResponse(reply, 'Login successful', { 
      token, 
      admin: {
        id: admin._id,
        email: admin.email,
        isEmailVerified: admin.isEmailVerified
      }
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return badErrorResponse(reply, 'Validation failed', error.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      })))
    }
    
    if (error instanceof Error) {
      return badErrorResponse(reply, error.message)
    }
    
    return serverErrorResponse(reply, 'Failed to login')
  }
}

export const sendEmailOtp = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { email } = sendEmailOtpSchema.parse(request.body)
    
    await adminService.sendEmailOtp(email)
    
    return successResponse(reply, 'OTP sent to your email')
  } catch (error) {
    if (error instanceof ZodError) {
      return badErrorResponse(reply, 'Validation failed', error.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      })))
    }
    
    if (error instanceof Error) {
      return badErrorResponse(reply, error.message)
    }
    
    return serverErrorResponse(reply, 'Failed to send OTP')
  }
}

export const verifyEmailOtp = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { email, otp } = verifyEmailOtpSchema.parse(request.body)
    
    await adminService.verifyEmailOtp(email, otp)
    
    return successResponse(reply, 'OTP verified successfully')
  } catch (error) {
    if (error instanceof ZodError) {
      return badErrorResponse(reply, 'Validation failed', error.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      })))
    }
    
    if (error instanceof Error) {
      return badErrorResponse(reply, error.message)
    }
    
    return serverErrorResponse(reply, 'Failed to verify OTP')
  }
}

export const updateCredentials = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { email, password, otp } = updateCredentialsSchema.parse(request.body)
    
    // Get current admin email from JWT token
    const decoded = request.server.jwt.verify(request.headers.authorization?.replace('Bearer ', '') || '') as any
    const currentEmail = decoded.email
    
    const { admin, token } = await adminService.updateCredentials(
      currentEmail, 
      otp, 
      email, 
      password,
      request
    )
    
    return successResponse(reply, 'Credentials updated successfully', { 
      token,
      admin: {
        id: admin?._id,
        email: admin?.email,
        isEmailVerified: admin?.isEmailVerified
      }
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return badErrorResponse(reply, 'Validation failed', error.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      })))
    }
    
    if (error instanceof Error) {
      return badErrorResponse(reply, error.message)
    }
    
    return serverErrorResponse(reply, 'Failed to update credentials')
  }
}