import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export interface UploadResult {
  url: string
  public_id: string
  width: number
  height: number
}

export interface UploadOptions {
  folder?: string
  transformation?: any[]
  public_id?: string
}

/**
 * Upload an image to Cloudinary
 */
export async function uploadImage(
  file: File | Buffer, 
  options: UploadOptions = {}
): Promise<UploadResult> {
  const {
    folder = 'barbershop',
    transformation = [
      { width: 800, height: 800, crop: 'limit', quality: 'auto' },
      { fetch_format: 'auto' }
    ],
    public_id = `${folder}_${Date.now()}`
  } = options

  // Convert File to Buffer if needed
  let buffer: Buffer
  if (file instanceof File) {
    const bytes = await file.arrayBuffer()
    buffer = Buffer.from(bytes)
  } else {
    buffer = file
  }

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
        transformation,
        public_id,
      },
      (error, result) => {
        if (error) {
          reject(error)
        } else if (result) {
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
            width: result.width,
            height: result.height
          })
        } else {
          reject(new Error('No result returned from Cloudinary'))
        }
      }
    ).end(buffer)
  })
}

/**
 * Delete an image from Cloudinary
 */
export async function deleteImage(public_id: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(public_id)
    return result.result === 'ok'
  } catch (error) {
    console.error('Failed to delete image:', error)
    return false
  }
}

/**
 * Generate optimized image URL with transformations
 */
export function getOptimizedImageUrl(
  public_id: string, 
  transformations: any = {}
): string {
  const defaultTransformations = {
    width: 400,
    height: 400,
    crop: 'fill',
    quality: 'auto',
    fetch_format: 'auto'
  }

  const finalTransformations = { ...defaultTransformations, ...transformations }
  
  return cloudinary.url(public_id, {
    transformation: [finalTransformations]
  })
}

/**
 * Generate responsive image URLs for different screen sizes
 */
export function getResponsiveImageUrls(public_id: string) {
  return {
    thumbnail: cloudinary.url(public_id, {
      transformation: [{ width: 100, height: 100, crop: 'fill', quality: 'auto' }]
    }),
    small: cloudinary.url(public_id, {
      transformation: [{ width: 300, height: 300, crop: 'limit', quality: 'auto' }]
    }),
    medium: cloudinary.url(public_id, {
      transformation: [{ width: 600, height: 600, crop: 'limit', quality: 'auto' }]
    }),
    large: cloudinary.url(public_id, {
      transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }]
    })
  }
}

export default cloudinary
