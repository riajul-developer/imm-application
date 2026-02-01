import { FastifyInstance } from 'fastify'
import { sendOtp, verifyOtp } from '../controllers/client/auth.controller'
import { 
  profileBasicInfo, profileIdentity, educationFilesUpload, profileEmergencyContact, profileAddress, profileOther, 
  profileCvUpload, profileMe, profileWorkInfo, testimonialUpload, myVerifiedUpload, commitmentUpload, 
  ndaFilesUpload,
  agreementFilesUpload,
  profileDelete
} from '../controllers/client/profile.controller'
import { authenticate } from '../plugins/auth.plugin'
import { getMyApplication, appliedApplication } from '../controllers/client/application.controller'

export default async function clientRoutes(fastify: FastifyInstance) {
  fastify.post('/auth/send-otp', sendOtp)
  fastify.post('/auth/verify-otp', verifyOtp)

  const profileRoutes = async (fastify: FastifyInstance) => {
    
    fastify.get('/me', { preHandler: authenticate }, profileMe)
    fastify.delete('/me', { preHandler: authenticate }, profileDelete)
    fastify.post('/basic-info', { preHandler: authenticate }, profileBasicInfo)
    fastify.post('/identity-info', { preHandler: authenticate }, profileIdentity)
    fastify.post('/emergency-contact', { preHandler: authenticate }, profileEmergencyContact)
    fastify.post('/address-info', { preHandler: authenticate }, profileAddress)
    fastify.post('/other-info', { preHandler: authenticate }, profileOther)
    fastify.post('/cv-upload', { preHandler: authenticate }, profileCvUpload)

    fastify.post('/work-info', { preHandler: authenticate }, profileWorkInfo)
    fastify.post('/education-upload', { preHandler: authenticate }, educationFilesUpload)
    fastify.post('/testimonial-upload', { preHandler: authenticate }, testimonialUpload)
    fastify.post('/my-verified-upload', { preHandler: authenticate }, myVerifiedUpload)
    fastify.post('/commitment-upload', { preHandler: authenticate }, commitmentUpload)
    fastify.post('/nda-upload', { preHandler: authenticate }, ndaFilesUpload)
    fastify.post('/agreement-upload', { preHandler: authenticate }, agreementFilesUpload)

  }

  const applicationRoutes = async (fastify: FastifyInstance) => {
    fastify.post('/submit', { preHandler: authenticate }, appliedApplication)
    fastify.get('/my-status', { preHandler: authenticate }, getMyApplication)
  }

  fastify.register(profileRoutes, { prefix: '/profile' })
  fastify.register(applicationRoutes, { prefix: '/application' })

}