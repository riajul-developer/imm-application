import { unlink, access, stat } from 'fs/promises'
import { join, extname } from 'path'

export interface FileDeletionResult {
  success: boolean;
  message: string;
  filePath?: string;
}

/**
 * Check if file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

/**
 * Get file info
 */
export async function getFileInfo(filePath: string) {
  try {
    const stats = await stat(filePath)
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      isFile: stats.isFile(),
      exists: true
    }
  } catch (error) {
    return {
      exists: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Delete single file from filesystem
 */
export async function deleteFile(filePath: string): Promise<FileDeletionResult> {
  try {
    // Check if file exists first
    const exists = await fileExists(filePath)
    if (!exists) {
      return {
        success: false,
        message: `File not found: ${filePath}`,
        filePath
      }
    }

    // Delete the file
    await unlink(filePath)
    
    console.log(`✅ File deleted successfully: ${filePath}`)
    return {
      success: true,
      message: 'File deleted successfully',
      filePath
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`❌ Failed to delete file: ${filePath} - ${errorMessage}`)
    
    return {
      success: false,
      message: `Failed to delete file: ${errorMessage}`,
      filePath
    }
  }
}

/**
 * Extract filename from URL
 */
export function extractFilenameFromUrl(fileUrl: string): string | null {
  try {
    // Handle different URL formats
    const url = new URL(fileUrl)
    const pathname = url.pathname
    
    // Get the last segment (filename)
    const segments = pathname.split('/').filter(Boolean)
    const filename = segments[segments.length - 1]
    
    // Validate filename has extension
    if (filename && extname(filename)) {
      return filename
    }
    
    return null
  } catch (error) {
    // Fallback for relative URLs
    const segments = fileUrl.split('/').filter(Boolean)
    const filename = segments[segments.length - 1]
    
    if (filename && extname(filename)) {
      return filename
    }
    
    return null
  }
}

/**
 * Delete file by URL
 */
export async function deleteFileByUrl(
  fileUrl: string, 
  uploadDir: string = 'uploads'
): Promise<FileDeletionResult> {
  try {
    if (!fileUrl || typeof fileUrl !== 'string') {
      return {
        success: false,
        message: 'Invalid file URL provided'
      }
    }

    // Extract filename from URL
    const filename = extractFilenameFromUrl(fileUrl)
    
    if (!filename) {
      return {
        success: false,
        message: `Could not extract filename from URL: ${fileUrl}`
      }
    }

    // Construct full file path
    const filePath = join(process.cwd(), uploadDir, filename)
    
    // Delete the file
    return await deleteFile(filePath)

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`Error deleting file by URL: ${fileUrl} - ${errorMessage}`)
    
    return {
      success: false,
      message: `Error processing file URL: ${errorMessage}`
    }
  }
}

/**
 * Delete multiple files by URLs
 */
export async function deleteMultipleFilesByUrls(
  fileUrls: string[], 
  uploadDir: string = 'uploads'
): Promise<FileDeletionResult[]> {
  const results: FileDeletionResult[] = []
  
  for (const url of fileUrls) {
    const result = await deleteFileByUrl(url, uploadDir)
    results.push(result)
  }
  
  return results
}

/**
 * Delete files by pattern (e.g., all user files)
 */
export async function deleteFilesByPattern(
  pattern: string,
  uploadDir: string = 'uploads'
): Promise<FileDeletionResult[]> {
  try {
    const { readdir } = await import('fs/promises')
    const uploadsPath = join(process.cwd(), uploadDir)
    
    // Get all files in upload directory
    const files = await readdir(uploadsPath)
    
    // Filter files by pattern
    const matchingFiles = files.filter(file => file.includes(pattern))
    
    // Delete matching files
    const results: FileDeletionResult[] = []
    for (const file of matchingFiles) {
      const filePath = join(uploadsPath, file)
      const result = await deleteFile(filePath)
      results.push(result)
    }
    
    return results
    
  } catch (error) {
    return [{
      success: false,
      message: `Error reading directory: ${error instanceof Error ? error.message : 'Unknown error'}`
    }]
  }
}

/**
 * Clean up orphaned files (files not referenced in database)
 * Note: This requires a function to get all file URLs from database
 */
export async function cleanupOrphanedFiles(
  getAllFileUrls: () => Promise<string[]>,
  uploadDir: string = 'uploads'
): Promise<{ deleted: FileDeletionResult[], kept: string[] }> {
  try {
    const { readdir } = await import('fs/promises')
    const uploadsPath = join(process.cwd(), uploadDir)
    
    // Get all files in upload directory
    const filesInDirectory = await readdir(uploadsPath)
    
    // Get all file URLs from database
    const dbFileUrls = await getAllFileUrls()
    const dbFilenames = dbFileUrls
      .map(url => extractFilenameFromUrl(url))
      .filter(Boolean) as string[]
    
    // Find orphaned files
    const orphanedFiles = filesInDirectory.filter(file => 
      !dbFilenames.includes(file)
    )
    
    // Delete orphaned files
    const deletionResults: FileDeletionResult[] = []
    for (const file of orphanedFiles) {
      const filePath = join(uploadsPath, file)
      const result = await deleteFile(filePath)
      deletionResults.push(result)
    }
    
    return {
      deleted: deletionResults,
      kept: dbFilenames
    }
    
  } catch (error) {
    return {
      deleted: [{
        success: false,
        message: `Error during cleanup: ${error instanceof Error ? error.message : 'Unknown error'}`
      }],
      kept: []
    }
  }
}