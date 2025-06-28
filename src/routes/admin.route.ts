import { FastifyInstance } from 'fastify';
import { registerAdmin } from '../controllers/admin/admin.controller';

export default async function adminRoutes(fastify: FastifyInstance) {

  // fastify.post('/admin/register', adminController.registerAdmin)
  // fastify.get('/admin/verify-email', adminController.verifyEmail)
  // fastify.post('/admin/login', adminController.loginAdmin)
  
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
}