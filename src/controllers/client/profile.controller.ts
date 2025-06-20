// controllers/profile.controller.ts
import { FastifyRequest, FastifyReply } from 'fastify'
import { ZodError } from 'zod'
import { badErrorResponse, serverErrorResponse, successResponse } from '../../utils/response.util'
import { userProfileBasicInfoSchema } from '../../schemas/profile.schema'
import { getUserProfile, upsertBasicInfo } from '../../services/client/profile.service'
import { processMultipartForm } from '../../utils/fileUpload.util'
import { deleteFileByUrl } from '../../utils/fileDelete.util'

export const profileBasicInfo = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const contentType = request.headers['content-type'] || ''
    const isMultipart = contentType.includes('multipart/form-data')

    // Get userId from verified token
    const userId = (request.user as any)?.userId
    if (!userId) {
      return badErrorResponse(reply, 'Unauthorized user')
    }

    let body: any = {}
    let uploadedFile: { name: string; url: string } | null = null

    if (isMultipart) {

      const existingProfile = await getUserProfile(userId)
      const oldFileUrl = existingProfile?.basic?.profilePicFile?.url

      // Process multipart form with file uploads
      const { body: formBody, uploadResult } = await processMultipartForm(
        request,
        ['profilePic'], 
        {
          maxSize: 3 * 1024 * 1024, // 3MB
          allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
          uploadDir: 'uploads'
        }
      )

      // Check if file upload failed
      if (!uploadResult.success) {
        if (uploadResult.validationErrors) {
          return badErrorResponse(reply, 'Validation failed', uploadResult.validationErrors)
        }
        return serverErrorResponse(reply, uploadResult.error || 'File upload failed')
      }

      body = formBody
      
      // Get the first uploaded file (since model expects single file)
      if (uploadResult.files.length > 0) {
        uploadedFile = {
          name: uploadResult.files[0].name,
          url: uploadResult.files[0].url
        }
        body.profilePicFile = uploadedFile


        if (oldFileUrl && oldFileUrl !== uploadedFile.url) {
          console.log(`Deleting old profile picture: ${oldFileUrl}`)
          const deleteSuccess = await deleteFileByUrl(oldFileUrl, 'uploads')
          if (deleteSuccess) {
            console.log('Old profile picture deleted successfully')
          } else {
            console.warn('Failed to delete old profile picture')
          }
        }
      }

    } else {
      body = request.body
    }

    // Validate form data
    const parsed = userProfileBasicInfoSchema.parse(body)

    // Upsert profile with file info
    const profile = await upsertBasicInfo({
      userId,
      basic: {
        ...parsed,
        profilePicFile: uploadedFile ?? undefined,
      }
    })

    return successResponse(reply, 'Basic profile info saved successfully', profile)

  } catch (error) {
    console.error('Profile update error:', error)

    if (error instanceof ZodError) {
      return badErrorResponse(reply, 'Validation failed', error.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      })))
    }
    return serverErrorResponse(reply, 'Failed to save basic profile info')
  }
}


export const profileIdentity = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const contentType = request.headers['content-type'] || ''
    const isMultipart = contentType.includes('multipart/form-data')

    // Get userId from verified token
    const userId = (request.user as any)?.userId
    if (!userId) {
      return badErrorResponse(reply, 'Unauthorized user')
    }

    let body: any = {}
    let uploadedFile: { name: string; url: string } | null = null

    if (isMultipart) {

      const existingProfile = await getUserProfile(userId)
      const oldFileUrl = existingProfile?.basic?.profilePicFile?.url

      // Process multipart form with file uploads
      const { body: formBody, uploadResult } = await processMultipartForm(
        request,
        ['profilePic'], 
        {
          maxSize: 3 * 1024 * 1024, // 3MB
          allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
          uploadDir: 'uploads'
        }
      )

      // Check if file upload failed
      if (!uploadResult.success) {
        if (uploadResult.validationErrors) {
          return badErrorResponse(reply, 'Validation failed', uploadResult.validationErrors)
        }
        return serverErrorResponse(reply, uploadResult.error || 'File upload failed')
      }

      body = formBody
      
      // Get the first uploaded file (since model expects single file)
      if (uploadResult.files.length > 0) {
        uploadedFile = {
          name: uploadResult.files[0].name,
          url: uploadResult.files[0].url
        }
        body.profilePicFile = uploadedFile


        if (oldFileUrl && oldFileUrl !== uploadedFile.url) {
          console.log(`Deleting old profile picture: ${oldFileUrl}`)
          const deleteSuccess = await deleteFileByUrl(oldFileUrl, 'uploads')
          if (deleteSuccess) {
            console.log('Old profile picture deleted successfully')
          } else {
            console.warn('Failed to delete old profile picture')
          }
        }
      }

    } else {
      body = request.body
    }

    // Validate form data
    const parsed = userProfileBasicInfoSchema.parse(body)

    // Upsert profile with file info
    const profile = await upsertBasicInfo({
      userId,
      basic: {
        ...parsed,
        profilePicFile: uploadedFile ?? undefined,
      }
    })

    return successResponse(reply, 'Basic profile info saved successfully', profile)

  } catch (error) {
    console.error('Profile update error:', error)

    if (error instanceof ZodError) {
      return badErrorResponse(reply, 'Validation failed', error.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      })))
    }
    return serverErrorResponse(reply, 'Failed to save basic profile info')
  }
}
