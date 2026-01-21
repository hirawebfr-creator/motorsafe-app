'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'

interface TooltipProps {
  content: string | React.ReactNode
  children: React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  align?: 'start' | 'center' | 'end'
  delayDuration?: number
  disabled?: boolean
  maxWidth?: number
}

export function Tooltip({
  content,
  children,
  side = 'top',
  align = 'center',
  delayDuration = 400,
  disabled = false,
  maxWidth = 280,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  const triggerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const offset = 8 // Distance between trigger and tooltip

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const tooltipRect = tooltipRef.current.getBoundingClientRect()

    let top = 0
    let left = 0

    // Calculate position based on side
    switch (side) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - offset
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2
        break

      case 'bottom':
        top = triggerRect.bottom + offset
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2
        break

      case 'left':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2
        left = triggerRect.left - tooltipRect.width - offset
        break

      case 'right':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2
        left = triggerRect.right + offset
        break
    }

    // Adjust based on alignment
    if (side === 'top' || side === 'bottom') {
      if (align === 'start') {
        left = triggerRect.left
      } else if (align === 'end') {
        left = triggerRect.right - tooltipRect.width
      }
    } else {
      if (align === 'start') {
        top = triggerRect.top
      } else if (align === 'end') {
        top = triggerRect.bottom - tooltipRect.height
      }
    }

    // Keep within viewport
    const margin = 8
    left = Math.max(margin, Math.min(left, window.innerWidth - tooltipRect.width - margin))
    top = Math.max(margin, Math.min(top, window.innerHeight - tooltipRect.height - margin))

    setPosition({ top, left })
  }, [side, align])

  // Recalculate on scroll/resize
  useEffect(() => {
    if (!isVisible) return

    const handleUpdate = () => {
      calculatePosition()
    }

    window.addEventListener('scroll', handleUpdate, true)
    window.addEventListener('resize', handleUpdate)

    return () => {
      window.removeEventListener('scroll', handleUpdate, true)
      window.removeEventListener('resize', handleUpdate)
    }
  }, [isVisible, calculatePosition])

  const handleMouseEnter = () => {
    if (disabled) return

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
      requestAnimationFrame(() => {
        setIsAnimating(true)
        calculatePosition()
      })
    }, delayDuration)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    setIsAnimating(false)
    setTimeout(() => {
      setIsVisible(false)
    }, 100)
  }

  const getArrowStyle = (): React.CSSProperties => {
    const arrowBase: React.CSSProperties = {
      position: 'absolute',
      width: 0,
      height: 0,
      borderStyle: 'solid',
    }

    switch (side) {
      case 'top':
        return {
          ...arrowBase,
          bottom: '-6px',
          left: align === 'start' ? '16px' : align === 'end' ? 'calc(100% - 22px)' : '50%',
          transform: align === 'center' ? 'translateX(-50%)' : 'none',
          borderWidth: '6px 6px 0 6px',
          borderColor: '#111827 transparent transparent transparent',
        }

      case 'bottom':
        return {
          ...arrowBase,
          top: '-6px',
          left: align === 'start' ? '16px' : align === 'end' ? 'calc(100% - 22px)' : '50%',
          transform: align === 'center' ? 'translateX(-50%)' : 'none',
          borderWidth: '0 6px 6px 6px',
          borderColor: 'transparent transparent #111827 transparent',
        }

      case 'left':
        return {
          ...arrowBase,
          right: '-6px',
          top: align === 'start' ? '16px' : align === 'end' ? 'calc(100% - 22px)' : '50%',
          transform: align === 'center' ? 'translateY(-50%)' : 'none',
          borderWidth: '6px 0 6px 6px',
          borderColor: 'transparent transparent transparent #111827',
        }

      case 'right':
        return {
          ...arrowBase,
          left: '-6px',
          top: align === 'start' ? '16px' : align === 'end' ? 'calc(100% - 22px)' : '50%',
          transform: align === 'center' ? 'translateY(-50%)' : 'none',
          borderWidth: '6px 6px 6px 0',
          borderColor: 'transparent #111827 transparent transparent',
        }

      default:
        return arrowBase
    }
  }

  return (
    <>
      {/* Trigger */}
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
        style={{ display: 'inline-block' }}
      >
        {children}
      </div>

      {/* Tooltip */}
      {isVisible && (
        <div
          ref={tooltipRef}
          role="tooltip"
          style={{
            position: 'fixed',
            top: `${position.top}px`,
            left: `${position.left}px`,
            zIndex: 100,
            padding: '8px 12px',
            backgroundColor: '#111827',
            color: '#FFFFFF',
            fontSize: '13px',
            lineHeight: '18px',
            fontWeight: 500,
            borderRadius: '6px',
            boxShadow:
              '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            maxWidth: `${maxWidth}px`,
            wordWrap: 'break-word',
            pointerEvents: 'none',
            opacity: isAnimating ? 1 : 0,
            transition: 'opacity 150ms ease-out',
          }}
        >
          {content}

          {/* Arrow */}
          <div style={getArrowStyle()} />
        </div>
      )}
    </>
  )
}

Tooltip.displayName = 'Tooltip'
