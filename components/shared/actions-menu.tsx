"use client";

import { useState, useRef, useEffect } from 'react'
import { MoreHorizontal, Eye, Pencil, Trash2, LucideIcon } from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

export interface ActionItem {
  label: string
  icon?: LucideIcon
  onClick: () => void
  variant?: 'default' | 'danger'
  disabled?: boolean
}

export interface ActionsMenuProps {
  actions: ActionItem[]
}

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  trigger: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: 'transparent',
    color: '#6b7280',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  triggerHover: {
    backgroundColor: '#f3f4f6',
    color: '#374151',
  },
  dropdown: {
    position: 'absolute' as const,
    right: 0,
    top: '100%',
    marginTop: '4px',
    minWidth: '160px',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    zIndex: 50,
    overflow: 'hidden',
    padding: '4px',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    padding: '8px 12px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: 'transparent',
    color: '#374151',
    fontSize: '14px',
    fontWeight: 400,
    textAlign: 'left' as const,
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  },
  itemHover: {
    backgroundColor: '#f3f4f6',
  },
  itemDanger: {
    color: '#dc2626',
  },
  itemDangerHover: {
    backgroundColor: '#fef2f2',
  },
  itemDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    pointerEvents: 'none' as const,
  },
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ActionsMenu({ actions }: ActionsMenuProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  // Close on Escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  return (
    <div 
      ref={containerRef}
      style={{ position: 'relative', display: 'inline-block' }}
      onClick={(e) => e.stopPropagation()} // Prevent row click
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={styles.trigger}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f3f4f6'
          e.currentTarget.style.color = '#374151'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
          e.currentTarget.style.color = '#6b7280'
        }}
        aria-label="Actions"
        aria-expanded={open}
      >
        <MoreHorizontal size={18} />
      </button>

      {open && (
        <div style={styles.dropdown}>
          {actions.map((action, index) => {
            const Icon = action.icon
            const isDanger = action.variant === 'danger'
            
            return (
              <button
                key={index}
                type="button"
                onClick={() => {
                  if (!action.disabled) {
                    action.onClick()
                    setOpen(false)
                  }
                }}
                style={{
                  ...styles.item,
                  ...(isDanger ? styles.itemDanger : {}),
                  ...(action.disabled ? styles.itemDisabled : {}),
                }}
                onMouseEnter={(e) => {
                  if (!action.disabled) {
                    e.currentTarget.style.backgroundColor = isDanger ? '#fef2f2' : '#f3f4f6'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
                disabled={action.disabled}
              >
                {Icon && <Icon size={16} />}
                <span>{action.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// PRESET ACTION HELPERS
// ============================================================================

export function createViewAction(onClick: () => void): ActionItem {
  return { label: 'Voir', icon: Eye, onClick }
}

export function createEditAction(onClick: () => void): ActionItem {
  return { label: 'Modifier', icon: Pencil, onClick }
}

export function createDeleteAction(onClick: () => void): ActionItem {
  return { label: 'Supprimer', icon: Trash2, onClick, variant: 'danger' }
}

export default ActionsMenu
