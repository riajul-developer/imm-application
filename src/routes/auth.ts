import { FastifyInstance } from 'fastify'
import { sendOtp, verifyOtp } from '../controllers/client/auth.controller'

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('auth/send-otp', sendOtp)
  fastify.post('auth/verify-otp', verifyOtp)
}