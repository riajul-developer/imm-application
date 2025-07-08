import { FastifyRequest, FastifyReply } from 'fastify';
export async function authenticate(request : FastifyRequest, reply : FastifyReply) {
  try {
    await request.jwtVerify()
  } catch (err) {
    return reply.status(401).send({ error: 'Unauthorized access.' })
  }
}
export async function authenticateAdmin(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    const user = request.user as any; 
    if (!user || user.role !== 'admin') {
      return reply.status(403).send({ 
        error: 'Access forbidden. Admin privileges required.' 
      });
    }
  } catch (err) {
    return reply.status(401).send({ 
      error: 'Unauthorized access.' 
    });
  }
}

