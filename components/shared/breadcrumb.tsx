'use client'

import { useState } from 'react'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface BreadcrumbItem {
  label: string
  href?: string
  icon?: React.ReactNode
  onClick?: () => void
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  separator?: React.ReactNode
  maxItems?: number
  showHome?: boolean
  homeIcon?: React.ReactNode
  homeHref?: string
}

// ─────────────────────────────────────────────────────────────
// Design Tokens
// ─────────────────────────────────────────────────────────────

const COLORS = {
  textDefault: '#6B7280',
  textHover: '#111827',
  textCurrent: '#111827',
  separatorColor: '#D1D5DB',
  bgHover: '#F9FAFB',
} as const

// ─────────────────────────────────────────────────────────────
// Default Icons
// ─────────────────────────────────────────────────────────────

function ChevronRightIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: COLORS.separatorColor }}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function HomeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────
// Breadcrumb Link Component
// ─────────────────────────────────────────────────────────────

function BreadcrumbLink({
  href,
  onClick,
  isLast,
  isCollapsed,
  children,
}: {
  href?: string
  onClick?: () => void
  isLast: boolean
  isCollapsed: boolean
  children: React.ReactNode
}) {
  const [isHovered, setIsHovered] = useState(false)

  const baseStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    height: '32px',
    padding: '6px 8px',
    fontSize: '14px',
    fontWeight: isLast ? 500 : 400,
    color: isLast ? COLORS.textCurrent : isHovered ? COLORS.textHover : COLORS.textDefault,
    backgroundColor: isHovered && !isLast && !isCollapsed ? COLORS.bgHover : 'transparent',
    borderRadius: '6px',
    textDecoration: 'none',
    cursor: isCollapsed ? 'default' : isLast ? 'default' : 'pointer',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
  }

  if (href || onClick) {
    return (
      <a
        href={href}
        onClick={(e) => {
          if (onClick) {
            e.preventDefault()
            onClick()
          }
        }}
        aria-current={isLast ? 'page' : undefined}
        style={baseStyles}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {children}
      </a>
    )
  }

  return (
    <span aria-current={isLast ? 'page' : undefined} style={baseStyles}>
      {children}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────
// Breadcrumb Component
// ─────────────────────────────────────────────────────────────

export function Breadcrumb({
  items,
  separator,
  maxItems,
  showHome = true,
  homeIcon,
  homeHref = '/',
}: BreadcrumbProps) {
  const [homeHovered, setHomeHovered] = useState(false)

  // ─────────────────────────────────────────────────────────────
  // Get visible items (with collapse if needed)
  // ─────────────────────────────────────────────────────────────

  const getVisibleItems = (): BreadcrumbItem[] => {
    if (!maxItems || items.length <= maxItems) {
      return items
    }

    // Show first item + ... + last items
    const firstItem = items[0]
    const lastItems = items.slice(-(maxItems - 2))

    return [firstItem, { label: '...', href: undefined, onClick: undefined }, ...lastItems]
  }

  const visibleItems = getVisibleItems()
  const currentSeparator = separator || <ChevronRightIcon />
  const currentHomeIcon = homeIcon || <HomeIcon />

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────

  return (
    <nav
      aria-label="Fil d'Ariane"
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px',
      }}
    >
      <ol
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          listStyle: 'none',
          margin: 0,
          padding: 0,
        }}
      >
        {/* Home item */}
        {showHome && (
          <>
            <li>
              <a
                href={homeHref}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  height: '32px',
                  padding: '6px 8px',
                  fontSize: '14px',
                  color: homeHovered ? COLORS.textHover : COLORS.textDefault,
                  backgroundColor: homeHovered ? COLORS.bgHover : 'transparent',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={() => setHomeHovered(true)}
                onMouseLeave={() => setHomeHovered(false)}
                aria-label="Accueil"
              >
                {currentHomeIcon}
              </a>
            </li>

            <li aria-hidden="true" style={{ display: 'flex', alignItems: 'center' }}>
              {currentSeparator}
            </li>
          </>
        )}

        {/* Items */}
        {visibleItems.map((item, index) => {
          const isLast = index === visibleItems.length - 1
          const isCollapsed = item.label === '...'

          return (
            <li key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Item content */}
              <BreadcrumbLink
                href={item.href}
                onClick={item.onClick}
                isLast={isLast}
                isCollapsed={isCollapsed}
              >
                {item.icon && (
                  <span style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>
                )}
                <span>{item.label}</span>
              </BreadcrumbLink>

              {/* Separator (not after last item) */}
              {!isLast && (
                <span aria-hidden="true" style={{ display: 'flex', alignItems: 'center' }}>
                  {currentSeparator}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// ─────────────────────────────────────────────────────────────
// Export types
// ─────────────────────────────────────────────────────────────

export type { BreadcrumbItem, BreadcrumbProps }
