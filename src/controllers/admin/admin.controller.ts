import { FastifyRequest, FastifyReply } from 'fastify'
import { ZodError } from 'zod'
import * as adminService from '../../services/admin.service'
import {
  adminRegisterSchema,
  adminLoginSchema,
  verifyEmailSchema,
  resetAuthSchema,
  forgetAuthSchema
} from '../../schemas/admin.schema'
import { badErrorResponse, serverErrorResponse, successResponse } from '../../utils/response.util'

export const registerAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { email, password } = adminRegisterSchema.parse(request.body)
    
    await adminService.registerAdmin(email, password)
    
    return successResponse(reply, 'Registered successfully. Please check your email for verification!')
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

    return serverErrorResponse(reply, 'Failed to register admin')
  }
}

export const verifyEmail = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { token } = verifyEmailSchema.parse(request.query)
    
    await adminService.verifyEmail(token)
    
    return successResponse(reply, 'Email verified successfully. You can now login.');

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
    
    return successResponse(reply, 'Login successfully.', { 
      token, 
      admin: {
        id: admin._id,
        email: admin.email,
        isVerified: admin.isVerified
      }
    })
  } catch (error) {

    if (error instanceof ZodError) {
      return badErrorResponse(reply, 'Validation failed.', error.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      })))
    }
    
    if (error instanceof Error) {
      return badErrorResponse(reply, error.message)
    }
    
    return serverErrorResponse(reply, 'Failed to login.')
  }
}
export const forgetAuth = async (request: FastifyRequest, reply: FastifyReply) => {

  try {
    const { email } = forgetAuthSchema.parse(request.body)

    await adminService.forgetAuth(email)

    return successResponse(reply, 'Email sent successfully. Please check your email for verification!');

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

    return serverErrorResponse(reply, 'Failed to sent Email');

  }

}
export const resetAuth = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { email, password, token } = resetAuthSchema.parse(request.body)
    
    await adminService.resetAuth(
      email, 
      password,
      token
    )
    
    return successResponse(reply, 'Reset successfully. Please check your email for verification!')

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
    
    return serverErrorResponse(reply, 'Failed to reset credential.')
  }
}
