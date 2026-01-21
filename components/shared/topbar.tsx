'use client'

import { useState, useEffect, useRef } from 'react'

// ============================================================================
// TYPES
// ============================================================================

export interface TopBarUser {
  name: string
  email: string
  avatar?: string
  role?: string
}

export interface TopBarProps {
  user?: TopBarUser
  garageName?: string
  onSearchClick?: () => void
  onNotificationsClick?: () => void
  onLogout?: () => void
  onProfileClick?: () => void
  onSettingsClick?: () => void
  notificationCount?: number
}

// ============================================================================
// ICONS
// ============================================================================

const SearchIcon = () => (
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
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
)

const BellIcon = () => (
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
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
)

const ChevronDownIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      color: '#6B7280',
      transition: 'transform 0.15s ease',
      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
    }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const UserIcon = () => (
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
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const SettingsIcon = () => (
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
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
)

const LogoutIcon = () => (
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
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)

// ============================================================================
// TOPBAR COMPONENT
// ============================================================================

export function TopBar({
  user,
  garageName,
  onSearchClick,
  onNotificationsClick,
  onLogout,
  onProfileClick,
  onSettingsClick,
  notificationCount = 0,
}: TopBarProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [searchHovered, setSearchHovered] = useState(false)
  const [bellHovered, setBellHovered] = useState(false)
  const [userButtonHovered, setUserButtonHovered] = useState(false)
  const [profileHovered, setProfileHovered] = useState(false)
  const [settingsHovered, setSettingsHovered] = useState(false)
  const [logoutHovered, setLogoutHovered] = useState(false)

  const userMenuRef = useRef<HTMLDivElement>(null)
  const userButtonRef = useRef<HTMLButtonElement>(null)

  // ========================================
  // MOBILE DETECTION
  // ========================================
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // ========================================
  // CLOSE DROPDOWN ON OUTSIDE CLICK
  // ========================================
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node) &&
        userButtonRef.current &&
        !userButtonRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false)
      }
    }

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isUserMenuOpen])

  // ========================================
  // CLOSE DROPDOWN ON ESC
  // ========================================
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isUserMenuOpen) {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isUserMenuOpen])

  // ========================================
  // GET USER INITIALS
  // ========================================
  const getUserInitials = (name: string): string => {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        width: '100%',
        height: '64px',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB',
        boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: '24px',
      }}
    >
      {/* ====== Logo + Garage Name ====== */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div
          style={{
            width: '32px',
            height: '32px',
            backgroundColor: '#0A1628',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '14px',
            color: '#FFFFFF',
            letterSpacing: '-0.5px',
          }}
        >
          MS
        </div>

        {/* Garage Name (desktop only) */}
        {!isMobile && garageName && (
          <>
            <div
              style={{
                width: '1px',
                height: '24px',
                backgroundColor: '#E5E7EB',
              }}
            />
            <span
              style={{
                fontSize: '14px',
                fontWeight: 500,
                color: '#111827',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '200px',
              }}
            >
              {garageName}
            </span>
          </>
        )}
      </div>

      {/* ====== Search Button (⌘K) ====== */}
      <button
        type="button"
        onClick={onSearchClick}
        onMouseEnter={() => setSearchHovered(true)}
        onMouseLeave={() => setSearchHovered(false)}
        style={{
          flex: 1,
          maxWidth: '600px',
          height: '40px',
          padding: '0 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: searchHovered ? '#F3F4F6' : '#F9FAFB',
          border: `1px solid ${searchHovered ? '#D1D5DB' : '#E5E7EB'}`,
          borderRadius: '8px',
          fontSize: '14px',
          color: '#9CA3AF',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SearchIcon />
          <span>Rechercher...</span>
        </div>

        {/* Kbd shortcut (desktop only) */}
        {!isMobile && (
          <kbd
            style={{
              padding: '2px 6px',
              fontSize: '12px',
              fontWeight: 500,
              color: '#6B7280',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '4px',
              fontFamily: 'monospace',
            }}
          >
            ⌘K
          </kbd>
        )}
      </button>

      {/* ====== Right Actions ====== */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginLeft: 'auto',
        }}
      >
        {/* Notifications Button */}
        <button
          type="button"
          onClick={onNotificationsClick}
          onMouseEnter={() => setBellHovered(true)}
          onMouseLeave={() => setBellHovered(false)}
          aria-label={`Notifications${notificationCount > 0 ? ` (${notificationCount})` : ''}`}
          style={{
            position: 'relative',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: bellHovered ? '#F9FAFB' : 'transparent',
            border: 'none',
            borderRadius: '8px',
            color: bellHovered ? '#111827' : '#6B7280',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <BellIcon />

          {/* Notification Badge */}
          {notificationCount > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '6px',
                right: '6px',
                minWidth: '18px',
                height: '18px',
                padding: '0 4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#DC2626',
                borderRadius: '9px',
                fontSize: '11px',
                fontWeight: 600,
                color: '#FFFFFF',
                lineHeight: '1',
              }}
            >
              {notificationCount > 99 ? '99+' : notificationCount}
            </div>
          )}
        </button>

        {/* User Menu Button */}
        <div style={{ position: 'relative' }}>
          <button
            ref={userButtonRef}
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            onMouseEnter={() => setUserButtonHovered(true)}
            onMouseLeave={() => setUserButtonHovered(false)}
            aria-expanded={isUserMenuOpen}
            aria-haspopup="true"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 8px 4px 4px',
              backgroundColor: isUserMenuOpen
                ? '#F3F4F6'
                : userButtonHovered
                  ? '#F9FAFB'
                  : 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: user?.avatar ? 'transparent' : '#0A1628',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 600,
                color: '#FFFFFF',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                getUserInitials(user?.name || 'User')
              )}
            </div>

            {/* User Name (desktop only) */}
            {!isMobile && user && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  minWidth: 0,
                }}
              >
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#111827',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '150px',
                  }}
                >
                  {user.name}
                </span>
                {user.role && (
                  <span
                    style={{
                      fontSize: '12px',
                      color: '#6B7280',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {user.role}
                  </span>
                )}
              </div>
            )}

            {/* Chevron */}
            <ChevronDownIcon isOpen={isUserMenuOpen} />
          </button>

          {/* ====== User Dropdown Menu ====== */}
          {isUserMenuOpen && (
            <div
              ref={userMenuRef}
              role="menu"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '240px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                boxShadow:
                  '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                padding: '8px',
                zIndex: 50,
              }}
            >
              {/* User Info Header */}
              {user && (
                <div
                  style={{
                    padding: '12px',
                    borderBottom: '1px solid #F3F4F6',
                    marginBottom: '8px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#111827',
                      marginBottom: '2px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {user.name}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#6B7280',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {user.email}
                  </div>
                </div>
              )}

              {/* Profile */}
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onProfileClick?.()
                  setIsUserMenuOpen(false)
                }}
                onMouseEnter={() => setProfileHovered(true)}
                onMouseLeave={() => setProfileHovered(false)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: profileHovered ? '#F9FAFB' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#111827',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <UserIcon />
                Mon profil
              </button>

              {/* Settings */}
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onSettingsClick?.()
                  setIsUserMenuOpen(false)
                }}
                onMouseEnter={() => setSettingsHovered(true)}
                onMouseLeave={() => setSettingsHovered(false)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: settingsHovered ? '#F9FAFB' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#111827',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <SettingsIcon />
                Paramètres
              </button>

              {/* Divider */}
              <div
                style={{
                  height: '1px',
                  backgroundColor: '#F3F4F6',
                  margin: '8px 0',
                }}
              />

              {/* Logout */}
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onLogout?.()
                  setIsUserMenuOpen(false)
                }}
                onMouseEnter={() => setLogoutHovered(true)}
                onMouseLeave={() => setLogoutHovered(false)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: logoutHovered ? '#FEF2F2' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#DC2626',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <LogoutIcon />
                Se déconnecter
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default TopBar
