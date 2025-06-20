import { MultipartFile } from '@fastify/multipart'
import path from 'path'
import fs from 'fs/promises'

export const uploadFiles = async (file: MultipartFile): Promise<string> => {
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  
  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error('Invalid file type. Only JPG, PNG, PDF, DOC files are allowed.')
  }
  
  const uploadDir = './uploads'
  await fs.mkdir(uploadDir, { recursive: true })
  
  const filename = `${Date.now()}-${file.filename}`
  const filepath = path.join(uploadDir, filename)
  
  const buffer = await file.toBuffer()
  await fs.writeFile(filepath, buffer)
  
  return filename
}