
export type APIResponse = {
  success: boolean;
  message: string;
  data?: any;
  errors?: any;
};

export function createResponse(
  success: boolean,
  message: string,
  data: any = null,
  errors: any = null
): APIResponse {
  return { success, message, data, errors };
}

export function badErrorResponse(reply: any, message?: string, errors: any = null) {
  const errorMessage = message?.trim() || 'Validation failed';
  reply.code(400).send(createResponse(false, errorMessage, null, errors));
}

export function serverErrorResponse(reply: any, message = 'Something went wrong') {
  reply.code(500).send(createResponse(false, message));
}

export function notFoundResponse(reply: any, message = 'Resource not found') {
  reply.code(404).send(createResponse(false, message));
}

export function forbiddenResponse(reply: any, message = 'Access denied') {
  reply.code(403).send(createResponse(false, message));
}

export function unauthorizedResponse(reply: any, message = 'Unauthorized access') {
  reply.code(401).send(createResponse(false, message));
}

export function conflictResponse(reply: any, message?: string, errors: any = null) {
  const errorMessage = message?.trim() || 'Conflict detected';
  reply.code(409).send(createResponse(false, errorMessage, null, errors));
}

export function successResponse(reply: any, message?: string, data: any = null) {
  const finalMessage = message?.trim() || 'Resource retrieved successfully';
  reply.code(200).send(createResponse(true, finalMessage, data));
}

export function createdResponse(reply: any, message?: string, data: any = null) {
  const finalMessage = message?.trim() || 'Resource created successfully';
  reply.code(201).send(createResponse(true, finalMessage, data));
}

export function noContentResponse(reply: any, message = 'No content available') {
  reply.code(204).send(createResponse(true, message));
}
