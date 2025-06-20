import { FastifyRequest, FastifyReply } from 'fastify';
export default async function authenticate(request : FastifyRequest, reply : FastifyReply) {
  try {
    await request.jwtVerify()
  } catch (err) {
    return reply.status(401).send({ error: 'Unauthorized access' })
  }
}