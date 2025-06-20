import { FastifyInstance } from 'fastify'
import { Application } from '../models/Application'
import { UserProfile } from '../models/UserProfile'
import { sendEmail } from '../utils/email'

export async function applicationRoutes(fastify: FastifyInstance) {
  // Middleware to verify JWT
  fastify.addHook('preHandler', async (request, reply) => {
    try {
      await request.jwtVerify()
    } catch (err) {
      reply.send(err)
    }
  })
  
  // Submit application (Apply button)
  fastify.post('/apply', async (request, reply) => {
    try {
      // Check if user has a profile
      const userProfile = await UserProfile.findOne({ userId: request.user.userId })
      
      if (!userProfile) {
        return reply.status(400).send({ 
          error: 'Please complete your profile first before applying.' 
        })
      }
      
      // Check if user has any pending applications
      const pendingApplication = await Application.findOne({ 
        userId: request.user.userId, 
        status: 'pending' 
      })
      
      if (pendingApplication) {
        return reply.status(400).send({ 
          error: 'You already have a pending application. Please wait for review.' 
        })
      }
      
      // Create new application
      const application = new Application({
        userId: request.user.userId,
        userProfileId: userProfile._id
      })
      
      await application.save()
      
      // Send email notification to admin
      await sendEmail(
        process.env.ADMIN_EMAIL || 'admin@example.com',
        'New Application Submitted',
        `A new application has been submitted by ${userProfile.fullName}. 
        Application Number: ${application.applicationNumber}
        Phone: ${userProfile.phoneNumber}
        Email: ${userProfile.emailAddress}
        
        Please review in the admin dashboard.`
      )
      
      return { 
        success: true, 
        applicationNumber: application.applicationNumber,
        message: 'Application submitted successfully' 
      }
    } catch (error) {
      return reply.status(400).send({ error: error.message })
    }
  })
  
  // Get user's applications with profile data
  fastify.get('/my-applications', async (request, reply) => {
    try {
      const applications = await Application.find({ userId: request.user.userId })
        .populate('userProfileId')
        .sort({ submittedAt: -1 })
      
      return { applications }
    } catch (error) {
      return reply.status(500).send({ error: error.message })
    }
  })
  
  // Get application details
  fastify.get('/:applicationNumber', async (request, reply) => {
    try {
      const { applicationNumber } = request.params as { applicationNumber: string }
      
      const application = await Application.findOne({ 
        applicationNumber,
        userId: request.user.userId 
      }).populate('userProfileId')
      
      if (!application) {
        return reply.status(404).send({ error: 'Application not found' })
      }
      
      return { application }
    } catch (error) {
      return reply.status(500).send({ error: error.message })
    }
  })
  
  // Cancel application (only if pending)
  fastify.delete('/:applicationNumber', async (request, reply) => {
    try {
      const { applicationNumber } = request.params as { applicationNumber: string }
      
      const application = await Application.findOne({ 
        applicationNumber,
        userId: request.user.userId,
        status: 'pending'
      })
      
      if (!application) {
        return reply.status(404).send({ 
          error: 'Application not found or cannot be cancelled' 
        })
      }
      
      await Application.findByIdAndDelete(application._id)
      
      return { success: true, message: 'Application cancelled successfully' }
    } catch (error) {
      return reply.status(500).send({ error: error.message })
    }
  })
}
