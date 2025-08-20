import { FastifyRequest, FastifyReply } from 'fastify'
import * as applicationService from '../../services/application.service'
import { badErrorResponse, notFoundResponse, serverErrorResponse, successResponse } from '../../utils/response.util'
import { updateStatusSchema } from '../../schemas/application.schema';
import { ZodError } from 'zod';

export const getApplications = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status,
      appliedFrom,
      appliedTo
    } = request.query as {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      appliedFrom?: string;
      appliedTo?: string;
    };

    const applications = await applicationService.allApplications(
      Number(page),
      Number(limit),
      search,
      status,
      appliedFrom,
      appliedTo
    );

    return successResponse(reply, 'Applications data retrieved successfully.', applications);
  } catch (error) {
    return serverErrorResponse(reply, 'Something went wrong.');
  }
};

export const getApplication = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;
    const data = await applicationService.getApplicationById(id);

    if (!data) {
      return notFoundResponse(reply, 'Application not found');
    }

    return successResponse(reply, 'Application fetched successfully.', data);

  } catch (error) {
    return serverErrorResponse(reply, 'Something went wrong.');
  }
};

export const updateApplication = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const parsed = updateStatusSchema.parse(request.body);
    const { id } = request.params;

    const updatedApplication = await applicationService.updateApplication(id, {
      status: parsed.status,
      adminNotes: parsed.adminNotes,
      rejectionReason: parsed.status === 'rejected' ? parsed.rejectionReason : undefined,
      remarkText: parsed.status === 'scheduled' ? parsed.remarkText : undefined,
    });

    return successResponse(reply, 'Application status updated successfully.', updatedApplication);

  } catch (error) {

    if (error instanceof ZodError) {
      return badErrorResponse(reply, 'Validation failed.', error.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message
      })));
    }

    if (error instanceof Error) {
      return badErrorResponse(reply, error.message)
    }

    return serverErrorResponse(reply, 'Failed to update application status');
  }
};