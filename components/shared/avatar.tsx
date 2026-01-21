'use client'

import { useState } from 'react'

interface AvatarProps {
  src?: string
  alt?: string
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  shape?: 'circle' | 'square'
  status?: 'online' | 'offline' | 'away' | 'busy'
  showStatus?: boolean
  fallbackBg?: string
  fallbackColor?: string
  onClick?: () => void
}

const dimensionsMap = {
  xs: { size: 24, fontSize: 10, statusDot: 6, borderRadius: 6 },
  sm: { size: 32, fontSize: 12, statusDot: 8, borderRadius: 6 },
  md: { size: 40, fontSize: 14, statusDot: 10, borderRadius: 8 },
  lg: { size: 48, fontSize: 16, statusDot: 12, borderRadius: 8 },
  xl: { size: 64, fontSize: 20, statusDot: 14, borderRadius: 10 },
  '2xl': { size: 80, fontSize: 24, statusDot: 16, borderRadius: 12 },
}

const statusColors = {
  online: '#16A34A',
  offline: '#9CA3AF',
  away: '#F59E0B',
  busy: '#DC2626',
}

export function Avatar({
  src,
  alt,
  name = '',
  size = 'md',
  shape = 'circle',
  status,
  showStatus = false,
  fallbackBg = '#0A1628',
  fallbackColor = '#FFFFFF',
  onClick,
}: AvatarProps) {
  const [imageError, setImageError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const dimensions = dimensionsMap[size]

  const getInitials = (fullName: string): string => {
    if (!fullName) return '?'
    const parts = fullName.trim().split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return fullName.substring(0, 2).toUpperCase()
  }

  const borderRadius = shape === 'circle' ? '50%' : `${dimensions.borderRadius}px`
  const showImage = src && !imageError

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${dimensions.size}px`,
        height: `${dimensions.size}px`,
        flexShrink: 0,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.15s ease',
        transform: onClick && isHovered ? 'scale(1.05)' : 'scale(1)',
      }}
    >
      {/* Avatar container */}
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius,
          overflow: 'hidden',
          backgroundColor: fallbackBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '2px solid #FFFFFF',
        }}
      >
        {/* Image */}
        {showImage ? (
          <img
            src={src}
            alt={alt || name}
            onError={() => setImageError(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          /* Initials fallback */
          <span
            style={{
              fontSize: `${dimensions.fontSize}px`,
              fontWeight: 600,
              color: fallbackColor,
              lineHeight: 1,
              userSelect: 'none',
            }}
          >
            {getInitials(name)}
          </span>
        )}
      </div>

      {/* Status indicator */}
      {showStatus && status && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: `${dimensions.statusDot}px`,
            height: `${dimensions.statusDot}px`,
            backgroundColor: statusColors[status],
            borderRadius: '50%',
            border: '2px solid #FFFFFF',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
          }}
        />
      )}
    </div>
  )
}

Avatar.displayName = 'Avatar'
