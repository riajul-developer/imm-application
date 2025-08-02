// controllers/profile.controller.ts
import { FastifyRequest, FastifyReply } from 'fastify'
import { ZodError } from 'zod'
import { badErrorResponse, notFoundResponse, serverErrorResponse, successResponse, unauthorizedResponse } from '../../utils/response.util'
import { userBasicInfoSchema, emergencyContactSchema, addressSchema, otherSchema, userIdentitySchema, workInfoSchema} from '../../schemas/profile.schema'
import { 
  checkCanApply, getUserProfile, needAdditionalInfo, upsertAddress, upsertAgreementFiles, upsertBasicInfo, upsertCommitmentFile, upsertCvFile,
  upsertEducationFiles, upsertEmergencyContact, upsertIdentity, upsertMyVerifiedFile, upsertNdaFiles, upsertOther, upsertTestimonialFile, upsertWorkInfo 
} from '../../services/profile.service'
import { processMultipartForm } from '../../utils/fileUpload.util'
import { deleteFileByUrl } from '../../utils/fileDelete.util'
import { application, applicationStatus } from '../../services/application.service'


export const profileBasicInfo = async (request: FastifyRequest, reply: FastifyReply) => {

  let uploadedFile: { name: string; url: string } | null = null;

  try {
    const contentType = request.headers['content-type'] || ''
    const isMultipart = contentType.includes('multipart/form-data')

    const userId = (request.user as any)?.userId
    if (!userId) {
      return unauthorizedResponse(reply, 'Unauthorized user')
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
      return unauthorizedResponse(reply, 'Unauthorized user')
    }

    let parsed: any = {};
    
    if (isMultipart) {

      const { body: formBody, uploadResult } = await processMultipartForm(
        request,
        ['nidFrontDoc', 'nidBackDoc', 'passportFrontDoc', 'passportBackDoc', 'birthRegDoc'], 
        {
          maxSize: 3 * 1024 * 1024,
          allowedTypes: [
            'image/jpeg', 
            'image/png', 
            'image/webp', 
            'application/pdf', 
            'application/msword', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          ],
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
      return unauthorizedResponse(reply, 'Unauthorized user')
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
      return unauthorizedResponse(reply, 'Unauthorized user')
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
    return unauthorizedResponse(reply, 'Unauthorized user')
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
      return unauthorizedResponse(reply, 'Unauthorized user')
    }

    let uploadedFile: { name: string; url: string } | null = null
    let oldFile: { name: string; url: string } | null | undefined = undefined

    const existingProfile = await getUserProfile(userId)
    oldFile = existingProfile?.cvFile

    const { uploadResult } = await processMultipartForm(
      request,
      ['cvFile'],
      {
        maxSize: 5 * 1024 * 1024, 
        allowedTypes: [
          'image/jpeg', 
          'image/png', 
          'image/webp', 
          'application/pdf', 
          'application/msword', 
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ],
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

      if ((oldFile && uploadedFile) && oldFile.url !== uploadedFile.url) {
        await deleteFileByUrl(oldFile.url, 'uploads/profile/CVs')
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
    return serverErrorResponse(reply, 'Failed to upload CV')
  }
}

export const profileWorkInfo = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as any)?.userId

    if (!userId) {
      return unauthorizedResponse(reply, 'Unauthorized user')
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

export const educationFilesUpload = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as any)?.userId
    if (!userId) {
      return unauthorizedResponse(reply, 'Unauthorized user')
    }

    let uploadedSscCertFile: { name: string; url: string } | null = null
    let uploadedLastCertFile: { name: string; url: string } | null = null
    let oldSscCertFile: { name: string; url: string } | null | undefined = undefined
    let oldLastCertFile: { name: string; url: string } | null | undefined = undefined

    const existingProfile = await getUserProfile(userId)
    oldSscCertFile = existingProfile?.educationFiles?.sscCertFile
    oldLastCertFile = existingProfile?.educationFiles?.lastCertFile

    const { uploadResult } = await processMultipartForm(
      request,
      ['sscCertFile', 'lastCertFile'],
      {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: [
          'image/jpeg', 
          'image/png', 
          'image/webp',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ],
        uploadDir: 'uploads/profile/educations'
      }
    )

    if (!uploadResult.success) {
      if (uploadResult.validationErrors) {
        return badErrorResponse(reply, 'Validation failed', uploadResult.validationErrors)
      }
      return serverErrorResponse(reply, uploadResult.error || 'File upload failed')
    }

    const sscCertFileData = uploadResult.files.find(file => file.fieldname === 'sscCertFile')
    const lastCertFileData = uploadResult.files.find(file => file.fieldname === 'lastCertFile')

    if (!sscCertFileData && !oldSscCertFile) {

      if (lastCertFileData) {
        await deleteFileByUrl(lastCertFileData.url, 'uploads/profile/educations')
      }

      return badErrorResponse(reply, 'Validation failed', [{
        path: 'sscCertFile',
        message: 'SSC certificate file is required'
      }])
      
    }

    if (sscCertFileData) {
      uploadedSscCertFile = {
        name: sscCertFileData.name,
        url: sscCertFileData.url
      }

      if ((oldSscCertFile && uploadedSscCertFile) && oldSscCertFile.url !== uploadedSscCertFile.url) {
        await deleteFileByUrl(oldSscCertFile.url, 'uploads/profile/educations')
      }
    }

    if (lastCertFileData) {
      uploadedLastCertFile = {
        name: lastCertFileData.name,
        url: lastCertFileData.url
      }

      if ((oldLastCertFile && uploadedLastCertFile) && oldLastCertFile.url !== uploadedLastCertFile.url) {
        await deleteFileByUrl(oldLastCertFile.url, 'uploads/profile/educations')
      }
    }

    const educationFiles = {
      sscCertFile: uploadedSscCertFile || oldSscCertFile ,
      lastCertFile: uploadedLastCertFile || oldLastCertFile || undefined
    }

    const profile = await upsertEducationFiles({
      userId,
      educationFiles
    })

    return successResponse(reply, 'Education files uploaded successfully', profile)

  } catch (error) {
    return serverErrorResponse(reply, 'Failed to upload education files')
  }
}

export const testimonialUpload = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as any)?.userId
    if (!userId) {
      return unauthorizedResponse(reply, 'Unauthorized user')
    }

    let uploadedFile: { name: string; url: string } | null = null
    let oldFile: { name: string; url: string } | null | undefined = undefined

    const existingProfile = await getUserProfile(userId)
    oldFile = existingProfile?.testimonialFile

    const { uploadResult } = await processMultipartForm(
      request,
      ['testimonialFile'],
      {
        maxSize: 5 * 1024 * 1024,
        allowedTypes: [
          'image/jpeg',
          'image/png',
          'image/webp',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ],
        uploadDir: 'uploads/profile/testimonials'
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

      if ((oldFile && uploadedFile) && oldFile.url !== uploadedFile.url) {
        await deleteFileByUrl(oldFile.url, 'uploads/profile/testimonials')
      }
    } else {
      return badErrorResponse(reply, 'Validation failed', [{
        path: 'testimonialFile',
        message: 'Testimonial file is required'
      }])
    }

    const profile = await upsertTestimonialFile({
      userId,
      testimonialFile: uploadedFile
    })

    return successResponse(reply, 'Testimonial file uploaded successfully', profile)

  } catch (error) {
    return serverErrorResponse(reply, 'Failed to upload testimonial file')
  }
}

export const myVerifiedUpload = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as any)?.userId
    if (!userId) {
      return unauthorizedResponse(reply, 'Unauthorized user')
    }

    let uploadedFile: { name: string; url: string } | null = null
    let oldFile: { name: string; url: string } | null | undefined = undefined

    const existingProfile = await getUserProfile(userId)
    oldFile = existingProfile?.myVerifiedFile

    const { uploadResult } = await processMultipartForm(
      request,
      ['myVerifiedFile'],
      {
        maxSize: 5 * 1024 * 1024,
        allowedTypes: [
          'image/jpeg',
          'image/png',
          'image/webp',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ],
        uploadDir: 'uploads/profile/verifies'
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

      if ((oldFile && uploadedFile) && oldFile.url !== uploadedFile.url) {
        await deleteFileByUrl(oldFile.url, 'uploads/profile/verifies')
      }
    } else {
      return badErrorResponse(reply, 'Validation failed', [{
        path: 'myVerifiedFile',
        message: 'My verified file is required'
      }])
    }

    const profile = await upsertMyVerifiedFile({
      userId,
      myVerifiedFile: uploadedFile
    })

    return successResponse(reply, 'My verified file uploaded successfully', profile)

  } catch (error) {
    return serverErrorResponse(reply, 'Failed to upload My verified file')
  }
}

export const commitmentUpload = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as any)?.userId
    if (!userId) {
      return unauthorizedResponse(reply, 'Unauthorized user')
    }

    let uploadedFile: { name: string; url: string } | null = null
    let oldFile: { name: string; url: string } | null | undefined = undefined

    const existingProfile = await getUserProfile(userId)
    oldFile = existingProfile?.commitmentFile

    const { uploadResult } = await processMultipartForm(
      request,
      ['commitmentFile'],
      {
        maxSize: 5 * 1024 * 1024,
        allowedTypes: [
          'image/jpeg',
          'image/png',
          'image/webp',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ],
        uploadDir: 'uploads/profile/commitments'
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

      if ((oldFile && uploadedFile) && oldFile.url !== uploadedFile.url) {
        await deleteFileByUrl(oldFile.url, 'uploads/profile/commitments')
      }
    } else {
      return badErrorResponse(reply, 'Validation failed', [{
        path: 'commitmentFile',
        message: 'Commitment file is required'
      }])
    }

    const profile = await upsertCommitmentFile({
      userId,
      commitmentFile: uploadedFile
    })

    return successResponse(reply, 'Commitment file uploaded successfully', profile)

  } catch (error) {
    return serverErrorResponse(reply, 'Failed to upload commitment file')
  }
}

export const ndaFilesUpload = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as any)?.userId
    if (!userId) {
      return unauthorizedResponse(reply, 'Unauthorized user')
    }

    let uploadedFirstPageFile: { name: string; url: string } | null = null
    let uploadedSecondPageFile: { name: string; url: string } | null = null
    let oldFirstPageFile: { name: string; url: string } | null | undefined = undefined
    let oldSecondPageFile: { name: string; url: string } | null | undefined = undefined

    const existingProfile = await getUserProfile(userId)
    oldFirstPageFile = existingProfile?.ndaFiles?.firstPageFile
    oldSecondPageFile = existingProfile?.ndaFiles?.secondPageFile

    const { uploadResult } = await processMultipartForm(
      request,
      ['firstPageFile', 'secondPageFile'],
      {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: [
          'image/jpeg', 
          'image/png', 
          'image/webp',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ],
        uploadDir: 'uploads/profile/ndas'
      }
    )

    if (!uploadResult.success) {
      if (uploadResult.validationErrors) {
        return badErrorResponse(reply, 'Validation failed', uploadResult.validationErrors)
      }
      return serverErrorResponse(reply, uploadResult.error || 'File upload failed')
    }

    const firstPageFileData = uploadResult.files.find(file => file.fieldname === 'firstPageFile')
    const secondPageFileData = uploadResult.files.find(file => file.fieldname === 'secondPageFile')

    if (!firstPageFileData && !secondPageFileData && !oldFirstPageFile && !oldSecondPageFile) {
      return badErrorResponse(reply, 'Validation failed', [{
        path: 'ndaFiles',
        message: 'At least one NDA file is required'
      }])
    }

    if (firstPageFileData) {
      uploadedFirstPageFile = {
        name: firstPageFileData.name,
        url: firstPageFileData.url
      }

      if ((oldFirstPageFile && uploadedFirstPageFile) && oldFirstPageFile.url !== uploadedFirstPageFile.url) {
        await deleteFileByUrl(oldFirstPageFile.url, 'uploads/profile/ndas')
      }
    }

    if (secondPageFileData) {
      uploadedSecondPageFile = {
        name: secondPageFileData.name,
        url: secondPageFileData.url
      }

      if ((oldSecondPageFile && uploadedSecondPageFile) && oldSecondPageFile.url !== uploadedSecondPageFile.url) {
        await deleteFileByUrl(oldSecondPageFile.url, 'uploads/profile/ndas')
      }
    }

    const ndaFiles = {
      firstPageFile: uploadedFirstPageFile || oldFirstPageFile || undefined,
      secondPageFile: uploadedSecondPageFile || oldSecondPageFile || undefined
    }

    const profile = await upsertNdaFiles({
      userId,
      ndaFiles
    })

    return successResponse(reply, 'NDA files uploaded successfully', profile)

  } catch (error) {
    return serverErrorResponse(reply, 'Failed to upload NDA files')
  }
}

export const agreementFilesUpload = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as any)?.userId
    if (!userId) {
      return unauthorizedResponse(reply, 'Unauthorized user')
    }

    let uploadedFirstPageFile: { name: string; url: string } | null = null
    let uploadedSecondPageFile: { name: string; url: string } | null = null
    let oldFirstPageFile: { name: string; url: string } | null | undefined = undefined
    let oldSecondPageFile: { name: string; url: string } | null | undefined = undefined

    const existingProfile = await getUserProfile(userId)
    oldFirstPageFile = existingProfile?.agreementFiles?.firstPageFile
    oldSecondPageFile = existingProfile?.agreementFiles?.secondPageFile

    const { uploadResult } = await processMultipartForm(
      request,
      ['firstPageFile', 'secondPageFile'],
      {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: [
          'image/jpeg', 
          'image/png', 
          'image/webp',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ],
        uploadDir: 'uploads/profile/agreements'
      }
    )

    if (!uploadResult.success) {
      if (uploadResult.validationErrors) {
        return badErrorResponse(reply, 'Validation failed', uploadResult.validationErrors)
      }
      return serverErrorResponse(reply, uploadResult.error || 'File upload failed')
    }

    const firstPageFileData = uploadResult.files.find(file => file.fieldname === 'firstPageFile')
    const secondPageFileData = uploadResult.files.find(file => file.fieldname === 'secondPageFile')

    if (!firstPageFileData && !secondPageFileData && !oldFirstPageFile && !oldSecondPageFile) {
      return badErrorResponse(reply, 'Validation failed', [{
        path: 'agreementFiles',
        message: 'At least one Agreement file is required'
      }])
    }

    if (firstPageFileData) {
      uploadedFirstPageFile = {
        name: firstPageFileData.name,
        url: firstPageFileData.url
      }

      if ((oldFirstPageFile && uploadedFirstPageFile) && oldFirstPageFile.url !== uploadedFirstPageFile.url) {
        await deleteFileByUrl(oldFirstPageFile.url, 'uploads/profile/agreements')
      }
    }

    if (secondPageFileData) {
      uploadedSecondPageFile = {
        name: secondPageFileData.name,
        url: secondPageFileData.url
      }

      if ((oldSecondPageFile && uploadedSecondPageFile) && oldSecondPageFile.url !== uploadedSecondPageFile.url) {
        await deleteFileByUrl(oldSecondPageFile.url, 'uploads/profile/agreements')
      }
    }

    const agreementFiles = {
      firstPageFile: uploadedFirstPageFile || oldFirstPageFile || undefined,
      secondPageFile: uploadedSecondPageFile || oldSecondPageFile || undefined
    }

    const profile = await upsertAgreementFiles({
      userId,
      agreementFiles
    })

    return successResponse(reply, 'Agreement files uploaded successfully', profile)

  } catch (error) {
    return serverErrorResponse(reply, 'Failed to upload Agreement files')
  }
}

export const profileMe = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as any)?.userId
    if (!userId) {
      return unauthorizedResponse(reply, 'Unauthorized user')
    }
    const profile = await getUserProfile(userId)

    if (!profile) {
      return successResponse(reply, 'Profile not found', null)
    }

    const canApplication = await checkCanApply(userId);
    const additionalInfo = await needAdditionalInfo(userId);
    const myApplication = await application(userId);

    const responseData = {
      canApplication,
      needAdditionalInfo: additionalInfo,
      ...profile.toObject()
    }

    if (myApplication) {
      responseData.application = myApplication
    }

    return successResponse(reply, 'Profile retrieved successfully', responseData)

  } catch (error) {
    return serverErrorResponse(reply, 'Failed to retrieve profile')
  }
}
