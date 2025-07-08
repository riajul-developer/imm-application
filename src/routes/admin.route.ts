import { FastifyInstance } from 'fastify';
import { loginAdmin, registerAdmin, verifyEmail, forgetAuth, resetAuth } from '../controllers/admin/admin.controller';

export default async function adminRoutes(fastify: FastifyInstance) {
  
  // // Protected routes (require authentication)
  // fastify.post('/admin/send-otp', {
  //   preHandler: [fastify.authenticate]
  // }, adminController.sendEmailOtp)
  
  // fastify.post('/admin/verify-otp', {
  //   preHandler: [fastify.authenticate]
  // }, adminController.verifyEmailOtp)
  
  // fastify.put('/admin/update-credentials', {
  //   preHandler: [fastify.authenticate]
  // }, adminController.updateCredentials)


  fastify.post('/register', registerAdmin)
  fastify.get('/verify-email', verifyEmail)
  fastify.post('/login', loginAdmin)
  fastify.post('/forget-auth', forgetAuth)
  fastify.post('/reset-auth', resetAuth)
}