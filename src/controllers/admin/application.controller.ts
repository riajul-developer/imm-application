export const getApplications = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const result = await adminService.fetchApplications(request.query as any)
    return reply.send(result)
  } catch (error) {
    return reply.status(500).send({ error: error.message })
  }
}

export const getSingleApplication = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string }
    const application = await adminService.fetchApplicationById(id)
    if (!application) return reply.status(404).send({ error: 'Application not found' })
    return reply.send({ application })
  } catch (error) {
    return reply.status(500).send({ error: error.message })
  }
}

export const updateApplicationStatus = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string }
    const { status } = request.body as { status: 'approved' | 'rejected' }
    const result = await adminService.updateApplicationStatus(id, status, request.user)
    return reply.send(result)
  } catch (error) {
    return reply.status(500).send({ error: error.message })
  }
}
