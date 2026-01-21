'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// ============================================================================
// TYPES
// ============================================================================

export interface CommandItem {
  id: string
  type: 'navigation' | 'action' | 'client' | 'vehicle' | 'intervention'
  title: string
  description?: string
  icon?: React.ReactNode
  keywords?: string[]
  onSelect: () => void
}

export interface CommandGroup {
  title: string
  items: CommandItem[]
}

export interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  items?: CommandItem[]
  placeholder?: string
  emptyText?: string
  recentItems?: CommandItem[]
}

// ============================================================================
// ICONS
// ============================================================================

const SearchIcon = () => (
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
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
)

// ============================================================================
// GROUP TITLES
// ============================================================================

const GROUP_TITLES: Record<string, string> = {
  navigation: 'Navigation',
  action: 'Actions',
  client: 'Clients',
  vehicle: 'Véhicules',
  intervention: 'Interventions',
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const filterItems = (items: CommandItem[], query: string): CommandItem[] => {
  if (!query.trim()) return items

  const lowerQuery = query.toLowerCase()

  return items.filter((item) => {
    const titleMatch = item.title.toLowerCase().includes(lowerQuery)
    const descMatch = item.description?.toLowerCase().includes(lowerQuery)
    const keywordsMatch = item.keywords?.some((k) =>
      k.toLowerCase().includes(lowerQuery)
    )

    return titleMatch || descMatch || keywordsMatch
  })
}

const groupItems = (items: CommandItem[]): CommandGroup[] => {
  const groups: Record<string, CommandItem[]> = {}

  items.forEach((item) => {
    if (!groups[item.type]) {
      groups[item.type] = []
    }
    groups[item.type].push(item)
  })

  // Sort by priority: navigation, action, then others
  const order = ['navigation', 'action', 'client', 'vehicle', 'intervention']

  return order
    .filter((type) => groups[type] && groups[type].length > 0)
    .map((type) => ({
      title: GROUP_TITLES[type] || type,
      items: groups[type],
    }))
}

// ============================================================================
// COMMAND PALETTE COMPONENT
// ============================================================================

export function CommandPalette({
  isOpen,
  onClose,
  items = [],
  placeholder = 'Rechercher ou taper une commande...',
  emptyText = 'Aucun résultat trouvé',
  recentItems = [],
}: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [shouldRender, setShouldRender] = useState(isOpen)

  const overlayRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Stable onClose ref
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  // ========================================
  // ANIMATION LOGIC
  // ========================================
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true)
          // Focus input after animation starts
          setTimeout(() => {
            inputRef.current?.focus()
          }, 50)
        })
      })
    } else {
      setIsAnimating(false)
      const timer = setTimeout(() => {
        setShouldRender(false)
        setQuery('')
        setSelectedIndex(0)
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // ========================================
  // BLOCK BODY SCROLL
  // ========================================
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isOpen])

  // ========================================
  // ESC KEY HANDLER
  // ========================================
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCloseRef.current()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  // ========================================
  // FILTER AND GROUP ITEMS
  // ========================================
  const displayItems = query.trim()
    ? items
    : recentItems.length > 0
      ? recentItems
      : items

  const filteredItems = filterItems(displayItems, query)
  const filteredGroups = groupItems(filteredItems)
  const allItems = filteredGroups.flatMap((g) => g.items)

  // ========================================
  // KEYBOARD NAVIGATION
  // ========================================
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((prev) =>
            prev < allItems.length - 1 ? prev + 1 : prev
          )
          break

        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0))
          break

        case 'Enter':
          e.preventDefault()
          if (allItems[selectedIndex]) {
            allItems[selectedIndex].onSelect()
            onClose()
          }
          break
      }
    },
    [allItems, selectedIndex, onClose]
  )

  // ========================================
  // SCROLL TO SELECTED ITEM
  // ========================================
  useEffect(() => {
    if (!listRef.current) return

    const selectedElement = listRef.current.querySelector(
      `[data-index="${selectedIndex}"]`
    ) as HTMLElement

    if (selectedElement) {
      selectedElement.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      })
    }
  }, [selectedIndex])

  // ========================================
  // RESET SELECTION WHEN QUERY CHANGES
  // ========================================
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // ========================================
  // DON'T RENDER IF NOT NEEDED
  // ========================================
  if (!shouldRender) return null

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        onClick={(e) => {
          if (e.target === overlayRef.current) {
            onClose()
          }
        }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '80px 16px 16px',
          overflowY: 'auto',
          opacity: isAnimating ? 1 : 0,
          transition: 'opacity 150ms ease-out',
        }}
      >
        {/* Command Palette Modal */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '640px',
            maxHeight: '60vh',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            boxShadow:
              '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            opacity: isAnimating ? 1 : 0,
            transform: isAnimating ? 'scale(1)' : 'scale(0.95)',
            transition: 'opacity 200ms ease-out, transform 200ms ease-out',
          }}
        >
          {/* ====== Search Input ====== */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #E5E7EB',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            {/* Search Icon */}
            <div style={{ color: '#6B7280', flexShrink: 0 }}>
              <SearchIcon />
            </div>

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              style={{
                flex: 1,
                height: '24px',
                padding: 0,
                border: 'none',
                outline: 'none',
                fontSize: '16px',
                color: '#111827',
                backgroundColor: 'transparent',
                fontFamily: 'inherit',
              }}
            />

            {/* ESC hint */}
            <kbd
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                fontWeight: 500,
                color: '#6B7280',
                backgroundColor: '#F3F4F6',
                border: '1px solid #E5E7EB',
                borderRadius: '4px',
                fontFamily: 'monospace',
                flexShrink: 0,
              }}
            >
              ESC
            </kbd>
          </div>

          {/* ====== Results List ====== */}
          <div
            ref={listRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '8px',
            }}
          >
            {allItems.length === 0 ? (
              // Empty State
              <div
                style={{
                  padding: '48px 20px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    margin: '0 auto 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#F9FAFB',
                    borderRadius: '50%',
                    color: '#9CA3AF',
                  }}
                >
                  <SearchIcon />
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    color: '#6B7280',
                  }}
                >
                  {emptyText}
                </div>
                {query.trim() && (
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#9CA3AF',
                      marginTop: '4px',
                    }}
                  >
                    Essayez avec d'autres termes
                  </div>
                )}
              </div>
            ) : (
              // Groups
              filteredGroups.map((group, groupIndex) => (
                <div
                  key={group.title}
                  style={{
                    marginBottom:
                      groupIndex < filteredGroups.length - 1 ? '16px' : 0,
                  }}
                >
                  {/* Group Title */}
                  <div
                    style={{
                      padding: '8px 12px 4px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#6B7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {group.title}
                  </div>

                  {/* Group Items */}
                  {group.items.map((item, itemIndex) => {
                    const globalIndex =
                      filteredGroups
                        .slice(0, groupIndex)
                        .reduce((acc, g) => acc + g.items.length, 0) + itemIndex

                    const isSelected = globalIndex === selectedIndex

                    return (
                      <button
                        key={item.id}
                        type="button"
                        data-index={globalIndex}
                        onClick={() => {
                          item.onSelect()
                          onClose()
                        }}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          backgroundColor: isSelected
                            ? '#F3F4F6'
                            : 'transparent',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          color: '#111827',
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'background-color 0.1s ease',
                          marginBottom: '2px',
                        }}
                      >
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
                              color: '#6B7280',
                            }}
                          >
                            {item.icon}
                          </div>
                        )}

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: '14px',
                              fontWeight: 500,
                              color: '#111827',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {item.title}
                          </div>
                          {item.description && (
                            <div
                              style={{
                                fontSize: '12px',
                                color: '#6B7280',
                                marginTop: '2px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {item.description}
                            </div>
                          )}
                        </div>

                        {/* Enter hint (if selected) */}
                        {isSelected && (
                          <kbd
                            style={{
                              padding: '2px 6px',
                              fontSize: '11px',
                              fontWeight: 500,
                              color: '#6B7280',
                              backgroundColor: '#FFFFFF',
                              border: '1px solid #E5E7EB',
                              borderRadius: '4px',
                              fontFamily: 'monospace',
                              flexShrink: 0,
                            }}
                          >
                            ↵
                          </kbd>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>

          {/* ====== Footer Hints ====== */}
          <div
            style={{
              padding: '12px 20px',
              borderTop: '1px solid #E5E7EB',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              fontSize: '12px',
              color: '#6B7280',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <kbd
                style={{
                  padding: '2px 4px',
                  backgroundColor: '#F3F4F6',
                  border: '1px solid #E5E7EB',
                  borderRadius: '3px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                }}
              >
                ↑↓
              </kbd>
              <span>naviguer</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <kbd
                style={{
                  padding: '2px 4px',
                  backgroundColor: '#F3F4F6',
                  border: '1px solid #E5E7EB',
                  borderRadius: '3px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                }}
              >
                ↵
              </kbd>
              <span>sélectionner</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <kbd
                style={{
                  padding: '2px 4px',
                  backgroundColor: '#F3F4F6',
                  border: '1px solid #E5E7EB',
                  borderRadius: '3px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                }}
              >
                ESC
              </kbd>
              <span>fermer</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default CommandPalette
