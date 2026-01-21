'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'

interface DropdownMenuItem {
  id: string
  label?: string
  icon?: React.ReactNode
  description?: string
  onClick?: () => void
  href?: string
  disabled?: boolean
  danger?: boolean
  separator?: boolean
}

interface DropdownMenuProps {
  trigger: React.ReactNode
  items: DropdownMenuItem[]
  align?: 'left' | 'right' | 'center'
  side?: 'bottom' | 'top'
  disabled?: boolean
}

export function DropdownMenu({
  trigger,
  items,
  align = 'left',
  side = 'bottom',
  disabled = false,
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const triggerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Get valid (non-separator, non-disabled) items for keyboard navigation
  const validItems = items.filter((item) => !item.separator && !item.disabled)

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setHighlightedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
        setHighlightedIndex(-1)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  // Reset highlighted index when menu opens
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(-1)
    }
  }, [isOpen])

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return

      if (!isOpen) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault()
          setIsOpen(true)
        }
        return
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setHighlightedIndex((prev) => (prev < validItems.length - 1 ? prev + 1 : 0))
          break

        case 'ArrowUp':
          e.preventDefault()
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : validItems.length - 1))
          break

        case 'Enter':
        case ' ':
          e.preventDefault()
          if (highlightedIndex >= 0 && highlightedIndex < validItems.length) {
            const item = validItems[highlightedIndex]
            if (item.onClick) {
              item.onClick()
            }
            if (item.href) {
              window.location.href = item.href
            }
            setIsOpen(false)
            setHighlightedIndex(-1)
          }
          break
      }
    },
    [isOpen, highlightedIndex, validItems, disabled]
  )

  const handleTriggerClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
    }
  }

  const handleItemClick = (item: DropdownMenuItem) => {
    if (item.disabled) return
    item.onClick?.()
    setIsOpen(false)
    setHighlightedIndex(-1)
  }

  const getMenuPosition = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'absolute',
      zIndex: 50,
      minWidth: '200px',
      maxWidth: '280px',
    }

    if (side === 'top') {
      base.bottom = '100%'
      base.marginBottom = '8px'
    } else {
      base.top = '100%'
      base.marginTop = '8px'
    }

    if (align === 'right') {
      base.right = 0
    } else if (align === 'center') {
      base.left = '50%'
      base.transform = 'translateX(-50%)'
    } else {
      base.left = 0
    }

    return base
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Trigger */}
      <div
        ref={triggerRef}
        role="button"
        aria-haspopup="true"
        aria-expanded={isOpen}
        tabIndex={disabled ? -1 : 0}
        onClick={handleTriggerClick}
        onKeyDown={handleKeyDown}
        style={{
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          outline: 'none',
        }}
      >
        {trigger}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          style={{
            ...getMenuPosition(),
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            boxShadow:
              '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            padding: '4px',
            animation: 'dropdown-appear 150ms ease-out',
          }}
        >
          {items.map((item, index) => {
            // Separator
            if (item.separator) {
              return (
                <div
                  key={`separator-${index}`}
                  style={{
                    height: '1px',
                    backgroundColor: '#F3F4F6',
                    margin: '4px 0',
                  }}
                />
              )
            }

            const validIndex = validItems.findIndex((vi) => vi.id === item.id)
            const isHighlighted = validIndex === highlightedIndex

            const ItemContent = (
              <>
                {/* Icon */}
                {item.icon && (
                  <div
                    style={{
                      flexShrink: 0,
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: item.danger ? '#DC2626' : '#6B7280',
                    }}
                  >
                    {item.icon}
                  </div>
                )}

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: item.disabled
                        ? '#9CA3AF'
                        : item.danger
                          ? '#DC2626'
                          : '#111827',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.label}
                  </div>
                  {item.description && (
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#6B7280',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginTop: '2px',
                      }}
                    >
                      {item.description}
                    </div>
                  )}
                </div>
              </>
            )

            const itemStyle: React.CSSProperties = {
              width: '100%',
              minHeight: item.description ? '48px' : '40px',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: isHighlighted
                ? item.danger
                  ? '#FEF2F2'
                  : '#F9FAFB'
                : 'transparent',
              border: 'none',
              borderRadius: '6px',
              textAlign: 'left',
              cursor: item.disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
              textDecoration: 'none',
              opacity: item.disabled ? 0.5 : 1,
            }

            // Link item
            if (item.href && !item.disabled) {
              return (
                <a
                  key={item.id}
                  href={item.href}
                  role="menuitem"
                  style={itemStyle}
                  onClick={() => {
                    item.onClick?.()
                    setIsOpen(false)
                    setHighlightedIndex(-1)
                  }}
                  onMouseEnter={() => setHighlightedIndex(validIndex)}
                  onMouseLeave={() => setHighlightedIndex(-1)}
                >
                  {ItemContent}
                </a>
              )
            }

            // Button item
            return (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                style={itemStyle}
                onClick={() => handleItemClick(item)}
                onMouseEnter={() => !item.disabled && setHighlightedIndex(validIndex)}
                onMouseLeave={() => setHighlightedIndex(-1)}
              >
                {ItemContent}
              </button>
            )
          })}

          {/* Animation keyframes */}
          <style
            dangerouslySetInnerHTML={{
              __html: `
              @keyframes dropdown-appear {
                from {
                  opacity: 0;
                  transform: scale(0.95)${align === 'center' ? ' translateX(-50%)' : ''};
                }
                to {
                  opacity: 1;
                  transform: scale(1)${align === 'center' ? ' translateX(-50%)' : ''};
                }
              }
            `,
            }}
          />
        </div>
      )}
    </div>
  )
}

DropdownMenu.displayName = 'DropdownMenu'
