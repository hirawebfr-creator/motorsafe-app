'use client'

import { useState, useRef, useEffect } from 'react'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface Tab {
  id: string
  label: string
  icon?: React.ReactNode
  content: React.ReactNode
  disabled?: boolean
  badge?: string | number
}

interface TabsProps {
  tabs: Tab[]
  defaultTab?: string
  value?: string
  onChange?: (tabId: string) => void
  variant?: 'line' | 'pills' | 'enclosed'
  fullWidth?: boolean
  size?: 'sm' | 'md' | 'lg'
}

// ─────────────────────────────────────────────────────────────
// Design Tokens
// ─────────────────────────────────────────────────────────────

const COLORS = {
  tabDefault: '#6B7280',
  tabHover: '#374151',
  tabActive: '#0A1628',
  tabDisabled: '#9CA3AF',
  bgActivePills: '#F3F4F6',
  bgActiveEnclosed: '#FFFFFF',
  bgEnclosedContainer: '#F9FAFB',
  border: '#E5E7EB',
  indicator: '#0A1628',
  badgeBg: '#DC2626',
  badgeText: '#FFFFFF',
} as const

const SIZES = {
  sm: { height: 36, paddingX: 16, fontSize: 13 },
  md: { height: 40, paddingX: 20, fontSize: 14 },
  lg: { height: 44, paddingX: 24, fontSize: 15 },
} as const

// ─────────────────────────────────────────────────────────────
// Tabs Component
// ─────────────────────────────────────────────────────────────

export function Tabs({
  tabs,
  defaultTab,
  value,
  onChange,
  variant = 'line',
  fullWidth = false,
  size = 'md',
}: TabsProps) {
  // State
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)
  const [hoveredTab, setHoveredTab] = useState<string | null>(null)
  
  // Controlled vs uncontrolled
  const isControlled = value !== undefined
  const currentTab = isControlled ? value : activeTab
  
  // Refs
  const tabsRef = useRef<HTMLDivElement>(null)
  const indicatorRef = useRef<HTMLDivElement>(null)
  
  // Get dimensions for current size
  const dimensions = SIZES[size]
  
  // ─────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────
  
  const handleTabChange = (tabId: string) => {
    if (!isControlled) {
      setActiveTab(tabId)
    }
    onChange?.(tabId)
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const enabledTabs = tabs.filter(tab => !tab.disabled)
    const currentIndex = enabledTabs.findIndex(tab => tab.id === currentTab)
    
    let newIndex: number | null = null
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault()
        newIndex = currentIndex > 0 ? currentIndex - 1 : enabledTabs.length - 1
        break
        
      case 'ArrowRight':
        e.preventDefault()
        newIndex = currentIndex < enabledTabs.length - 1 ? currentIndex + 1 : 0
        break
        
      case 'Home':
        e.preventDefault()
        newIndex = 0
        break
        
      case 'End':
        e.preventDefault()
        newIndex = enabledTabs.length - 1
        break
    }
    
    if (newIndex !== null && enabledTabs[newIndex]) {
      handleTabChange(enabledTabs[newIndex].id)
      // Focus the new tab button
      const newTabButton = tabsRef.current?.querySelector(
        `[data-tab-id="${enabledTabs[newIndex].id}"]`
      ) as HTMLElement
      newTabButton?.focus()
    }
  }
  
  // ─────────────────────────────────────────────────────────────
  // Update indicator position (line variant only)
  // ─────────────────────────────────────────────────────────────
  
  useEffect(() => {
    if (variant !== 'line' || !tabsRef.current || !indicatorRef.current) return
    
    const activeButton = tabsRef.current.querySelector(
      `[data-tab-id="${currentTab}"]`
    ) as HTMLElement
    
    if (activeButton) {
      const { offsetLeft, offsetWidth } = activeButton
      indicatorRef.current.style.left = `${offsetLeft}px`
      indicatorRef.current.style.width = `${offsetWidth}px`
    }
  }, [currentTab, variant, tabs])
  
  // ─────────────────────────────────────────────────────────────
  // Get container styles based on variant
  // ─────────────────────────────────────────────────────────────
  
  const getContainerStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      position: 'relative',
      display: 'flex',
      gap: variant === 'line' ? '0' : '8px',
    }
    
    switch (variant) {
      case 'line':
        return {
          ...baseStyles,
          borderBottom: `1px solid ${COLORS.border}`,
        }
        
      case 'pills':
        return {
          ...baseStyles,
          padding: '4px',
        }
        
      case 'enclosed':
        return {
          ...baseStyles,
          borderRadius: '8px 8px 0 0',
          border: `1px solid ${COLORS.border}`,
          borderBottom: 'none',
          backgroundColor: COLORS.bgEnclosedContainer,
          padding: '4px 4px 0',
        }
        
      default:
        return baseStyles
    }
  }
  
  // ─────────────────────────────────────────────────────────────
  // Get tab button styles
  // ─────────────────────────────────────────────────────────────
  
  const getTabStyles = (tab: Tab): React.CSSProperties => {
    const isActive = tab.id === currentTab
    const isDisabled = tab.disabled
    const isHovered = hoveredTab === tab.id && !isDisabled && !isActive
    
    const baseStyles: React.CSSProperties = {
      flex: fullWidth ? 1 : 'none',
      height: `${dimensions.height}px`,
      padding: `0 ${dimensions.paddingX}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      fontSize: `${dimensions.fontSize}px`,
      fontWeight: isActive ? 600 : 500,
      color: isDisabled
        ? COLORS.tabDisabled
        : isActive
          ? COLORS.tabActive
          : isHovered
            ? COLORS.tabHover
            : COLORS.tabDefault,
      backgroundColor: 'transparent',
      border: 'none',
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      opacity: isDisabled ? 0.5 : 1,
      transition: 'all 0.2s ease',
      whiteSpace: 'nowrap',
      userSelect: 'none',
      position: 'relative',
      outline: 'none',
    }
    
    switch (variant) {
      case 'pills':
        return {
          ...baseStyles,
          backgroundColor: isActive ? COLORS.bgActivePills : 'transparent',
          borderRadius: '8px',
        }
        
      case 'enclosed':
        return {
          ...baseStyles,
          backgroundColor: isActive ? COLORS.bgActiveEnclosed : 'transparent',
          borderRadius: '8px 8px 0 0',
          zIndex: isActive ? 1 : 0,
          marginBottom: isActive ? '-1px' : '0',
          paddingBottom: isActive ? '1px' : '0',
        }
        
      default: // line
        return baseStyles
    }
  }
  
  // ─────────────────────────────────────────────────────────────
  // Get panel styles based on variant
  // ─────────────────────────────────────────────────────────────
  
  const getPanelStyles = (): React.CSSProperties => {
    if (variant === 'enclosed') {
      return {
        marginTop: 0,
        padding: '20px',
        backgroundColor: COLORS.bgActiveEnclosed,
        border: `1px solid ${COLORS.border}`,
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
      }
    }
    
    return {
      marginTop: '16px',
      padding: '0',
      backgroundColor: 'transparent',
      border: 'none',
      borderRadius: '0',
    }
  }
  
  // ─────────────────────────────────────────────────────────────
  // Current tab data
  // ─────────────────────────────────────────────────────────────
  
  const currentTabData = tabs.find(tab => tab.id === currentTab)
  
  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────
  
  return (
    <div style={{ width: fullWidth ? '100%' : 'auto' }}>
      {/* Tab List */}
      <div
        ref={tabsRef}
        role="tablist"
        aria-orientation="horizontal"
        style={getContainerStyles()}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === currentTab
          const isDisabled = tab.disabled
          
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              data-tab-id={tab.id}
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              aria-disabled={isDisabled}
              disabled={isDisabled}
              tabIndex={isActive ? 0 : -1}
              onClick={() => !isDisabled && handleTabChange(tab.id)}
              onKeyDown={handleKeyDown}
              onMouseEnter={() => setHoveredTab(tab.id)}
              onMouseLeave={() => setHoveredTab(null)}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = `0 0 0 2px ${COLORS.tabActive}33`
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = 'none'
              }}
              style={getTabStyles(tab)}
            >
              {/* Icon */}
              {tab.icon && (
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  {tab.icon}
                </span>
              )}
              
              {/* Label */}
              <span>{tab.label}</span>
              
              {/* Badge */}
              {tab.badge !== undefined && (
                <span
                  style={{
                    minWidth: '20px',
                    height: '20px',
                    padding: '0 6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: COLORS.badgeText,
                    backgroundColor: COLORS.badgeBg,
                    borderRadius: '10px',
                    lineHeight: 1,
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
        
        {/* Animated Indicator (line variant only) */}
        {variant === 'line' && (
          <div
            ref={indicatorRef}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: 0,
              height: '2px',
              backgroundColor: COLORS.indicator,
              transition: 'all 0.2s ease',
              borderRadius: '2px 2px 0 0',
            }}
          />
        )}
      </div>
      
      {/* Tab Panel */}
      {currentTabData && (
        <div
          role="tabpanel"
          id={`tabpanel-${currentTab}`}
          aria-labelledby={currentTab}
          tabIndex={0}
          style={getPanelStyles()}
        >
          {currentTabData.content}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Export types
// ─────────────────────────────────────────────────────────────

export type { Tab, TabsProps }
