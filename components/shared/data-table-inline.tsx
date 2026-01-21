'use client'

import React from 'react'

// ============================================================================
// DATA TABLE INLINE - 100% Inline Styles Version
// ============================================================================

export interface DataTableColumn<T> {
  key: string
  label: string
  sortable?: boolean
  width?: string
  render?: (row: T) => React.ReactNode
}

export interface DataTableInlineProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  loading?: boolean
  onRowClick?: (row: T) => void
  onSort?: (key: string) => void
  emptyState?: React.ReactNode
  loadingRows?: number
}

export function DataTableInline<T extends { id: string | number }>({
  columns,
  data,
  loading = false,
  onRowClick,
  onSort,
  emptyState,
  loadingRows = 5
}: DataTableInlineProps<T>) {
  const baseStyles = {
    container: {
      width: '100%',
      overflow: 'hidden',
      borderRadius: '12px',
      border: '1px solid #E5E7EB',
      backgroundColor: '#ffffff'
    } as React.CSSProperties,
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      fontSize: '14px'
    } as React.CSSProperties,
    thead: {
      backgroundColor: '#F9FAFB'
    } as React.CSSProperties,
    th: {
      padding: '12px 16px',
      textAlign: 'left' as const,
      fontWeight: '600',
      color: '#374151',
      borderBottom: '1px solid #E5E7EB',
      fontSize: '12px',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em'
    } as React.CSSProperties,
    thButton: {
      background: 'none',
      border: 'none',
      padding: '0',
      font: 'inherit',
      color: 'inherit',
      cursor: 'pointer',
      fontWeight: '600',
      fontSize: '12px',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    } as React.CSSProperties,
    tr: {
      borderBottom: '1px solid #E5E7EB',
      transition: 'background-color 0.15s'
    } as React.CSSProperties,
    trClickable: {
      cursor: 'pointer'
    } as React.CSSProperties,
    trHover: {
      backgroundColor: '#F9FAFB'
    } as React.CSSProperties,
    td: {
      padding: '12px 16px',
      color: '#111827'
    } as React.CSSProperties,
    emptyContainer: {
      padding: '48px 16px',
      textAlign: 'center' as const,
      color: '#6B7280'
    } as React.CSSProperties,
    skeleton: {
      backgroundColor: '#E5E7EB',
      borderRadius: '4px',
      animation: 'dataTablePulse 1.5s ease-in-out infinite'
    } as React.CSSProperties
  }

  // Skeleton loading
  if (loading) {
    return (
      <>
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes dataTablePulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.4; }
            }
          `
        }} />
        <div style={baseStyles.container}>
          <table style={baseStyles.table}>
            <thead style={baseStyles.thead}>
              <tr>
                {columns.map((column) => (
                  <th 
                    key={column.key} 
                    style={{ ...baseStyles.th, width: column.width }}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: loadingRows }).map((_, rowIndex) => (
                <tr key={rowIndex} style={baseStyles.tr}>
                  {columns.map((column) => (
                    <td key={column.key} style={baseStyles.td}>
                      <div 
                        style={{ 
                          ...baseStyles.skeleton, 
                          height: '16px', 
                          width: column.key === 'actions' ? '60px' : `${60 + Math.random() * 40}%` 
                        }} 
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    )
  }

  // Empty state
  if (data.length === 0) {
    if (emptyState) {
      return <>{emptyState}</>
    }
    return (
      <div style={baseStyles.container}>
        <table style={baseStyles.table}>
          <thead style={baseStyles.thead}>
            <tr>
              {columns.map((column) => (
                <th 
                  key={column.key} 
                  style={{ ...baseStyles.th, width: column.width }}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
        </table>
        <div style={baseStyles.emptyContainer}>
          Aucun résultat trouvé.
        </div>
      </div>
    )
  }

  // Normal data display
  return (
    <div style={baseStyles.container}>
      <table style={baseStyles.table}>
        <thead style={baseStyles.thead}>
          <tr>
            {columns.map((column) => (
              <th 
                key={column.key} 
                style={{ ...baseStyles.th, width: column.width }}
              >
                {column.sortable && onSort ? (
                  <button
                    type="button"
                    onClick={() => onSort(column.key)}
                    style={baseStyles.thButton}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#0A1628'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#374151'
                    }}
                  >
                    {column.label}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M8 9l4-4 4 4M16 15l-4 4-4-4" />
                    </svg>
                  </button>
                ) : (
                  column.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={row.id}
              style={{
                ...baseStyles.tr,
                ...(onRowClick ? baseStyles.trClickable : {})
              }}
              onClick={() => onRowClick?.(row)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F9FAFB'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              {columns.map((column) => (
                <td key={column.key} style={baseStyles.td}>
                  {column.render
                    ? column.render(row)
                    : String((row as Record<string, unknown>)[column.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default DataTableInline
