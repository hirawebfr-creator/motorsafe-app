'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize)
  const startItem = (page - 1) * pageSize + 1
  const endItem = Math.min(page * pageSize, total)

  if (totalPages <= 1) return null

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px',
      backgroundColor: '#ffffff',
      borderTop: '1px solid #e5e7eb',
      fontSize: '14px',
      color: '#6b7280'
    }}>
      {/* Info */}
      <div>
        Affichage de <strong style={{ color: '#111827' }}>{startItem}</strong> à{' '}
        <strong style={{ color: '#111827' }}>{endItem}</strong> sur{' '}
        <strong style={{ color: '#111827' }}>{total}</strong> résultats
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          style={{
            padding: '8px 12px',
            backgroundColor: page === 1 ? '#f3f4f6' : '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            cursor: page === 1 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '14px',
            color: page === 1 ? '#9ca3af' : '#374151',
            transition: 'all 0.15s',
            fontWeight: '500'
          }}
          onMouseEnter={(e) => {
            if (page !== 1) {
              e.currentTarget.style.backgroundColor = '#f9fafb'
            }
          }}
          onMouseLeave={(e) => {
            if (page !== 1) {
              e.currentTarget.style.backgroundColor = '#ffffff'
            }
          }}
        >
          <ChevronLeft style={{ width: '16px', height: '16px' }} />
          Précédent
        </button>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          style={{
            padding: '8px 12px',
            backgroundColor: page === totalPages ? '#f3f4f6' : '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            cursor: page === totalPages ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '14px',
            color: page === totalPages ? '#9ca3af' : '#374151',
            transition: 'all 0.15s',
            fontWeight: '500'
          }}
          onMouseEnter={(e) => {
            if (page !== totalPages) {
              e.currentTarget.style.backgroundColor = '#f9fafb'
            }
          }}
          onMouseLeave={(e) => {
            if (page !== totalPages) {
              e.currentTarget.style.backgroundColor = '#ffffff'
            }
          }}
        >
          Suivant
          <ChevronRight style={{ width: '16px', height: '16px' }} />
        </button>
      </div>
    </div>
  )
}

export default Pagination
