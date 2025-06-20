import { FastifyRequest, FastifyReply } from 'fastify'
import { adminLoginSchema } from '../../schemas/validation'
import * as adminService from '../../services/admin.service'

export const adminLogin = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { email, password } = adminLoginSchema.parse(request.body)
    const result = await adminService.loginAdmin(email, password, request)
    return reply.send(result)
  } catch (error) {
    return reply.status(400).send({ error: error.message || 'An error occurred' })
  }
}
