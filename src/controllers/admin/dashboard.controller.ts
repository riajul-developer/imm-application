import { FastifyRequest, FastifyReply } from 'fastify'
import * as dashboardService from '../../services/dashboard.service'
import { badErrorResponse, serverErrorResponse, successResponse } from '../../utils/response.util'

export const getDashboard = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { startDate, endDate } = request.query as { 
      startDate?: string; 
      endDate?: string; 
    };
    
    if (startDate && !isValidDate(startDate)) {
      return badErrorResponse(reply, 'Invalid startDate format. Use YYYY-MM-DD')
    }
    
    if (endDate && !isValidDate(endDate)) {
      return badErrorResponse(reply, 'Invalid endDate format. Use YYYY-MM-DD')
    }
    
    const dashboard = await dashboardService.dashboard(startDate, endDate);

    return successResponse(reply, 'Dashboard data retrieved successfully.', dashboard)
  } catch (error) {
    return serverErrorResponse(reply, 'Something went wrong.')
  }
}

function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime()) && !!dateString.match(/^\d{4}-\d{2}-\d{2}$/);
}

export const getRecentApplications = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const recentApplications = await dashboardService.recentApplications()
    return successResponse(reply, 'Dashboard data retrieved successfully.', recentApplications)
  } catch (error) {
    return serverErrorResponse(reply, 'Something went wrong.')
  }
}
