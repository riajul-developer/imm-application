// controllers/profile.controller.ts
import { FastifyRequest, FastifyReply } from 'fastify'
import { ZodError } from 'zod'
import { badErrorResponse, serverErrorResponse, successResponse } from '../../utils/response.util'
import { userBasicInfoSchema, emergencyContactSchema, addressSchema, otherSchema, userIdentitySchema, workInfoSchema, userEducationSchema, userTestimonialSchema, userMyVerifiedSchema, userCommitmentNoteSchema } from '../../schemas/profile.schema'
import { checkCanApply, getUserProfile, needAdditionalInfo, upsertAddress, upsertBasicInfo, upsertCommitmentNote, upsertCvFile, upsertEducation, upsertEmergencyContact, upsertIdentity, upsertMyVerified, upsertOther, upsertTestimonial, upsertWorkInfo } from '../../services/profile.service'
import { processMultipartForm } from '../../utils/fileUpload.util'
import { deleteFileByUrl } from '../../utils/fileDelete.util'
import { applicationStatus } from '../../services/application.service'


export const profileBasicInfo = async (request: FastifyRequest, reply: FastifyReply) => {

  let uploadedFile: { name: string; url: string } | null = null;

  try {
    const contentType = request.headers['content-type'] || ''
    const isMultipart = contentType.includes('multipart/form-data')

    const userId = (request.user as any)?.userId
    if (!userId) {
      return badErrorResponse(reply, 'Unauthorized user')
    }

    let parsed: any = {};
    let oldProfilePicFile: { name: string; url: string } | null | undefined = undefined;
    if (isMultipart) {
      const existingProfile = await getUserProfile(userId)
      oldProfilePicFile = existingProfile?.basic?.profilePicFile

      const { body: formBody, uploadResult } = await processMultipartForm(
        request,
        ['profilePic'], 
        {
          maxSize: 3 * 1024 * 1024, // 3MB
          allowedTypes: ['image/jpeg', 'image/png'],
          uploadDir: 'uploads/profile/basics'
        }
      )

      if (!uploadResult.success) {
        if (uploadResult.validationErrors) {
          return badErrorResponse(reply, 'Validation failed', uploadResult.validationErrors)
        }
        return serverErrorResponse(reply, uploadResult.error || 'File upload failed')
      }

      if (uploadResult.files[0]) {
        uploadedFile = {
          name: uploadResult.files[0].name,
          url: uploadResult.files[0].url
        }
      }

      parsed = userBasicInfoSchema.parse(formBody)
      
      if ((uploadedFile && oldProfilePicFile) && oldProfilePicFile.url !== uploadedFile?.url) {
        await deleteFileByUrl(oldProfilePicFile.url, 'uploads/profile/basics')
      } 

    } else {
      parsed = userBasicInfoSchema.parse(request.body)
    }

    const profile = await upsertBasicInfo({
      userId,
      basic: {
        ...parsed,
        phone: (request.user as any)?.phoneNumber,
        profilePicFile: uploadedFile || oldProfilePicFile || undefined,
      }
    })

    const canApplication = await checkCanApply(userId);

    return successResponse(reply, 'Basic profile info saved successfully', {canApplication, ...profile})

  } catch (error) {

    if (uploadedFile) {
      await deleteFileByUrl(uploadedFile.url, 'uploads/profile/basics')
    }

    if (error instanceof ZodError) {
      return badErrorResponse(reply, 'Validation failed.', error.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      })))
    }
    return serverErrorResponse(reply, 'Failed to save basic profile info')
  }
}

export const profileIdentity = async (request: FastifyRequest, reply: FastifyReply) => {

  let uploadedFiles: Array<{name: string; url: string; type: string; side?: string }> = [];

  try {
    const contentType = request.headers['content-type'] || ''
    const isMultipart = contentType.includes('multipart/form-data')

    const userId = (request.user as any)?.userId
    if (!userId) {
      return badErrorResponse(reply, 'Unauthorized user')
    }

    let parsed: any = {};
    
    if (isMultipart) {

      const { body: formBody, uploadResult } = await processMultipartForm(
        request,
        ['nidFrontDoc', 'nidBackDoc', 'passportFrontDoc', 'passportBackDoc', 'birthRegDoc'], 
        {
          maxSize: 3 * 1024 * 1024,
          allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
          uploadDir: 'uploads/profile/identities'
        }
      )

      if (!uploadResult.success) {
        if (uploadResult.files.length > 0) {
          for (const uploadedFile of uploadResult.files) {
            if (uploadedFile?.url) {
              await deleteFileByUrl(uploadedFile.url, 'uploads/profile/identities');
            }
          }
        }
        if (uploadResult.validationErrors) {
          return badErrorResponse(reply, 'Validation failed', uploadResult.validationErrors)
        }
        return serverErrorResponse(reply, uploadResult.error || 'File upload failed')
      }

      uploadResult.files.forEach(file => {
        let type: string, side: string | undefined
        switch (file.fieldname) {
          case 'nidFrontDoc': type = 'nid'; side = 'front'; break
          case 'nidBackDoc': type = 'nid'; side = 'back'; break
          case 'passportFrontDoc': type = 'passport'; side = 'front'; break
          case 'passportBackDoc': type = 'passport'; side = 'back'; break
          case 'birthRegDoc': type = 'birth-reg'; break
          default: return
        }
        uploadedFiles.push({ name: file.name, url: file.url, type, side })
      })

      parsed = userIdentitySchema.parse(formBody)

    } else {
      parsed = userIdentitySchema.parse(request.body)
    }

    const existingProfile = await getUserProfile(userId)
    const existingFiles = existingProfile?.identity?.docFiles || []

    if (existingFiles.length > 0 && uploadedFiles.length > 0) {
      const existingType = existingFiles[0].type
      const newTypes = [...new Set(uploadedFiles.map(f => f.type))]
      
      if (newTypes.some(t => t !== existingType)) {
        if (uploadedFiles.length > 0) {
          for (const uploadedFile of uploadedFiles) {
            await deleteFileByUrl(uploadedFile.url, 'uploads/profile/identities');
          }
        }
        return badErrorResponse(reply, `You can only upload ${existingType} files`)
      }
    }

    let mergedFiles = [...existingFiles]

    uploadedFiles.forEach(newFile => {
      const index = newFile.type === 'birth-reg' 
        ? mergedFiles.findIndex(f => f.type === newFile.type)
        : mergedFiles.findIndex(f => f.type === newFile.type && f.side === newFile.side)

      if (index !== -1) {
        const oldFile = mergedFiles[index];
        if (oldFile?.url) {
          deleteFileByUrl(oldFile.url, 'uploads/profile/identities'); 
        }
        mergedFiles[index] = newFile
      } else {
        mergedFiles.push(newFile)
      }
    })

    const profile = await upsertIdentity({
      userId,
      identity: {
        number: parsed.number,
        docFiles: mergedFiles
      }
    })

    const canApplication = await checkCanApply(userId);

    return successResponse(reply, 'Profile identity saved successfully', {canApplication, ...profile})
    
  } catch (error) {

    if (uploadedFiles.length > 0) {
      for (const uploadedFile of uploadedFiles) {
        if (uploadedFile?.url) {
          await deleteFileByUrl(uploadedFile.url, 'uploads/profile/identities');
        }
      }
    }

    if (error instanceof ZodError) {
      return badErrorResponse(reply, 'Validation failed', error.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      })))
    }
    return serverErrorResponse(reply, 'Failed to save profile identity')
  }
}

export const profileEmergencyContact = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as any)?.userId
    if (!userId) {
      return badErrorResponse(reply, 'Unauthorized user')
    }

    const body = request.body as any

    const parsed = emergencyContactSchema.parse(body)

    const profile = await upsertEmergencyContact({
      userId,
      emergencyContact: {...parsed}
    })

    const canApplication = await checkCanApply(userId);

    return successResponse(reply, 'Emergency contact saved successfully', {canApplication, ...profile})

  } catch (error) {

    if (error instanceof ZodError) {
      return badErrorResponse(reply, 'Validation failed', error.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      })))
    }
    return serverErrorResponse(reply, 'Failed to save emergency contact')
  }
}

export const profileAddress = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as any)?.userId
    if (!userId) {
      return badErrorResponse(reply, 'Unauthorized user')
    }

    const body = request.body as any

    const parsed = addressSchema.parse(body)

    const profile = await upsertAddress({
      userId,
      address: {
        present: {...parsed.present},
        permanent: {...parsed.permanent}
      }
    })

    const canApplication = await checkCanApply(userId);

    return successResponse(reply, 'Address saved successfully', {canApplication, ...profile})

  } catch (error) {
    if (error instanceof ZodError) {
      return badErrorResponse(reply, 'Validation failed', error.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      })))
    }
    return serverErrorResponse(reply, 'Failed to save address')
  }
}

export const profileOther = async (request: FastifyRequest, reply: FastifyReply) => {
 try {
  const userId = (request.user as any)?.userId
  if (!userId) {
    return badErrorResponse(reply, 'Unauthorized user')
  }

  const body = request.body as any

  const parsed = otherSchema.parse(body)

  const profile = await upsertOther({
    userId,
    other: {...parsed}
  })

  const canApplication = await checkCanApply(userId);

  return successResponse(reply, 'Other information saved successfully', {canApplication, ...profile})

 } catch (error) {
  if (error instanceof ZodError) {
    return badErrorResponse(reply, 'Validation failed', error.errors.map(e => ({
      path: e.path.join('.'),
      message: e.message,
    })))
  }
  return serverErrorResponse(reply, 'Failed to save other information')
 }
}

export const profileCvUpload = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as any)?.userId
    if (!userId) {
      return badErrorResponse(reply, 'Unauthorized user')
    }

    let uploadedFile: { name: string; url: string } | null = null
    let oldCvFile: { name: string; url: string } | null | undefined = undefined

    const existingProfile = await getUserProfile(userId)
    oldCvFile = existingProfile?.cvFile

    const { uploadResult } = await processMultipartForm(
      request,
      ['cvFile'],
      {
        maxSize: 5 * 1024 * 1024, 
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        uploadDir: 'uploads/profile/CVs'
      }
    )

    if (!uploadResult.success) {
      if (uploadResult.validationErrors) {
        return badErrorResponse(reply, 'Validation failed', uploadResult.validationErrors)
      }
      return serverErrorResponse(reply, uploadResult.error || 'File upload failed')
    }

    if (uploadResult.files[0]) {
      uploadedFile = {
        name: uploadResult.files[0].name,
        url: uploadResult.files[0].url
      }

      if ((oldCvFile && uploadedFile) && oldCvFile.url !== uploadedFile.url) {
        await deleteFileByUrl(oldCvFile.url, 'uploads/profile/CVs')
      }

    } else {
      return badErrorResponse(reply, 'Validation failed', [{
        path: 'cvFile',
        message: 'CV file is required'
      }])
    }

    const profile = await upsertCvFile({
      userId,
      cvFile: uploadedFile
    })

    const canApplication = await checkCanApply(userId);

    return successResponse(reply, 'Profile CV uploaded successfully', {canApplication, ...profile})

  } catch (error) {
    console.error('CV upload error:', error)
    return serverErrorResponse(reply, 'Failed to upload CV')
  }
}

export const profileWorkInfo = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as any)?.userId

    if (!userId) {
      return badErrorResponse(reply, 'Unauthorized user')
    }

    const body = request.body as any

    const parsed = workInfoSchema.parse(body)

    const profile = await upsertWorkInfo({
      userId,
      workInfo: { ...parsed }
    })

    return successResponse(reply, 'Work information saved successfully.', profile)

  } catch (error) {
    if (error instanceof ZodError) {
      return badErrorResponse(reply, 'Validation failed.', error.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      })))
    }
    return serverErrorResponse(reply, 'Failed to save work information.')
  }
}

export const profileEducation = async (request: FastifyRequest, reply: FastifyReply) => {
    
  let uploadedFile: { name: string; url: string } | null = null

  try {
    const contentType = request.headers['content-type'] || ''
    const isMultipart = contentType.includes('multipart/form-data')

    const userId = (request.user as any)?.userId
    if (!userId) {
      return badErrorResponse(reply, 'Unauthorized user')
    }

    let parsed: any = {}

    if (isMultipart) {
      const { body: formBody, uploadResult } = await processMultipartForm(
        request,
        ['certificateFile'],
        {
          maxSize: 5 * 1024 * 1024, 
          allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
          uploadDir: 'uploads/profile/educations'
        }
      )

      if (!uploadResult.success) {
        if (uploadResult.files[0]) {
          if (uploadResult.files[0].url) {
            await deleteFileByUrl(uploadResult.files[0].url, 'uploads/profile/educations');
          }
        }
        if (uploadResult.validationErrors) {
          return badErrorResponse(reply, 'Validation failed', uploadResult.validationErrors)
        }
        return serverErrorResponse(reply, uploadResult.error || 'File upload failed')
      }

      uploadedFile = { name: uploadResult.files[0].name, url: uploadResult.files[0].url }

      parsed = userEducationSchema.parse(formBody)

    } else {
      parsed = userEducationSchema.parse(request.body)
    }

    let oldFile: { name: string; url: string } | null | undefined = undefined

    const existingProfile = await getUserProfile(userId)
    oldFile = existingProfile?.education?.certificateFile

    if ((oldFile && uploadedFile) && oldFile.url !== uploadedFile.url) {
      await deleteFileByUrl(oldFile.url, 'uploads/profile/educations')
    }

    const profile = await upsertEducation({
      userId,
      education: {
        ...parsed,
        certificateFile: uploadedFile || oldFile || undefined,
      }
    })

    return successResponse(reply, 'Education info saved successfully', profile)

  } catch (error) {

    if (uploadedFile) {
      await deleteFileByUrl(uploadedFile.url, 'uploads/profile/educations')
    }

    if (error instanceof ZodError) {
      return badErrorResponse(reply, 'Validation failed.', error.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      })))
    }

    return serverErrorResponse(reply, 'Failed to save education info')
  }
}

export const profileTestimonial = async (request: FastifyRequest, reply: FastifyReply) => {
    
  let uploadedFile: { name: string; url: string } | null = null

  try {
    const contentType = request.headers['content-type'] || ''
    const isMultipart = contentType.includes('multipart/form-data')

    const userId = (request.user as any)?.userId
    if (!userId) {
      return badErrorResponse(reply, 'Unauthorized user')
    }

    let parsed: any = {}

    if (isMultipart) {
      const { body: formBody, uploadResult } = await processMultipartForm(
        request,
        ['testimonialFile'],
        {
          maxSize: 5 * 1024 * 1024, 
          allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
          uploadDir: 'uploads/profile/testimonials'
        }
      )

      if (!uploadResult.success) {
        if (uploadResult.files[0]) {
          if (uploadResult.files[0].url) {
            await deleteFileByUrl(uploadResult.files[0].url, 'uploads/profile/testimonials');
          }
        }
        if (uploadResult.validationErrors) {
          return badErrorResponse(reply, 'Validation failed', uploadResult.validationErrors)
        }
        return serverErrorResponse(reply, uploadResult.error || 'File upload failed')
      }

      uploadedFile = { name: uploadResult.files[0].name, url: uploadResult.files[0].url }

      parsed = userTestimonialSchema.parse(formBody)

    } else {
      parsed = userTestimonialSchema.parse(request.body)
    }

    let oldFile: { name: string; url: string } | null | undefined = undefined

    const existingProfile = await getUserProfile(userId)
    oldFile = existingProfile?.testimonial?.testimonialFile

    if ((oldFile && uploadedFile) && oldFile.url !== uploadedFile.url) {
      await deleteFileByUrl(oldFile.url, 'uploads/profile/testimonials')
    }

    const profile = await upsertTestimonial({
      userId,
      testimonial: {
        ...parsed,
        testimonialFile: uploadedFile || oldFile || undefined,
      }
    })

    return successResponse(reply, 'Testimonial saved successfully', profile)

  } catch (error) {

    if (uploadedFile) {
      await deleteFileByUrl(uploadedFile.url, 'uploads/profile/testimonials')
    }

    if (error instanceof ZodError) {
      return badErrorResponse(reply, 'Validation failed.', error.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      })))
    }

    return serverErrorResponse(reply, 'Failed to save testimonial info')
  }
}

export const profileMyVerified = async (request: FastifyRequest, reply: FastifyReply) => {
    
  let uploadedFile: { name: string; url: string } | null = null

  try {
    const contentType = request.headers['content-type'] || ''
    const isMultipart = contentType.includes('multipart/form-data')

    const userId = (request.user as any)?.userId
    if (!userId) {
      return badErrorResponse(reply, 'Unauthorized user')
    }

    let parsed: any = {}

    if (isMultipart) {
      const { body: formBody, uploadResult } = await processMultipartForm(
        request,
        ['myVerifiedFile'],
        {
          maxSize: 5 * 1024 * 1024, 
          allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
          uploadDir: 'uploads/profile/verifies'
        }
      )

      if (!uploadResult.success) {
        if (uploadResult.files[0]) {
          if (uploadResult.files[0].url) {
            await deleteFileByUrl(uploadResult.files[0].url, 'uploads/profile/verifies');
          }
        }
        if (uploadResult.validationErrors) {
          return badErrorResponse(reply, 'Validation failed', uploadResult.validationErrors)
        }
        return serverErrorResponse(reply, uploadResult.error || 'File upload failed')
      }

      uploadedFile = { name: uploadResult.files[0].name, url: uploadResult.files[0].url }

      parsed = userMyVerifiedSchema.parse(formBody)

    } else {
      parsed = userMyVerifiedSchema.parse(request.body)
    }

    let oldFile: { name: string; url: string } | null | undefined = undefined

    const existingProfile = await getUserProfile(userId)
    oldFile = existingProfile?.myVerified?.myVerifiedFile

    if ((oldFile && uploadedFile) && oldFile.url !== uploadedFile.url) {
      await deleteFileByUrl(oldFile.url, 'uploads/profile/verifies')
    }

    const profile = await upsertMyVerified({
      userId,
      myVerified: {
        ...parsed,
        myVerifiedFile: uploadedFile || oldFile || undefined,
      }
    })

    return successResponse(reply, 'My verified info saved successfully', profile)

  } catch (error) {

    if (uploadedFile) {
      await deleteFileByUrl(uploadedFile.url, 'uploads/profile/verifies')
    }

    if (error instanceof ZodError) {
      return badErrorResponse(reply, 'Validation failed.', error.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      })))
    }

    return serverErrorResponse(reply, 'Failed to save my verified info')
  }
}

export const profileCommitmentNote = async (request: FastifyRequest, reply: FastifyReply) => {
    
  let uploadedFile: { name: string; url: string } | null = null

  try {
    const contentType = request.headers['content-type'] || ''
    const isMultipart = contentType.includes('multipart/form-data')

    const userId = (request.user as any)?.userId
    if (!userId) {
      return badErrorResponse(reply, 'Unauthorized user')
    }

    let parsed: any = {}

    if (isMultipart) {
      const { body: formBody, uploadResult } = await processMultipartForm(
        request,
        ['commitmentFile'],
        {
          maxSize: 5 * 1024 * 1024, 
          allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
          uploadDir: 'uploads/profile/commitments'
        }
      )

      if (!uploadResult.success) {
        if (uploadResult.files[0]) {
          if (uploadResult.files[0].url) {
            await deleteFileByUrl(uploadResult.files[0].url, 'uploads/profile/commitments');
          }
        }
        if (uploadResult.validationErrors) {
          return badErrorResponse(reply, 'Validation failed', uploadResult.validationErrors)
        }
        return serverErrorResponse(reply, uploadResult.error || 'File upload failed')
      }

      uploadedFile = { name: uploadResult.files[0].name, url: uploadResult.files[0].url }

      parsed = userCommitmentNoteSchema.parse(formBody)

    } else {
      parsed = userCommitmentNoteSchema.parse(request.body)
    }

    let oldFile: { name: string; url: string } | null | undefined = undefined

    const existingProfile = await getUserProfile(userId)
    oldFile = existingProfile?.commitmentNote?.commitmentFile

    if ((oldFile && uploadedFile) && oldFile.url !== uploadedFile.url) {
      await deleteFileByUrl(oldFile.url, 'uploads/profile/commitments')
    }

    const profile = await upsertCommitmentNote({
      userId,
      commitmentNote: {
        ...parsed,
        commitmentFile: uploadedFile || oldFile || undefined,
      }
    })

    return successResponse(reply, 'Understanding letter saved successfully', profile)

  } catch (error) {

    if (uploadedFile) {
      await deleteFileByUrl(uploadedFile.url, 'uploads/profile/commitments')
    }

    if (error instanceof ZodError) {
      return badErrorResponse(reply, 'Validation failed.', error.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      })))
    }

    return serverErrorResponse(reply, 'Failed to save understanding letter')
  }
}

export const profileMe = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as any)?.userId
    if (!userId) {
      return badErrorResponse(reply, 'Unauthorized user')
    }
    const profile = await getUserProfile(userId)
    if (!profile) {
      return badErrorResponse(reply, 'Profile not found')
    }
    const canApplication = await checkCanApply(userId);
    const additionalInfo = await needAdditionalInfo(userId);
    const statusApplication = await applicationStatus(userId);

    const responseData = {
      canApplication,
      needAdditionalInfo: additionalInfo,
      ...profile.toObject()
    }

    if (statusApplication) {
      responseData.applicationStatus = statusApplication
    }

    return successResponse(reply, 'Profile retrieved successfully', responseData)

  } catch (error) {
    console.error('Get profile error:', error)
    return serverErrorResponse(reply, 'Failed to retrieve profile')
  }
}