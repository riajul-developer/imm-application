import { createWriteStream } from 'fs'
import { pipeline } from 'stream/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { mkdir } from 'fs/promises'
import { MultipartFile } from '@fastify/multipart'
import { FastifyRequest } from 'fastify'

export interface UploadedFile {
  name: string;
  url: string;
  path: string;
  size: number;
  fieldname: string;
}

export interface FileUploadOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  uploadDir?: string;
}

export interface FileUploadResult {
  success: boolean;
  files: UploadedFile[];
  error?: string;
  validationErrors?: Array<{ path: string; message: string }>;
}

const DEFAULT_OPTIONS: Required<FileUploadOptions> = {
  maxSize: 3 * 1024 * 1024, // 3MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  uploadDir: 'uploads'
}

export async function uploadSingleFile(
  part: MultipartFile,
  request: FastifyRequest,
  options: FileUploadOptions = {}
): Promise<FileUploadResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  
  try {
    // Validate file type
    if (!opts.allowedTypes.includes(part.mimetype)) {
      return {
        success: false,
        files: [],
        validationErrors: [{
          path: part.fieldname,
          message: `Invalid file type. Only ${opts.allowedTypes.join(', ')} allowed`
        }]
      }
    }

    // Ensure uploads directory exists
    const uploadsDir = join(process.cwd(), opts.uploadDir)
    await mkdir(uploadsDir, { recursive: true })

    // Generate unique filename
    const fileExtension = part.filename?.split('.').pop() || 'jpg'
    const uniqueFilename = `${randomUUID()}.${fileExtension}`
    const filePath = join(uploadsDir, uniqueFilename)

    // Create write stream and save file
    const writeStream = createWriteStream(filePath)
    await pipeline(part.file, writeStream)

    // Check file size after saving
    const stats = await import('fs').then(fs => fs.promises.stat(filePath))
    if (stats.size > opts.maxSize) {
      // Delete the file if too large
      await import('fs').then(fs => fs.promises.unlink(filePath))
      return {
        success: false,
        files: [],
        validationErrors: [{
          path: part.fieldname,
          message: `File size must be less than or equal to ${Math.round(opts.maxSize / (1024 * 1024))}MB`
        }]
      }
    }

    // Create file URL
    const fileUrl = `${request.protocol}://${request.headers.host}:8088/${opts.uploadDir}/${uniqueFilename}`
    
    const uploadedFile: UploadedFile = {
      name: part.filename || uniqueFilename,
      url: fileUrl,
      path: filePath,
      size: stats.size,
      fieldname: part.fieldname 
    }

    return {
      success: true,
      files: [uploadedFile]
    }

  } catch (error) {
    console.error('File upload error:', error)
    return {
      success: false,
      files: [],
      error: 'Failed to upload file'
    }
  }
}

/**
 * Process multipart form data with file uploads
 */
async function handleFilePart(
  part: MultipartFile,
  request: FastifyRequest,
  options: FileUploadOptions,
  allFiles: UploadedFile[],
  validationErrors: Array<{ path: string; message: string }>
): Promise<{ hasError: boolean; errorMessage: string }> {
  const result = await uploadSingleFile(part, request, options)
  let hasError = false
  let errorMessage = ''
  if (result.success) {
    allFiles.push(...result.files)
  } else {
    hasError = true
    if (result.validationErrors) {
      validationErrors.push(...result.validationErrors)
    }
    if (result.error) {
      errorMessage = result.error
    }
  }
  return { hasError, errorMessage }
}

export async function processMultipartForm(
  request: FastifyRequest,
  fileFieldNames: string[] = ['profilePic'],
  options: FileUploadOptions = {}
): Promise<{
  body: Record<string, any>;
  uploadResult: FileUploadResult;
}> {
  const body: Record<string, any> = {}
  let allFiles: UploadedFile[] = []
  let validationErrors: Array<{ path: string; message: string }> = []
  let hasError = false
  let errorMessage = ''

  try {
    for await (const part of request.parts()) {
      if (part.type === 'file' && fileFieldNames.includes(part.fieldname)) {
        const result = await handleFilePart(part, request, options, allFiles, validationErrors)
        if (result.hasError) {
          hasError = true
          if (result.errorMessage) {
            errorMessage = result.errorMessage
          }
        }
      } else if (part.type === 'field') {
        body[part.fieldname] = part.value
      }
    }

    return {
      body,
      uploadResult: {
        success: !hasError,
        files: allFiles,
        error: errorMessage || undefined,
        validationErrors: validationErrors.length > 0 ? validationErrors : undefined
      }
    }

  } catch (error) {
    return {
      body,
      uploadResult: {
        success: false,
        files: [],
        error: 'Failed to process form data'
      }
    }
  }
}