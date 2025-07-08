import { FastifyInstance } from 'fastify';
import { loginAdmin, registerAdmin, verifyEmail, forgetAuth, resetAuth } from '../controllers/admin/admin.controller';

export default async function adminRoutes(fastify: FastifyInstance) {

  fastify.post('/register', registerAdmin)
  fastify.get('/verify-email', verifyEmail)
  fastify.post('/login', loginAdmin)
  fastify.post('/forget-auth', forgetAuth)
  fastify.post('/reset-auth', resetAuth)

}