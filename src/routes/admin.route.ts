import { FastifyInstance } from 'fastify'
import { sendOtp, verifyOtp } from '../controllers/client/auth.controller'
import { profileBasicInfo, profileIdentity, profileEducationInfo, profileEmergencyContact, profileAddress, profileOther, profileCvUpload, profileMe } from '../controllers/client/profile.controller'
import authenticate from '../plugins/auth.plugin'

export default async function clientRoutes(fastify: FastifyInstance) {
  export const adminApplicationRoutes = async (fastify: FastifyInstance) => {
    fastify.get('/all', { preHandler: [authenticate, isAdmin] }, getApplicationsAdmin)
    fastify.get('/stats', { preHandler: [authenticate, isAdmin] }, getApplicationStatsAdmin)
    fastify.get('/:id', { preHandler: [authenticate, isAdmin] }, getApplicationDetailAdmin)
    fastify.put('/:id/review', { preHandler: [authenticate, isAdmin] }, reviewApplicationAdmin)
  }
  
  fastify.register(applicationRoutes, { prefix: '/application' })

}