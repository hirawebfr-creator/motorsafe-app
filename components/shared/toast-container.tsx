'use client'

import { useState, useEffect } from 'react'
import { Toast } from './toast'

// ============================================================================
// TYPES
// ============================================================================

export interface ToastData {
  id: string
  variant?: 'success' | 'error' | 'warning' | 'info'
  title: string
  description?: string
  duration?: number
}

export interface ToastContainerProps {
  position?:
    | 'top-right'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-left'
    | 'top-center'
    | 'bottom-center'
}

// ============================================================================
// GLOBAL TOAST STORE
// ============================================================================

let toastsStore: ToastData[] = []
let listeners: Array<(toasts: ToastData[]) => void> = []

export const toastManager = {
  add: (toast: Omit<ToastData, 'id'>): string => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newToast = { ...toast, id }
    toastsStore = [...toastsStore, newToast]
    listeners.forEach((listener) => listener(toastsStore))
    return id
  },

  remove: (id: string): void => {
    toastsStore = toastsStore.filter((t) => t.id !== id)
    listeners.forEach((listener) => listener(toastsStore))
  },

  clear: (): void => {
    toastsStore = []
    listeners.forEach((listener) => listener(toastsStore))
  },

  subscribe: (listener: (toasts: ToastData[]) => void): (() => void) => {
    listeners.push(listener)
    // Return unsubscribe function
    return () => {
      listeners = listeners.filter((l) => l !== listener)
    }
  },

  getToasts: (): ToastData[] => {
    return toastsStore
  },
}

// ============================================================================
// POSITION STYLES
// ============================================================================

const POSITION_STYLES: Record<
  NonNullable<ToastContainerProps['position']>,
  React.CSSProperties
> = {
  'top-right': {
    top: '20px',
    right: '20px',
    alignItems: 'flex-end',
  },
  'top-left': {
    top: '20px',
    left: '20px',
    alignItems: 'flex-start',
  },
  'bottom-right': {
    bottom: '20px',
    right: '20px',
    alignItems: 'flex-end',
  },
  'bottom-left': {
    bottom: '20px',
    left: '20px',
    alignItems: 'flex-start',
  },
  'top-center': {
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    alignItems: 'center',
  },
  'bottom-center': {
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    alignItems: 'center',
  },
}

// ============================================================================
// TOAST CONTAINER COMPONENT
// ============================================================================

export function ToastContainer({ position = 'top-right' }: ToastContainerProps) {
  const [toasts, setToasts] = useState<ToastData[]>([])

  useEffect(() => {
    // Subscribe to toast changes
    const unsubscribe = toastManager.subscribe(setToasts)
    
    // Sync with current state
    setToasts(toastManager.getToasts())
    
    return unsubscribe
  }, [])

  // Don't render anything if no toasts
  if (toasts.length === 0) return null

  const positionStyles = POSITION_STYLES[position]

  // Determine if bottom position (reverse order for stacking)
  const isBottom = position.startsWith('bottom')

  return (
    <div
      style={{
        position: 'fixed',
        zIndex: 9999,
        display: 'flex',
        flexDirection: isBottom ? 'column-reverse' : 'column',
        gap: '12px',
        pointerEvents: 'none',
        ...positionStyles,
      }}
    >
      {toasts.map((toast) => (
        <div key={toast.id} style={{ pointerEvents: 'auto' }}>
          <Toast
            id={toast.id}
            variant={toast.variant}
            title={toast.title}
            description={toast.description}
            duration={toast.duration}
            isVisible={true}
            onClose={toastManager.remove}
          />
        </div>
      ))}
    </div>
  )
}

export default ToastContainer
