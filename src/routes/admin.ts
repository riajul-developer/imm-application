import { FastifyInstance } from 'fastify'
import { Admin } from '../models/Admin'
import { Application } from '../models/Application'
import { UserProfile } from '../models/UserProfile'
import { adminLoginSchema } from '../schemas/validation'
import { sendSMS } from '../utils/sms'

export async function adminRoutes(fastify: FastifyInstance) {
  // Admin login
  fastify.post('/login', async (request, reply) => {
    try {
      const { email, password } = adminLoginSchema.parse(request.body)
      
      const admin = await Admin.findOne({ email })
      if (!admin || !(await admin.comparePassword(password))) {
        return reply.status(401).send({ error: 'Invalid credentials' })
      }
      
      const token = fastify.jwt.sign({ adminId: admin._id, email, role: 'admin' })
      
      return { success: true, token, message: 'Login successful' }
    } catch (error) {
      return reply.status(400).send({ error: error.message })
    }
  })
  
  // Middleware for admin routes
  fastify.addHook('preHandler', async (request, reply) => {
    if (request.url === '/api/admin/login') return
    
    try {
      await request.jwtVerify()
      if (request.user.role !== 'admin') {
        return reply.status(403).send({ error: 'Admin access required' })
      }
    } catch (err) {
      reply.send(err)
    }
  })
  
  // Get all applications with filters and profile data
  fastify.get('/applications', async (request, reply) => {
    try {
      const { name, phone, email, education, startDate, endDate, page = 1, limit = 10, status } = request.query as any
      
      const filter: any = {}
      
      // For filtering by user profile data, we need to use populate and match
      let applications = await Application.find(filter)
        .populate({
          path: 'userProfileId',
          model: 'UserProfile'
        })
        .sort({ submittedAt: -1 })
      
      // Filter by profile data
      if (name || phone || email || education) {
        applications = applications.filter(app => {
          const profile = app.userProfileId as any
          if (!profile) return false
          
          if (name && !profile.fullName.toLowerCase().includes(name.toLowerCase())) return false
          if (phone && !profile.phoneNumber.includes(phone)) return false
          if (email && !profile.emailAddress.toLowerCase().includes(email.toLowerCase())) return false
          if (education && !profile.educationalQualifications.toLowerCase().includes(education.toLowerCase())) return false
          
          return true
        })
      }
      
      // Filter by status
      if (status && ['pending', 'approved', 'rejected'].includes(status)) {
        applications = applications.filter(app => app.status === status)
      }
      
      // Filter by date range
      if (startDate || endDate) {
        applications = applications.filter(app => {
          const submittedDate = new Date(app.submittedAt)
          if (startDate && submittedDate < new Date(startDate)) return false
          if (endDate && submittedDate > new Date(endDate)) return false
          return true
        })
      }
      
      // Pagination
      const total = applications.length
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + parseInt(limit)
      const paginatedApplications = applications.slice(startIndex, endIndex)
      
      return {
        applications: paginatedApplications,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total
      }
    } catch (error) {
      return reply.status(500).send({ error: error.message })
    }
  })
  
  // Get single application details
  fastify.get('/applications/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      
      const application = await Application.findById(id)
        .populate('userProfileId')
        .populate('userId', 'phoneNumber')
      
      if (!application) {
        return reply.status(404).send({ error: 'Application not found' })
      }
      
      return { application }
    } catch (error) {
      return reply.status(500).send({ error: error.message })
    }
  })
  
  // Approve/Reject application
  fastify.put('/applications/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const { status } = request.body as { status: 'approved' | 'rejected' }
      
      if (!['approved', 'rejected'].includes(status)) {
        return reply.status(400).send({ error: 'Invalid status' })
      }
      
      const application = await Application.findByIdAndUpdate(
        id,
        {
          status,
          reviewedAt: new Date(),
          reviewedBy: request.user.email
        },
        { new: true }
      ).populate('userProfileId')
      
      if (!application) {
        return reply.status(404).send({ error: 'Application not found' })
      }
      
      const profile = application.userProfileId as any
      
      // Send SMS to user
      const message = status === 'approved' 
        ? `Congratulations ${profile.fullName}! Your application (${application.applicationNumber}) has been approved.`
        : `Dear ${profile.fullName}, Your application (${application.applicationNumber}) has been rejected. Please contact admin for more details.`
      
      await sendSMS(profile.phoneNumber, message)
      
      return { success: true, message: `Application ${status} successfully` }
    } catch (error) {
      return reply.status(500).send({ error: error.message })
    }
  })
  
  // Get dashboard statistics
  fastify.get('/stats', async (request, reply) => {
    try {
      const totalApplications = await Application.countDocuments()
      const pendingApplications = await Application.countDocuments({ status: 'pending' })
      const approvedApplications = await Application.countDocuments({ status: 'approved' })
      const rejectedApplications = await Application.countDocuments({ status: 'rejected' })
      
      // Recent applications (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const recentApplications = await Application.countDocuments({
        submittedAt: { $gte: sevenDaysAgo }
      })
      
      return {
        stats: {
          total: totalApplications,
          pending: pendingApplications,
          approved: approvedApplications,
          rejected: rejectedApplications,
          recentApplications
        }
      }
    } catch (error) {
      return reply.status(500).send({ error: error.message })
    }
  })
} = new Date(endDate)
      }
      
      const applications = await Application.find(filter)
        .sort({ submittedAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate('userId', 'phoneNumber')
      
      const total = await Application.countDocuments(filter)
      
      return {
        applications,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      }
    } catch (error) {
      return reply.status(500).send({ error: error.message })
    }
  })
  
  // Approve/Reject application
  fastify.put('/applications/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const { status } = request.body as { status: 'approved' | 'rejected' }
      
      if (!['approved', 'rejected'].includes(status)) {
        return reply.status(400).send({ error: 'Invalid status' })
      }
      
      const application = await Application.findByIdAndUpdate(
        id,
        {
          status,
          reviewedAt: new Date(),
          reviewedBy: request.user.email
        },
        { new: true }
      )
      
      if (!application) {
        return reply.status(404).send({ error: 'Application not found' })
      }
      
      // Send SMS to user
      const message = status === 'approved' 
        ? `Congratulations! Your application has been approved.`
        : `Your application has been rejected. Please contact admin for more details.`
      
      await sendSMS(application.phoneNumber, message)
      
      return { success: true, message: `Application ${status} successfully` }
    } catch (error) {
      return reply.status(500).send({ error: error.message })
    }
  })
}
