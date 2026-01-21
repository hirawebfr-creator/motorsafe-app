"use client";

import { LucideIcon } from 'lucide-react'

interface KpiCardProps {
  title: string
  value: string | number
  variation?: number
  icon?: LucideIcon
  sparkline?: number[]
  className?: string
}

export function KpiCard({ 
  title, 
  value, 
  variation, 
  icon: Icon, 
  sparkline,
  className = ''
}: KpiCardProps) {
  const isPositive = variation !== undefined && variation > 0
  const isNegative = variation !== undefined && variation < 0

  return (
    <div 
      className={className}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        transition: 'all 0.2s ease',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '12px'
      }}>
        <p style={{ 
          fontSize: '14px',
          fontWeight: '500',
          color: '#6b7280',
          margin: 0
        }}>
          {title}
        </p>
        {Icon && (
          <div style={{
            padding: '8px',
            borderRadius: '8px',
            backgroundColor: 'rgba(10, 22, 40, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Icon style={{ 
              width: '16px', 
              height: '16px',
              color: '#0A1628',
              strokeWidth: 2
            }} />
          </div>
        )}
      </div>
      
      {/* Body */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'flex-end', 
        justifyContent: 'space-between',
        gap: '12px'
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Value */}
          <p style={{ 
            fontSize: '24px',
            fontWeight: '700',
            letterSpacing: '-0.025em',
            lineHeight: '1.2',
            color: '#111827',
            margin: 0,
            marginBottom: '6px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {value}
          </p>
          
          {/* Variation */}
          {variation !== undefined && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              fontWeight: '500',
              color: isPositive 
                ? '#16a34a' 
                : isNegative 
                ? '#dc2626' 
                : '#6b7280'
            }}>
              <span style={{ fontSize: '14px' }}>
                {isPositive ? '↑' : isNegative ? '↓' : '—'}
              </span>
              <span style={{ whiteSpace: 'nowrap' }}>
                {isPositive && '+'}
                {variation.toFixed(1)}%
              </span>
              <span style={{ 
                color: '#9ca3af',
                fontWeight: '400',
                marginLeft: '2px'
              }}>
                vs mois
              </span>
            </div>
          )}
        </div>

        {/* Sparkline */}
        {sparkline && sparkline.length > 0 && (
          <div style={{ 
            height: '40px',
            width: '64px',
            flexShrink: 0,
            overflow: 'hidden'
          }}>
            <svg 
              viewBox="0 0 100 50" 
              style={{ width: '100%', height: '100%', display: 'block' }}
              preserveAspectRatio="none"
            >
              {(() => {
                const min = Math.min(...sparkline)
                const max = Math.max(...sparkline)
                const range = max - min || 1
                
                const points = sparkline
                  .map((val, i) => {
                    const x = (i / (sparkline.length - 1)) * 100
                    const y = 50 - ((val - min) / range) * 50
                    return `${x},${y}`
                  })
                  .join(' ')
                
                return (
                  <>
                    <polyline
                      points={points}
                      fill="none"
                      stroke="#0A1628"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <polyline
                      points={`0,50 ${points} 100,50`}
                      fill="rgba(10, 22, 40, 0.1)"
                    />
                  </>
                )
              })()}
            </svg>
          </div>
        )}
      </div>
    </div>
  )
}
