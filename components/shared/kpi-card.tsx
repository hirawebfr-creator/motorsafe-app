"use client";

import { Card } from '@/components/ui/Card'
import { ArrowUp, ArrowDown, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

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
  className 
}: KpiCardProps) {
  const isPositive = variation !== undefined && variation > 0
  const isNegative = variation !== undefined && variation < 0

  return (
    <Card 
      className={cn(
        'p-5 overflow-hidden',
        'transition-all duration-200 hover:shadow-lg hover:-translate-y-1',
        className
      )}
    >
      {/* Contenu direct sans wrapper */}
      <div>
        {/* Header: Title + Icon */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {Icon && (
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(10, 22, 40, 0.1)' }}>
              <Icon className="h-4 w-4" style={{ color: 'rgb(10, 22, 40)' }} />
            </div>
          )}
        </div>
        
        {/* Body: Value + Variation + Sparkline */}
        <div className="flex items-end justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Value */}
            <p className="text-2xl font-bold tracking-tight truncate">{value}</p>
            
            {/* Variation */}
            {variation !== undefined && (
              <div 
                className="flex items-center gap-1 text-xs mt-1.5 font-medium"
                style={{
                  color: isPositive 
                    ? 'rgb(22, 163, 74)' 
                    : isNegative 
                    ? 'rgb(220, 38, 38)' 
                    : 'rgb(107, 114, 128)'
                }}
              >
                {isPositive && <ArrowUp className="h-3 w-3 flex-shrink-0" />}
                {isNegative && <ArrowDown className="h-3 w-3 flex-shrink-0" />}
                <span className="whitespace-nowrap">
                  {isPositive && '+'}
                  {variation.toFixed(1)}%
                </span>
                <span className="text-muted-foreground font-normal">
                  vs mois
                </span>
              </div>
            )}
          </div>

          {/* Sparkline */}
          {sparkline && sparkline.length > 0 && (
            <div className="h-10 w-16 flex-shrink-0 overflow-hidden">
              <svg 
                viewBox="0 0 100 50" 
                className="w-full h-full"
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
                        stroke="rgb(10, 22, 40)"
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
    </Card>
  )
}
