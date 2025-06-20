import { FastifyInstance } from 'fastify'
import { UserProfile } from '../models/UserProfile'
import { applicationSchema } from '../schemas/validation'
import { uploadFiles } from '../utils/fileUpload'

export async function profileRoutes(fastify: FastifyInstance) {
  // Middleware to verify JWT
  fastify.addHook('preHandler', async (request, reply) => {
    try {
      await request.jwtVerify()
    } catch (err) {
      reply.send(err)
    }
  })
  
  // Get user profile
  fastify.get('/me', async (request, reply) => {
    try {
      const user = request.user as { userId: string }
      const profile = await UserProfile.findOne({ userId: user.userId })
      
      if (!profile) {
        return { profile: null, message: 'Profile not found' }
      }
      
      return { profile }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
      return reply.status(500).send({ error: errorMessage })
    }
  })
  
  // Create or update user profile
  fastify.post('/update', async (request, reply) => {
    try {
      const files: { [key: string]: any } = {};
      const fields: { [key: string]: any } = {};

      // Parse multipart form data
      if (request.isMultipart()) {
        const parts = request.parts();
        for await (const part of parts) {
          if (part.type === 'file') {
            files[part.fieldname] = await uploadFiles(part);
          } else {
            fields[part.fieldname] = part.value;
          }
        }
      } else {
        Object.assign(fields, request.body);
      }

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