'use client'

import { useState } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number | string
  height?: number | string
  className?: string
  style?: React.CSSProperties
  onLoad?: () => void
  onError?: () => void
  fallbackIcon?: string
}

/**
 * OptimizedImage - Image avec lazy loading et fallback
 * 
 * Features:
 * - Lazy loading natif
 * - Skeleton placeholder pendant le chargement
 * - Fallback icon en cas d'erreur
 * - Décoding async pour de meilleures performances
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  style,
  onLoad,
  onError,
  fallbackIcon = '🚗'
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  
  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }
  
  const handleError = () => {
    setHasError(true)
    onError?.()
  }
  
  const placeholderStyles: React.CSSProperties = {
    width,
    height,
    backgroundColor: '#F3F4F6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    ...style
  }
  
  if (hasError) {
    return (
      <div style={placeholderStyles} className={className}>
        <span style={{ fontSize: '24px', color: '#9CA3AF' }}>{fallbackIcon}</span>
      </div>
    )
  }
  
  return (
    <>
      {!isLoaded && (
        <div
          style={placeholderStyles}
          className={className}
          aria-hidden="true"
        />
      )}
      
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        style={{
          ...style,
          display: isLoaded ? 'block' : 'none'
        }}
        className={className}
      />
    </>
  )
}

export default OptimizedImage
