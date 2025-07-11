import { FastifyInstance } from 'fastify';
import { loginAdmin, registerAdmin, verifyEmail, forgetAuth, resetAuth } from '../controllers/admin/admin.controller';
import { authenticateAdmin } from '../plugins/auth.plugin';
import { getDashboard, getRecentApplications } from '../controllers/admin/dashboard.controller';
import { getApplications, getApplication, updateApplication } from '../controllers/admin/application.controller';

export default async function adminRoutes(fastify: FastifyInstance) {

  fastify.post('/register', registerAdmin)
  fastify.get('/verify-email', verifyEmail)
  fastify.post('/login', loginAdmin)
  fastify.post('/forget-auth', forgetAuth)
  fastify.post('/reset-auth', resetAuth)

  fastify.get("/dashboard", { preHandler: authenticateAdmin }, getDashboard)
  fastify.get("/recent-applications", { preHandler: authenticateAdmin }, getRecentApplications)
  fastify.get("/applications", { preHandler: authenticateAdmin }, getApplications)
  fastify.get("/applications/:id", { preHandler: authenticateAdmin }, getApplication)
  fastify.put("/applications/:id", { preHandler: authenticateAdmin }, updateApplication)
}