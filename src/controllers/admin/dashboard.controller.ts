export const getDashboardStats = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const stats = await adminService.fetchDashboardStats()
    return reply.send({ stats })
  } catch (error) {
    return reply.status(500).send({ error: error.message })
  }
}
