'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'

// ============================================================================
// TYPES
// ============================================================================

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  closeOnEsc?: boolean
  children: React.ReactNode
  footer?: React.ReactNode
  preventScroll?: boolean
}

// ============================================================================
// CLOSE ICON
// ============================================================================

const CloseIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

// ============================================================================
// SIZE CONFIG
// ============================================================================

const SIZE_MAP: Record<string, string> = {
  sm: '400px',
  md: '500px',
  lg: '600px',
  xl: '800px',
  full: '95vw',
}

// ============================================================================
// MODAL COMPONENT
// ============================================================================

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  children,
  footer,
  preventScroll = true,
}: ModalProps) {
  // Animation state
  const [isAnimating, setIsAnimating] = useState(false)
  const [shouldRender, setShouldRender] = useState(isOpen)

  // Refs
  const overlayRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  // Close button hover state
  const [closeHovered, setCloseHovered] = useState(false)

  // Stable onClose reference
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  // ========================================
  // ANIMATION LOGIC
  // ========================================
  useEffect(() => {
    if (isOpen) {
      // Save currently focused element
      previousActiveElement.current = document.activeElement as HTMLElement
      setShouldRender(true)
      // Trigger animation after render
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true)
        })
      })
    } else {
      setIsAnimating(false)
      // Wait for animation to complete before unmount
      const timer = setTimeout(() => {
        setShouldRender(false)
        // Restore focus to previous element
        previousActiveElement.current?.focus()
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // ========================================
  // PREVENT BODY SCROLL
  // ========================================
  useEffect(() => {
    if (isOpen && preventScroll) {
      const originalOverflow = document.body.style.overflow
      const originalPaddingRight = document.body.style.paddingRight
      
      // Calculate scrollbar width to prevent layout shift
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      
      document.body.style.overflow = 'hidden'
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`
      }
      
      return () => {
        document.body.style.overflow = originalOverflow
        document.body.style.paddingRight = originalPaddingRight
      }
    }
  }, [isOpen, preventScroll])

  // ========================================
  // ESCAPE KEY HANDLER
  // ========================================
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onCloseRef.current()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, closeOnEsc])

  // ========================================
  // FOCUS TRAP
  // ========================================
  useEffect(() => {
    if (!isOpen || !modalRef.current) return

    const modal = modalRef.current

    // Focus first focusable element
    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    if (focusableElements.length > 0) {
      // Small delay to ensure animation has started
      setTimeout(() => {
        focusableElements[0]?.focus()
      }, 50)
    }

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      const focusable = modal.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )

      if (focusable.length === 0) return

      const firstElement = focusable[0]
      const lastElement = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleTab)
    return () => document.removeEventListener('keydown', handleTab)
  }, [isOpen])

  // ========================================
  // OVERLAY CLICK HANDLER
  // ========================================
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (closeOnOverlayClick && e.target === overlayRef.current && isAnimating) {
        onClose()
      }
    },
    [closeOnOverlayClick, onClose, isAnimating]
  )

  // ========================================
  // DON'T RENDER IF NOT NEEDED
  // ========================================
  if (!shouldRender) return null

  // ========================================
  // RENDER
  // ========================================
  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        onClick={handleOverlayClick}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: size === 'full' ? 'flex-start' : 'center',
          justifyContent: 'center',
          padding: size === 'full' ? '20px' : '16px',
          overflowY: 'auto',
          opacity: isAnimating ? 1 : 0,
          transition: isAnimating 
            ? 'opacity 200ms ease-out' 
            : 'opacity 150ms ease-in',
        }}
      >
        {/* Modal */}
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
          aria-describedby={description ? 'modal-description' : undefined}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: SIZE_MAP[size] || SIZE_MAP.md,
            maxHeight: size === 'full' ? '90vh' : 'calc(100vh - 64px)',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            boxShadow:
              '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'visible',
            opacity: isAnimating ? 1 : 0,
            transform: isAnimating ? 'scale(1)' : 'scale(0.95)',
            transition: isAnimating
              ? 'opacity 200ms ease-out, transform 200ms ease-out'
              : 'opacity 150ms ease-in, transform 150ms ease-in',
          }}
        >
          {/* Header */}
          {(title || description || showCloseButton) && (
            <div
              style={{
                padding: '24px',
                paddingBottom: '16px',
                borderBottom: '1px solid #E5E7EB',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '16px',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                {title && (
                  <h2
                    id="modal-title"
                    style={{
                      fontSize: '18px',
                      fontWeight: 600,
                      color: '#111827',
                      margin: 0,
                      marginBottom: description ? '8px' : 0,
                    }}
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p
                    id="modal-description"
                    style={{
                      fontSize: '14px',
                      color: '#6B7280',
                      margin: 0,
                      lineHeight: '20px',
                    }}
                  >
                    {description}
                  </p>
                )}
              </div>

              {/* Close Button */}
              {showCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Fermer"
                  onMouseEnter={() => setCloseHovered(true)}
                  onMouseLeave={() => setCloseHovered(false)}
                  style={{
                    width: '32px',
                    height: '32px',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: closeHovered ? '#F3F4F6' : 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#6B7280',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                    flexShrink: 0,
                  }}
                >
                  <CloseIcon />
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div
            style={{
              flex: 1,
              padding: '24px',
              overflow: 'visible',
            }}
          >
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div
              style={{
                padding: '24px',
                paddingTop: '16px',
                borderTop: '1px solid #E5E7EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '12px',
              }}
            >
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ============================================================================
// MODAL HEADER (for custom layouts)
// ============================================================================

export interface ModalHeaderProps {
  title?: string
  description?: string
  onClose?: () => void
  showCloseButton?: boolean
  children?: React.ReactNode
}

export function ModalHeader({
  title,
  description,
  onClose,
  showCloseButton = false,
  children,
}: ModalHeaderProps) {
  const [closeHovered, setCloseHovered] = useState(false)

  return (
    <div
      style={{
        padding: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #E5E7EB',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '16px',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && (
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#111827',
              margin: 0,
              marginBottom: description ? '8px' : 0,
            }}
          >
            {title}
          </h2>
        )}
        {description && (
          <p
            style={{
              fontSize: '14px',
              color: '#6B7280',
              margin: 0,
              lineHeight: '20px',
            }}
          >
            {description}
          </p>
        )}
        {children}
      </div>

      {showCloseButton && onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          onMouseEnter={() => setCloseHovered(true)}
          onMouseLeave={() => setCloseHovered(false)}
          style={{
            width: '32px',
            height: '32px',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: closeHovered ? '#F3F4F6' : 'transparent',
            border: 'none',
            borderRadius: '6px',
            color: '#6B7280',
            cursor: 'pointer',
            transition: 'background-color 0.15s ease',
            flexShrink: 0,
          }}
        >
          <CloseIcon />
        </button>
      )}
    </div>
  )
}

// ============================================================================
// MODAL CONTENT (for custom layouts)
// ============================================================================

export interface ModalContentProps {
  children: React.ReactNode
  noPadding?: boolean
}

export function ModalContent({ children, noPadding = false }: ModalContentProps) {
  return (
    <div
      style={{
        flex: 1,
        padding: noPadding ? 0 : '24px',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      {children}
    </div>
  )
}

// ============================================================================
// MODAL FOOTER (for custom layouts)
// ============================================================================

export interface ModalFooterProps {
  children: React.ReactNode
  align?: 'left' | 'center' | 'right' | 'between'
}

export function ModalFooter({ children, align = 'right' }: ModalFooterProps) {
  const justifyContent =
    align === 'left'
      ? 'flex-start'
      : align === 'center'
        ? 'center'
        : align === 'between'
          ? 'space-between'
          : 'flex-end'

  return (
    <div
      style={{
        padding: '24px',
        paddingTop: '16px',
        borderTop: '1px solid #E5E7EB',
        display: 'flex',
        alignItems: 'center',
        justifyContent,
        gap: '12px',
      }}
    >
      {children}
    </div>
  )
}

// ============================================================================
// CONFIRM MODAL (pre-built pattern)
// ============================================================================

export interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'default'
  loading?: boolean
  children?: React.ReactNode
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'default',
  loading = false,
  children,
}: ConfirmModalProps) {
  const [confirmHovered, setConfirmHovered] = useState(false)
  const [cancelHovered, setCancelHovered] = useState(false)

  const confirmButtonColor =
    variant === 'danger'
      ? confirmHovered
        ? '#B91C1C'
        : '#DC2626'
      : variant === 'warning'
        ? confirmHovered
          ? '#D97706'
          : '#F59E0B'
        : confirmHovered
          ? '#0A1628'
          : '#0D1B2A'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            onMouseEnter={() => setCancelHovered(true)}
            onMouseLeave={() => setCancelHovered(false)}
            style={{
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#374151',
              backgroundColor: cancelHovered ? '#F3F4F6' : '#FFFFFF',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
              transition: 'background-color 0.15s ease',
            }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            onMouseEnter={() => setConfirmHovered(true)}
            onMouseLeave={() => setConfirmHovered(false)}
            style={{
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#FFFFFF',
              backgroundColor: confirmButtonColor,
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'background-color 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {loading && (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{
                  animation: 'spin 1s linear infinite',
                }}
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeOpacity="0.25"
                />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" />
              </svg>
            )}
            {confirmText}
          </button>
        </>
      }
    >
      {children}
    </Modal>
  )
}

export default Modal
