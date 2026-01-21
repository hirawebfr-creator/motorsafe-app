import { toastManager } from './toast-container'

// ============================================================================
// TYPES
// ============================================================================

interface ShowToastParams {
  variant?: 'success' | 'error' | 'warning' | 'info'
  title: string
  description?: string
  duration?: number
}

// ============================================================================
// USE TOAST HOOK
// ============================================================================

export function useToast() {
  /**
   * Show a toast with custom options
   */
  const show = ({
    variant = 'info',
    title,
    description,
    duration = 5000,
  }: ShowToastParams): string => {
    return toastManager.add({ variant, title, description, duration })
  }

  /**
   * Show a success toast
   */
  const success = (
    title: string,
    description?: string,
    duration?: number
  ): string => {
    return show({ variant: 'success', title, description, duration })
  }

  /**
   * Show an error toast
   */
  const error = (
    title: string,
    description?: string,
    duration?: number
  ): string => {
    return show({ variant: 'error', title, description, duration })
  }

  /**
   * Show a warning toast
   */
  const warning = (
    title: string,
    description?: string,
    duration?: number
  ): string => {
    return show({ variant: 'warning', title, description, duration })
  }

  /**
   * Show an info toast
   */
  const info = (
    title: string,
    description?: string,
    duration?: number
  ): string => {
    return show({ variant: 'info', title, description, duration })
  }

  /**
   * Dismiss a specific toast by id
   */
  const dismiss = (id: string): void => {
    toastManager.remove(id)
  }

  /**
   * Dismiss all toasts
   */
  const dismissAll = (): void => {
    toastManager.clear()
  }

  return {
    show,
    success,
    error,
    warning,
    info,
    dismiss,
    dismissAll,
  }
}

// ============================================================================
// STATIC TOAST FUNCTIONS (for use outside React components)
// ============================================================================

export const toast = {
  show: (params: ShowToastParams): string => {
    return toastManager.add({
      variant: params.variant || 'info',
      title: params.title,
      description: params.description,
      duration: params.duration ?? 5000,
    })
  },

  success: (title: string, description?: string, duration?: number): string => {
    return toastManager.add({
      variant: 'success',
      title,
      description,
      duration: duration ?? 5000,
    })
  },

  error: (title: string, description?: string, duration?: number): string => {
    return toastManager.add({
      variant: 'error',
      title,
      description,
      duration: duration ?? 5000,
    })
  },

  warning: (title: string, description?: string, duration?: number): string => {
    return toastManager.add({
      variant: 'warning',
      title,
      description,
      duration: duration ?? 5000,
    })
  },

  info: (title: string, description?: string, duration?: number): string => {
    return toastManager.add({
      variant: 'info',
      title,
      description,
      duration: duration ?? 5000,
    })
  },

  dismiss: (id: string): void => {
    toastManager.remove(id)
  },

  dismissAll: (): void => {
    toastManager.clear()
  },
}

export default useToast
