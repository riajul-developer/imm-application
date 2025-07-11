import { FastifyRequest, FastifyReply } from 'fastify'
import * as dashboardService from '../../services/dashboard.service'
import { serverErrorResponse, successResponse } from '../../utils/response.util'

export const getDashboard = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const dashboard = await dashboardService.dashboard()
    return successResponse(reply, 'Dashboard data retrieved successfully.', dashboard)
  } catch (error) {
    return serverErrorResponse(reply, 'Something went wrong.')
  }
}

export const getRecentApplications = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const recentApplications = await dashboardService.recentApplications()
    return successResponse(reply, 'Dashboard data retrieved successfully.', recentApplications)
  } catch (error) {
    return serverErrorResponse(reply, 'Something went wrong.')
  }
}
