import { FastifyInstance } from 'fastify'
import { sendOtp, verifyOtp } from '../controllers/client/auth.controller'
import { profileBasicInfo, profileIdentity, profileEducationInfo, profileEmergencyContact, profileAddress, profileOther, profileCvUpload, profileMe, profileWorkInfo } from '../controllers/client/profile.controller'
import { authenticate } from '../plugins/auth.plugin'
import { canCompleteProfile, getMyApplication, submitApplication } from '../controllers/client/application.controller'

export default async function clientRoutes(fastify: FastifyInstance) {
  fastify.post('/auth/send-otp', sendOtp)
  fastify.post('/auth/verify-otp', verifyOtp)

  const profileRoutes = async (fastify: FastifyInstance) => {
    fastify.get('/me', { preHandler: authenticate }, profileMe)
    fastify.post('/basic-info', { preHandler: authenticate }, profileBasicInfo)
    fastify.post('/identity-info', { preHandler: authenticate }, profileIdentity)
    fastify.post('/emergency-contact', { preHandler: authenticate }, profileEmergencyContact)
    fastify.post('/address-info', { preHandler: authenticate }, profileAddress)
    fastify.post('/other-info', { preHandler: authenticate }, profileOther)
    fastify.post('/cv-upload', { preHandler: authenticate }, profileCvUpload)

    fastify.post('/work-info', { preHandler: authenticate }, profileWorkInfo)

    fastify.post('/education-info', { preHandler: authenticate }, profileEducationInfo)



  }

  const applicationRoutes = async (fastify: FastifyInstance) => {
    fastify.post('/submit', { preHandler: authenticate }, submitApplication)
    fastify.get('/my-status', { preHandler: authenticate }, getMyApplication)
    fastify.get('/can-complete-profile', { preHandler: authenticate }, canCompleteProfile)
  }

  fastify.register(profileRoutes, { prefix: '/profile' })
  fastify.register(applicationRoutes, { prefix: '/application' })

}