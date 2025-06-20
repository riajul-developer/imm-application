import { FastifyInstance } from 'fastify'
import { UserProfile } from '../models/profile.model'
import { applicationSchema } from '../schemas/validation'
import { uploadFiles } from '../utils/fileUpload.util'
import { serverErrorResponse, successResponse, unauthorizedResponse } from '../utils/response.util'

export async function profileRoutes(fastify: FastifyInstance) {
  // Middleware to verify JWT
  fastify.addHook('preHandler', async (request, reply) => {
    try {
      await request.jwtVerify()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unauthorized access';
      return unauthorizedResponse(reply, errorMessage)  
    }
  })
  
  // Get user profile
  fastify.get('/me', async (request, reply) => {
    try {
      const user = request.user as {phoneNumber: number, userId: string }
      const profile = await UserProfile.findOne({ userId: user.userId })

      return successResponse(reply, 'Profile retrieved successfully', { phoneNumber: user.phoneNumber, ...profile })

    } catch (error) {
      return serverErrorResponse(reply)
    }
  })
  
  // Create or update user profile
  fastify.post('/update', async (request, reply) => {
    try {
      const fields: { [key: string]: any } = {};

      // Parse nested objects
      const parsedFields = {
        ...fields,
        presentAddress: JSON.parse(fields['presentAddress'] || '{}'),
        permanentAddress: JSON.parse(fields['permanentAddress'] || '{}'),
        emergencyContact: JSON.parse(fields['emergencyContact'] || '{}')
      };

      const validatedData = applicationSchema.parse(parsedFields);

      // Update or create profile
      const user = request.user as { userId: string };
      const profile = await UserProfile.findOneAndUpdate(
        { userId: user.userId },
        {
          ...validatedData,
          userId: user.userId,
          documents: files
        },
        { upsert: true, new: true }
      );

      return { success: true, profile, message: 'Profile updated successfully' }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
      return reply.status(400).send({ error: errorMessage })
    }
  })
  
  // Delete profile
  fastify.delete('/delete', async (request, reply) => {
    try {
      const user = request.user as { userId: string }
      const profile = await UserProfile.findOneAndDelete({ userId: user.userId })
      
      if (!profile) {
        return reply.status(404).send({ error: 'Profile not found' })
      }
      
      return { success: true, message: 'Profile deleted successfully' }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
      return reply.status(500).send({ error: errorMessage })
    }
  })
}