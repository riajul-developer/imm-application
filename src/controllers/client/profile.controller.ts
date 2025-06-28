// controllers/profile.controller.ts
import { FastifyRequest, FastifyReply } from 'fastify'
import { ZodError } from 'zod'
import { badErrorResponse, serverErrorResponse, successResponse } from '../../utils/response.util'
import { userProfileBasicInfoSchema, userProfileEducationSchema, emergencyContactSchema, addressSchema, otherSchema, userProfileIdentitySchema } from '../../schemas/profile.schema'
import { checkCanApply, getUserProfile, upsertAddress, upsertBasicInfo, upsertCvFile, upsertEducation, upsertEmergencyContact, upsertIdentity, upsertOther } from '../../services/profile.service'
import { processMultipartForm } from '../../utils/fileUpload.util'
import { deleteFileByUrl } from '../../utils/fileDelete.util'


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

      if (uploadResult.files.length > 0) {
        uploadedFile = {
          name: uploadResult.files[0].name,
          url: uploadResult.files[0].url
        }
      }

      parsed = userProfileBasicInfoSchema.parse(formBody)
      
      if ((uploadedFile && oldProfilePicFile?.url) && oldProfilePicFile.url !== uploadedFile?.url) {
        await deleteFileByUrl(oldProfilePicFile.url, 'uploads/profile/basics')
      } 

    } else {
      parsed = userProfileBasicInfoSchema.parse(request.body)
    }

    const profile = await upsertBasicInfo({
      userId,
      basic: {
        ...parsed,
        phone: (request.user as any)?.phoneNumber,
        profilePicFile: uploadedFile || oldProfilePicFile || undefined,
      }
    })

    const canApply = await checkCanApply(userId);

    return successResponse(reply, 'Basic profile info saved successfully', {canApply, ...profile})

  } catch (error) {

    if (uploadedFile) {
      await deleteFileByUrl(uploadedFile.url, 'uploads/profile/basics')
    }

    if (error instanceof ZodError) {
      return badErrorResponse(reply, 'Validation faileds', error.errors.map(e => ({
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

      parsed = userProfileIdentitySchema.parse(formBody)

    } else {
      parsed = userProfileIdentitySchema.parse(request.body)
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

    const canApply = await checkCanApply(userId);

    return successResponse(reply, 'Profile identity saved successfully', {canApply, ...profile})
    
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
      emergencyContact: {
        name: parsed.name,
        phone: parsed.phone
      }
    })

    const canApply = await checkCanApply(userId);

    return successResponse(reply, 'Emergency contact saved successfully', {canApply, ...profile})

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
        present: {
          district: parsed.present.district,
          upazila: parsed.present.upazila,
          street: parsed.present.street
        },
        permanent: {
          district: parsed.permanent.district,
          upazila: parsed.permanent.upazila,
          street: parsed.permanent.street
        }
      }
    })

    const canApply = await checkCanApply(userId);

    return successResponse(reply, 'Address saved successfully', {canApply, ...profile})

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
     other: {
       fathersName: parsed.fathersName,
       mothersName: parsed.mothersName,
       religion: parsed.religion,
       gender: parsed.gender,
       maritalStatus: parsed.maritalStatus
     }
   })

   const canApply = await checkCanApply(userId);

   return successResponse(reply, 'Other information saved successfully', {canApply, ...profile})

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
       maxSize: 5 * 1024 * 1024, // 5MB for CV
       allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
       uploadDir: 'uploads/profile/CVs'
     }
   )

   if (!uploadResult.success) {
     if (uploadResult.validationErrors) {
       return badErrorResponse(reply, 'Validation failed', uploadResult.validationErrors)
     }
     return serverErrorResponse(reply, uploadResult.error || 'File upload failed')
   }

   if (uploadResult.files.length > 0) {
    uploadedFile = {
      name: uploadResult.files[0].name,
      url: uploadResult.files[0].url
    }

    if (oldCvFile?.url && oldCvFile.url !== uploadedFile.url) {
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

   const canApply = await checkCanApply(userId);

   return successResponse(reply, 'Profile CV uploaded successfully', {canApply, ...profile})

 } catch (error) {
   console.error('CV upload error:', error)
   return serverErrorResponse(reply, 'Failed to upload CV')
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

   const canApply = await checkCanApply(userId);

   return successResponse(reply, 'Profile retrieved successfully', {canApply, ...profile.toObject()})

 } catch (error) {
   console.error('Get profile error:', error)
   return serverErrorResponse(reply, 'Failed to retrieve profile')
 }
}