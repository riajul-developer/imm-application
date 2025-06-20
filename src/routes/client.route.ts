import { FastifyInstance } from 'fastify'
import { sendOtp, verifyOtp } from '../controllers/client/auth.controller'
import { profileBasicInfo, profileIdentity } from '../controllers/client/profile.controller'
import authenticate from '../plugins/auth.plugin'

export default async function clientRoutes(fastify: FastifyInstance) {
  fastify.post('/auth/send-otp', sendOtp)
  fastify.post('/auth/verify-otp', verifyOtp)

  fastify.post('/profile/basic-info', { preHandler: authenticate }, profileBasicInfo)
  fastify.post('/profile/identity', { preHandler: authenticate }, profileIdentity)

}