import { FastifyInstance } from 'fastify'
import { sendOtp, verifyOtp } from '../controllers/client/auth.controller'
import { profileBasicInfo, profileIdentity, profileEducationInfo, profileEmergencyContact, profileAddress, profileOther, profileCvUpload, profileMe } from '../controllers/client/profile.controller'
import authenticate from '../plugins/auth.plugin'

export default async function clientRoutes(fastify: FastifyInstance) {
  fastify.post('/auth/send-otp', sendOtp)
  fastify.post('/auth/verify-otp', verifyOtp)

  fastify.get('/profile/me', { preHandler: authenticate }, profileMe)
  fastify.post('/profile/basic-info', { preHandler: authenticate }, profileBasicInfo)
  fastify.post('/profile/identity-info', { preHandler: authenticate }, profileIdentity)
  fastify.post('/profile/emergency-contact', { preHandler: authenticate }, profileEmergencyContact)
  fastify.post('/profile/address-info', { preHandler: authenticate }, profileAddress)
  fastify.post('/profile/other-info', { preHandler: authenticate }, profileOther)
  fastify.post('/profile/cv-upload', { preHandler: authenticate }, profileCvUpload)

  fastify.post('/profile/education-info', { preHandler: authenticate }, profileEducationInfo)
}