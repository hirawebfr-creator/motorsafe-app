'use client'

import { useEffect, useCallback, useState } from 'react'

// ============================================================================
// USE COMMAND PALETTE HOOK
// ============================================================================
// Provides ⌘K / Ctrl+K global shortcut to toggle the command palette.
// Returns { isOpen, open, close, toggle } to control the palette state.
// ============================================================================

export interface UseCommandPaletteOptions {
  /** Disable the global ⌘K shortcut */
  disableShortcut?: boolean
}

export interface UseCommandPaletteReturn {
  /** Whether the command palette is open */
  isOpen: boolean
  /** Open the command palette */
  open: () => void
  /** Close the command palette */
  close: () => void
  /** Toggle the command palette open/closed */
  toggle: () => void
}

export function useCommandPalette(
  options: UseCommandPaletteOptions = {}
): UseCommandPaletteReturn {
  const { disableShortcut = false } = options
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((prev) => !prev), [])

  // ========================================
  // GLOBAL ⌘K / Ctrl+K SHORTCUT
  // ========================================
  useEffect(() => {
    if (disableShortcut) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for ⌘K (Mac) or Ctrl+K (Windows/Linux)
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const modifierPressed = isMac ? e.metaKey : e.ctrlKey

      if (modifierPressed && e.key.toLowerCase() === 'k') {
        // Don't trigger if user is typing in an input/textarea/contenteditable
        const target = e.target as HTMLElement
        const isEditable =
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable

        // Allow the shortcut even in editable fields (like VS Code behavior)
        // But prevent default to not type 'k'
        e.preventDefault()

        if (!isEditable) {
          // Not in editable: always toggle
          toggle()
        } else {
          // In editable: only toggle if not already open
          // This allows ESC to close without reopening
          if (!isOpen) {
            toggle()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [disableShortcut, toggle, isOpen])

  return { isOpen, open, close, toggle }
}

export default useCommandPalette
