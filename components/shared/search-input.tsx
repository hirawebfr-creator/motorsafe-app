'use client'

import React from 'react'
import { Search, X } from 'lucide-react'

interface SearchInputProps {
  placeholder?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClear?: () => void
  disabled?: boolean
}

export function SearchInput({
  placeholder = 'Rechercher...',
  value,
  onChange,
  onClear,
  disabled = false
}: SearchInputProps) {
  const handleClear = () => {
    if (onClear) {
      onClear()
    }
  }
  
  return (
    <div style={{
      position: 'relative',
      width: '100%'
    }}>
      <div style={{
        position: 'absolute',
        left: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        color: '#9CA3AF',
        pointerEvents: 'none'
      }}>
        <Search size={18} />
      </div>
      
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        style={{
          width: '100%',
          height: '42px',
          paddingLeft: '40px',
          paddingRight: value ? '40px' : '12px',
          fontSize: '14px',
          color: '#111827',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          outline: 'none',
          transition: 'all 0.15s ease'
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#0A1628'
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(10, 22, 40, 0.1)'
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = '#E5E7EB'
          e.currentTarget.style.boxShadow = 'none'
        }}
      />
      
      {value && onClear && (
        <button
          type="button"
          onClick={handleClear}
          style={{
            position: 'absolute',
            right: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '6px',
            color: '#9CA3AF',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            padding: 0
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#F3F4F6'
            e.currentTarget.style.color = '#111827'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = '#9CA3AF'
          }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
}
