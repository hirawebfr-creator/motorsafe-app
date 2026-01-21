'use client'

import { useId } from 'react'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  width?: string | number
  height?: string | number
  count?: number
  animate?: boolean
}

// ─────────────────────────────────────────────────────────────
// Design Tokens
// ─────────────────────────────────────────────────────────────

const COLORS = {
  bgBase: '#E5E7EB',
  shimmerHighlight: '#F3F4F6',
} as const

// ─────────────────────────────────────────────────────────────
// Skeleton Component
// ─────────────────────────────────────────────────────────────

export function Skeleton({
  variant = 'text',
  width,
  height,
  count = 1,
  animate = true,
}: SkeletonProps) {
  const id = useId()

  // ─────────────────────────────────────────────────────────────
  // Dimension Helpers
  // ─────────────────────────────────────────────────────────────

  const getWidth = (): string => {
    if (typeof width === 'number') return `${width}px`
    if (width) return width

    // Default widths
    switch (variant) {
      case 'circular':
        return '40px'
      default:
        return '100%'
    }
  }

  const getHeight = (): string => {
    if (typeof height === 'number') return `${height}px`
    if (height) return height

    // Default heights
    switch (variant) {
      case 'text':
        return '1em'
      case 'circular':
        // Match width if no height specified
        if (typeof width === 'number') return `${width}px`
        if (width) return width
        return '40px'
      case 'rectangular':
      case 'rounded':
        return '200px'
      default:
        return '1em'
    }
  }

  const getBorderRadius = (): string => {
    switch (variant) {
      case 'text':
        return '4px'
      case 'circular':
        return '50%'
      case 'rectangular':
        return '0'
      case 'rounded':
        return '8px'
      default:
        return '4px'
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Styles
  // ─────────────────────────────────────────────────────────────

  const skeletonStyle: React.CSSProperties = {
    display: 'block',
    width: getWidth(),
    height: getHeight(),
    backgroundColor: COLORS.bgBase,
    borderRadius: getBorderRadius(),
    background: animate
      ? `linear-gradient(90deg, ${COLORS.bgBase} 0%, ${COLORS.shimmerHighlight} 50%, ${COLORS.bgBase} 100%)`
      : COLORS.bgBase,
    backgroundSize: animate ? '200% 100%' : 'auto',
    animation: animate ? 'skeleton-shimmer 1.5s ease-in-out infinite' : 'none',
  }

  // ─────────────────────────────────────────────────────────────
  // Keyframes Style
  // ─────────────────────────────────────────────────────────────

  const keyframesStyle = `
    @keyframes skeleton-shimmer {
      0% {
        background-position: -200% 0;
      }
      100% {
        background-position: 200% 0;
      }
    }
  `

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────

  // Multiple skeletons
  if (count > 1) {
    return (
      <>
        {animate && (
          <style dangerouslySetInnerHTML={{ __html: keyframesStyle }} />
        )}
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={`${id}-${index}`}
            style={{
              ...skeletonStyle,
              marginBottom: variant === 'text' && index < count - 1 ? '8px' : '0',
            }}
          />
        ))}
      </>
    )
  }

  // Single skeleton
  return (
    <>
      {animate && (
        <style dangerouslySetInnerHTML={{ __html: keyframesStyle }} />
      )}
      <div style={skeletonStyle} />
    </>
  )
}

// ─────────────────────────────────────────────────────────────
// Helper Components
// ─────────────────────────────────────────────────────────────

/**
 * Avatar with text skeleton - common loading pattern
 */
export function SkeletonAvatar({ size = 40 }: { size?: number }) {
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <Skeleton variant="circular" width={size} height={size} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <Skeleton variant="text" width="60%" />
        <div style={{ marginTop: '6px' }}>
          <Skeleton variant="text" width="40%" />
        </div>
      </div>
    </div>
  )
}

/**
 * Card skeleton - image with title and description
 */
export function SkeletonCard({ imageHeight = 160 }: { imageHeight?: number }) {
  return (
    <div
      style={{
        padding: '20px',
        border: '1px solid #E5E7EB',
        borderRadius: '12px',
        backgroundColor: '#FFFFFF',
      }}
    >
      <Skeleton variant="rounded" width="100%" height={imageHeight} />
      <div style={{ marginTop: '16px' }}>
        <Skeleton variant="text" width="80%" height="24px" />
        <div style={{ marginTop: '8px' }}>
          <Skeleton variant="text" count={2} />
        </div>
      </div>
    </div>
  )
}

/**
 * Table row skeleton
 */
export function SkeletonTableRow({ columns = 4 }: { columns?: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index} style={{ padding: '12px 16px' }}>
          <Skeleton variant="text" />
        </td>
      ))}
    </tr>
  )
}

/**
 * List item skeleton
 */
export function SkeletonListItem() {
  return (
    <div
      style={{
        display: 'flex',
        gap: '12px',
        padding: '16px',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
      }}
    >
      <Skeleton variant="circular" width={40} height={40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <Skeleton variant="text" width="40%" />
        <div style={{ marginTop: '6px' }}>
          <Skeleton variant="text" width="60%" />
        </div>
      </div>
      <Skeleton variant="rounded" width={80} height={32} />
    </div>
  )
}

/**
 * KPI Card skeleton
 */
export function SkeletonKpiCard() {
  return (
    <div
      style={{
        padding: '20px',
        backgroundColor: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '12px',
      }}
    >
      <Skeleton variant="text" width="50%" height="20px" />
      <div style={{ marginTop: '12px' }}>
        <Skeleton variant="text" width="80%" height="40px" />
      </div>
      <div style={{ marginTop: '8px' }}>
        <Skeleton variant="text" width="30%" height="16px" />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Export types
// ─────────────────────────────────────────────────────────────

export type { SkeletonProps }
