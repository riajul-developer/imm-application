// controllers/profile.controller.ts
import { FastifyRequest, FastifyReply } from 'fastify'
import { ZodError } from 'zod'
import { badErrorResponse, serverErrorResponse, successResponse } from '../../utils/response.util'
import { userProfileBasicInfoSchema, userProfileIdentitySchema, userProfileEducationSchema } from '../../schemas/profile.schema'
import { getUserProfile, upsertBasicInfo, upsertEducation, upsertIdentity } from '../../services/client/profile.service'
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
    let oldProfilePicFile: { name: string; url: string } | null | undefined = undefined;

    if (isMultipart) {

      const existingProfile = await getUserProfile(userId)
      oldProfilePicFile = existingProfile?.basic?.profilePicFile

      // Process multipart form with file uploads
      const { body: formBody, uploadResult } = await processMultipartForm(
        request,
        ['profilePic'], 
        {
          maxSize: 3 * 1024 * 1024, // 3MB
          allowedTypes: ['image/jpeg', 'image/png'],
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


        if (oldProfilePicFile?.url && oldProfilePicFile.url !== uploadedFile.url) {
          console.log(`Deleting old profile picture: ${oldProfilePicFile.url}`)
          const deleteSuccess = await deleteFileByUrl(oldProfilePicFile.url, 'uploads')
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
        profilePicFile: uploadedFile || oldProfilePicFile || undefined,
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
    let uploadedFiles: Array<{ name: string; url: string }> = []
    let cleanOldFiles: Array<{ name: string; url: string }> = [];

    if (isMultipart) {

      const existingProfile = await getUserProfile(userId)
      let oldNidFiles = existingProfile?.identity?.nidFiles || []

      cleanOldFiles = oldNidFiles.map((file: any) => ({
        name: file.name,
        url: file.url
      }))


      const { body: formBody, uploadResult } = await processMultipartForm(
        request,
        ['nidPictures'], 
        {
          maxSize: 3 * 1024 * 1024, // 3MB
          allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
          uploadDir: 'uploads'
        }
      )

      if (!uploadResult.success) {
        if (uploadResult.validationErrors) {
          return badErrorResponse(reply, 'Validation failed', uploadResult.validationErrors)
        }
        return serverErrorResponse(reply, uploadResult.error || 'File upload failed')
      }

      body = formBody

      uploadedFiles = uploadResult.files.map(file => ({
        name: file.name,
        url: file.url
      }))

      if (uploadResult.files.length > 0) {
        body.nidFiles = uploadedFiles
      }

    } else {
      body = request.body
    }

    // Validate form data
    const parsed = userProfileIdentitySchema.parse(body)

    const profile = await upsertIdentity({
      userId,
      identity: {
        ...parsed,
        nidFiles: uploadedFiles.length > 0 ? uploadedFiles : cleanOldFiles,
      }
    })

    return successResponse(reply, 'Profile identity saved successfully', profile)

  } catch (error) {
    console.error('Profile update error:', error)

    if (error instanceof ZodError) {
      return badErrorResponse(reply, 'Validation failed', error.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      })))
    }
    return serverErrorResponse(reply, 'Failed to save profile identity')
  }
}
export const profileEducationInfo = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const contentType = request.headers['content-type'] || ''
    const isMultipart = contentType.includes('multipart/form-data')

    // Get userId from verified token
    const userId = (request.user as any)?.userId
    if (!userId) {
      return badErrorResponse(reply, 'Unauthorized user')
    }

    let body: any = {}
    let uploadedFiles: Array<{ name: string; url: string }> = []

    if (isMultipart) {
      const { body: formBody, uploadResult } = await processMultipartForm(
        request,
        ['certificateFiles'],
        {
          maxSize: 5 * 1024 * 1024, // 5MB for certificates
          allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
          uploadDir: 'uploads'
        }
      )

      if (!uploadResult.success) {
        if (uploadResult.validationErrors) {
          return badErrorResponse(reply, 'Validation failed', uploadResult.validationErrors)
        }
        return serverErrorResponse(reply, 'File upload failed')
      }

      body = formBody

      uploadedFiles = uploadResult.files.map(file => ({
        name: file.name,
        url: file.url
      }))

      // Convert string numbers to actual numbers for form data
      if (body.cgpaOrGpa) {
        body.cgpaOrGpa = parseFloat(body.cgpaOrGpa)
      }
      if (body.passingYear) {
        body.passingYear = parseInt(body.passingYear)
      }

    } else {
      body = request.body
    }

    // Validate using simple education schema
    const parsed = userProfileEducationSchema.parse(body)

    // Get existing education records
    const existingProfile = await getUserProfile(userId)
    const existingEducation = existingProfile?.education || []

    // Create new education record
    const newEducationRecord = {
      degree: parsed.degree,
      cgpaOrGpa: parsed.cgpaOrGpa,
      passingYear: parsed.passingYear,
      certificateFiles: uploadedFiles
    }

    // Append to existing education array
    const finalEducationData = [...existingEducation, newEducationRecord]

    // Clean the data before saving
    const cleanedEducationData = finalEducationData.map((edu: any) => ({
      degree: edu.degree,
      cgpaOrGpa: edu.cgpaOrGpa,
      passingYear: edu.passingYear,
      certificateFiles: (edu.certificateFiles || []).map((file: any) => ({
        name: file.name,
        url: file.url
      }))
    }))

    const profile = await upsertEducation({
      userId,
      education: cleanedEducationData
    })

    return successResponse(reply, 'Education added successfully', profile)

  } catch (error) {
    console.error('Profile education update error:', error)

    if (error instanceof ZodError) {
      return badErrorResponse(reply, 'Validation failed', error.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      })))
    }

    return serverErrorResponse(reply, 'Failed to save education info')
  }
}

export const profileEmergencyContact = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // Get userId from verified token
    const userId = (request.user as any)?.userId
    if (!userId) {
      return badErrorResponse(reply, 'Unauthorized user')
    }

    let body: any = {}
    let uploadedFile: { name: string; url: string } | null = null
    let oldProfilePicFile: { name: string; url: string } | null | undefined = undefined;

    if (isMultipart) {

      const existingProfile = await getUserProfile(userId)
      oldProfilePicFile = existingProfile?.basic?.profilePicFile

      // Process multipart form with file uploads
      const { body: formBody, uploadResult } = await processMultipartForm(
        request,
        ['profilePic'], 
        {
          maxSize: 3 * 1024 * 1024, // 3MB
          allowedTypes: ['image/jpeg', 'image/png'],
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


        if (oldProfilePicFile?.url && oldProfilePicFile.url !== uploadedFile.url) {
          console.log(`Deleting old profile picture: ${oldProfilePicFile.url}`)
          const deleteSuccess = await deleteFileByUrl(oldProfilePicFile.url, 'uploads')
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
        profilePicFile: uploadedFile || oldProfilePicFile || undefined,
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
  