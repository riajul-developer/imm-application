import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { loginAdmin, registerAdmin, verifyEmail, forgetAuth, resetAuth } from '../controllers/admin/admin.controller';
import { successResponse } from '../utils/response.util';
import { authenticateAdmin } from '../plugins/auth.plugin';

export default async function adminRoutes(fastify: FastifyInstance) {

  fastify.post('/register', registerAdmin)
  fastify.get('/verify-email', verifyEmail)
  fastify.post('/login', loginAdmin)
  fastify.post('/forget-auth', forgetAuth)
  fastify.post('/reset-auth', resetAuth)

  fastify.get("/test-auth", { preHandler: authenticateAdmin }, (request: FastifyRequest, reply: FastifyReply) => {
    return successResponse(reply, 'Test admin middleware successfully')
  })

}