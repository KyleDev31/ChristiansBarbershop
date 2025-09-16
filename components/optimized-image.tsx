"use client"

import Image from 'next/image'
import { useState } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  fallback?: string
  priority?: boolean
}

export function OptimizedImage({ 
  src, 
  alt, 
  width = 400, 
  height = 400, 
  className = "",
  fallback = "/placeholder.svg?height=200&width=200",
  priority = false
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState(src)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleError = () => {
    if (!hasError) {
      setHasError(true)
      setImageSrc(fallback)
    }
  }

  const handleLoad = () => {
    setIsLoading(false)
  }

  // Generate optimized URL for Cloudinary images
  const getOptimizedSrc = (originalSrc: string) => {
    // Check if it's a Cloudinary URL
    if (originalSrc.includes('cloudinary.com')) {
      // Extract public_id from URL
      const urlParts = originalSrc.split('/')
      const publicId = urlParts[urlParts.length - 1].split('.')[0]
      
      // Generate optimized URL with transformations
      return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_${width},h_${height},c_fill,q_auto,f_auto/${publicId}`
    }
    
    // Return original URL for non-Cloudinary images
    return originalSrc
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
      )}
      <Image
        src={getOptimizedSrc(imageSrc)}
        alt={alt}
        width={width}
        height={height}
        className={`transition-opacity duration-200 ${isLoading ? 'opacity-0' : 'opacity-100'} ${className}`}
        onError={handleError}
        onLoad={handleLoad}
        priority={priority}
        unoptimized={imageSrc.includes('cloudinary.com')} // Cloudinary handles optimization
      />
    </div>
  )
}

export default OptimizedImage

