'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  Wrench,
  Euro,
  Users,
  Car,
  Plus,
  UserPlus,
  Search,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Calendar,
  RefreshCw,
  AlertCircle,
  BarChart3,
  Activity,
  AlertTriangle,
  Info,
  ChevronRight,
  FileText,
  type LucideIcon
} from 'lucide-react'

// ============================================================================
// HOOKS
// ============================================================================

function useResponsive() {
  const [screen, setScreen] = useState<"mobile" | "tablet" | "desktop">("desktop")
  useEffect(() => {
    const check = () => {
      const w = window.innerWidth
      if (w < 640) setScreen("mobile")
      else if (w < 1024) setScreen("tablet")
      else setScreen("desktop")
    }
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])
  return { isMobile: screen === "mobile", isTablet: screen === "tablet", screen }
}

function useAnimatedNumber(target: number, duration: number = 800) {
  const [current, setCurrent] = useState(0)
  const prevTarget = useRef(0)

  useEffect(() => {
    if (target === prevTarget.current) return
    const start = prevTarget.current
    prevTarget.current = target
    const startTime = performance.now()

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCurrent(Math.round(start + (target - start) * eased))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [target, duration])

  return current
}

// ============================================================================
// TYPES
// ============================================================================

interface KpiData {
  clientsCount: number
  vehiclesCount: number
  interventionsCount: number
  revenueTotalCents: number
  clientsVariation: number
  vehiclesVariation: number
  interventionsVariation: number
  revenueVariation: number
}

interface AnalyticsData {
  done: number
  inProgress: number
  cancelled: number
}

interface RecentIntervention {
  id: string
  ref: string
  vehicleLabel: string
  priceCents: number
  status: string
  totalCents: number
}

interface ChartDataResponse {
  revenueByMonth: { month: string; revenue: number }[]
  interventionsByMonth: { month: string; count: number; done: number; inProgress: number }[]
  revenueByDay: { day: string; revenue: number }[]
  topServices: { type: string; count: number; revenue: number }[]
}

interface AlertItem {
  id: string
  type: 'warning' | 'info' | 'success' | 'danger'
  title: string
  message: string
  link?: string
  count?: number
}

// ============================================================================
// UTILS
// ============================================================================

const formatCurrency = (cents: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(cents / 100)
}

const formatCurrencyValue = (value: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(value)
}

const getStatusLabel = (status: string): string => {
  const map: Record<string, string> = {
    DONE: 'Terminée',
    OPEN: 'En cours',
    DRAFT: 'Brouillon',
    CANCELED: 'Annulée',
    SIGNED: 'Signée',
  }
  return map[status] || status
}

const getStatusStyle = (status: string): { bg: string; color: string } => {
  const map: Record<string, { bg: string; color: string }> = {
    DONE: { bg: '#ECFDF5', color: '#10B981' },
    SIGNED: { bg: '#ECFDF5', color: '#10B981' },
    OPEN: { bg: '#EFF6FF', color: '#3B82F6' },
    DRAFT: { bg: '#F3F4F6', color: '#6B7280' },
    CANCELED: { bg: '#FEF2F2', color: '#EF4444' },
  }
  return map[status] || { bg: '#F3F4F6', color: '#6B7280' }
}

const alertTypeConfig: Record<string, { icon: LucideIcon; bg: string; border: string; color: string; iconColor: string }> = {
  danger: { icon: AlertCircle, bg: '#FEF2F2', border: '#FECACA', color: '#DC2626', iconColor: '#EF4444' },
  warning: { icon: AlertTriangle, bg: '#FFFBEB', border: '#FDE68A', color: '#D97706', iconColor: '#F59E0B' },
  info: { icon: Info, bg: '#EFF6FF', border: '#BFDBFE', color: '#2563EB', iconColor: '#3B82F6' },
  success: { icon: CheckCircle, bg: '#ECFDF5', border: '#A7F3D0', color: '#059669', iconColor: '#10B981' },
}

// ============================================================================
// CHART COMPONENTS
// ============================================================================

function AnimatedLineChart({ data, width, height, color = '#6366F1', gradientId }: {
  data: { label: string; value: number }[]
  width: number
  height: number
  color?: string
  gradientId: string
}) {
  const [animProgress, setAnimProgress] = useState(0)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    setAnimProgress(0)
    const startTime = performance.now()
    const duration = 1200
    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      setAnimProgress(1 - Math.pow(1 - progress, 3))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [data])

  if (data.length === 0) return null

  const isMobileWidth = width < 400
  const padding = { top: 20, right: isMobileWidth ? 10 : 20, bottom: 35, left: isMobileWidth ? 35 : 50 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  const maxVal = Math.max(...data.map(d => d.value), 1)
  const minVal = 0

  const points = data.map((d, i) => ({
    x: padding.left + (i / Math.max(data.length - 1, 1)) * chartW,
    y: padding.top + chartH - ((d.value - minVal) / (maxVal - minVal)) * chartH,
    value: d.value,
    label: d.label,
  }))

  const animatedPoints = points.map((p) => ({
    ...p,
    y: padding.top + chartH - (padding.top + chartH - p.y) * animProgress
  }))

  // Smooth curve path using bezier
  const createSmoothPath = (pts: typeof animatedPoints) => {
    if (pts.length < 2) return ''
    let d = `M ${pts[0].x} ${pts[0].y}`
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1]
      const curr = pts[i]
      const cpx = (prev.x + curr.x) / 2
      d += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`
    }
    return d
  }

  const linePath = createSmoothPath(animatedPoints)
  const areaPath = linePath + ` L ${animatedPoints[animatedPoints.length - 1].x} ${padding.top + chartH} L ${animatedPoints[0].x} ${padding.top + chartH} Z`

  // Y-axis labels
  const yTicks = isMobileWidth ? 3 : 4
  const yLabels = Array.from({ length: yTicks + 1 }, (_, i) => {
    const val = minVal + (maxVal - minVal) * (i / yTicks)
    return { value: val, y: padding.top + chartH - (chartH * i / yTicks) }
  })

  // Color variants for gradient
  const colorLight = color === '#6366F1' ? '#818CF8' : color === '#10B981' ? '#34D399' : color
  const colorDark = color === '#6366F1' ? '#4F46E5' : color === '#10B981' ? '#059669' : color

  return (
    <svg ref={svgRef} width={width} height={height} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="50%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id={`${gradientId}-stroke`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={colorDark} />
          <stop offset="50%" stopColor={color} />
          <stop offset="100%" stopColor={colorLight} />
        </linearGradient>
        <filter id={`${gradientId}-glow`}>
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Grid lines */}
      {yLabels.map((tick, i) => (
        <g key={i}>
          <line x1={padding.left} y1={tick.y} x2={padding.left + chartW} y2={tick.y}
            stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4 4" />
          <text x={padding.left - 6} y={tick.y + 4} textAnchor="end"
            fill="#9CA3AF" fontSize={isMobileWidth ? '9' : '11'} fontFamily="system-ui">
            {tick.value >= 1000 ? `${(tick.value / 1000).toFixed(0)}k` : tick.value.toFixed(0)}
          </text>
        </g>
      ))}

      {/* Area with smooth gradient */}
      <path d={areaPath} fill={`url(#${gradientId})`} />

      {/* Line with gradient stroke */}
      <path d={linePath} fill="none" stroke={`url(#${gradientId}-stroke)`} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${gradientId}-glow)`} />

      {/* Data points */}
      {animatedPoints.map((p, i) => (
        <g key={i}
          onMouseEnter={() => setHoveredIndex(i)}
          onMouseLeave={() => setHoveredIndex(null)}
          style={{ cursor: 'pointer' }}
        >
          <circle cx={p.x} cy={p.y} r={hoveredIndex === i ? 7 : 4}
            fill="#fff" stroke={color} strokeWidth="2.5"
            style={{ transition: 'all 0.15s ease', filter: hoveredIndex === i ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' : 'none' }}
          />
          {hoveredIndex === i && (
            <g>
              <rect x={p.x - 45} y={p.y - 38} width="90" height="28" rx="8"
                fill="#1F2937" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))' }} />
              <polygon points={`${p.x-6},${p.y-10} ${p.x+6},${p.y-10} ${p.x},${p.y-4}`} fill="#1F2937" />
              <text x={p.x} y={p.y - 19} textAnchor="middle"
                fill="#fff" fontSize="12" fontWeight="700" fontFamily="system-ui">
                {formatCurrencyValue(p.value)}
              </text>
            </g>
          )}
        </g>
      ))}

      {/* X-axis labels */}
      {data.map((d, i) => {
        const showLabel = data.length <= 8 || i % Math.ceil(data.length / 6) === 0 || i === data.length - 1
        if (!showLabel) return null
        return (
          <text key={i}
            x={padding.left + (i / Math.max(data.length - 1, 1)) * chartW}
            y={height - 5}
            textAnchor="middle" fill="#9CA3AF" fontSize={isMobileWidth ? '8' : '10'} fontFamily="system-ui">
            {d.label}
          </text>
        )
      })}
    </svg>
  )
}

function AnimatedBarChart({ data, width, height }: {
  data: { label: string; count: number; done: number; inProgress: number }[]
  width: number
  height: number
}) {
  const [animProgress, setAnimProgress] = useState(0)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  useEffect(() => {
    setAnimProgress(0)
    const startTime = performance.now()
    const duration = 1000
    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      setAnimProgress(1 - Math.pow(1 - progress, 3))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [data])

  if (data.length === 0) return null

  const isMobileWidth = width < 400
  const padding = { top: 20, right: isMobileWidth ? 10 : 20, bottom: 35, left: isMobileWidth ? 30 : 40 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  const maxVal = Math.max(...data.map(d => d.count), 1)
  const barWidth = Math.min(chartW / data.length * 0.65, isMobileWidth ? 24 : 36)
  const gap = chartW / data.length

  return (
    <svg width={width} height={height}>
      <defs>
        <linearGradient id="barGradientDone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <linearGradient id="barGradientProgress" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id="barGradientOther" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E5E7EB" />
          <stop offset="100%" stopColor="#D1D5DB" />
        </linearGradient>
        <filter id="barShadow">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15"/>
        </filter>
      </defs>

      {/* Grid */}
      {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
        <g key={i}>
          <line x1={padding.left} y1={padding.top + chartH * (1 - pct)}
            x2={padding.left + chartW} y2={padding.top + chartH * (1 - pct)}
            stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4 4" />
          <text x={padding.left - 6} y={padding.top + chartH * (1 - pct) + 4}
            textAnchor="end" fill="#9CA3AF" fontSize={isMobileWidth ? '9' : '11'} fontFamily="system-ui">
            {Math.round(maxVal * pct)}
          </text>
        </g>
      ))}

      {data.map((d, i) => {
        const x = padding.left + i * gap + (gap - barWidth) / 2
        const totalH = (d.count / maxVal) * chartH * animProgress
        const doneH = (d.done / maxVal) * chartH * animProgress
        const inProgressH = (d.inProgress / maxVal) * chartH * animProgress
        const otherH = totalH - doneH - inProgressH

        const baseY = padding.top + chartH
        const cornerRadius = isMobileWidth ? 4 : 6

        return (
          <g key={i}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            style={{ cursor: 'pointer' }}
          >
            {/* Other (gray) - bottom */}
            {otherH > 0 && (
              <rect x={x} y={baseY - totalH} width={barWidth} height={Math.max(otherH, 0)}
                rx={cornerRadius} fill="url(#barGradientOther)"
                style={{ transition: 'all 0.15s', transform: hoveredIndex === i ? 'scaleY(1.02)' : 'scaleY(1)', transformOrigin: 'bottom' }} />
            )}
            {/* In Progress (blue) - middle */}
            <rect x={x} y={baseY - doneH - inProgressH} width={barWidth} height={Math.max(inProgressH, 0)}
              fill="url(#barGradientProgress)"
              style={{ transition: 'all 0.15s' }}
              filter={hoveredIndex === i ? 'url(#barShadow)' : undefined} />
            {/* Done (green) - top */}
            <rect x={x} y={baseY - doneH} width={barWidth} height={Math.max(doneH, 0)}
              rx={cornerRadius} fill="url(#barGradientDone)"
              style={{ transition: 'all 0.15s' }}
              filter={hoveredIndex === i ? 'url(#barShadow)' : undefined} />

            {/* Tooltip */}
            {hoveredIndex === i && (
              <g>
                <rect x={x + barWidth / 2 - 42} y={baseY - totalH - 38} width="84" height="28" rx="8"
                  fill="#1F2937" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))' }} />
                <polygon points={`${x + barWidth / 2 - 6},${baseY - totalH - 10} ${x + barWidth / 2 + 6},${baseY - totalH - 10} ${x + barWidth / 2},${baseY - totalH - 4}`} fill="#1F2937" />
                <text x={x + barWidth / 2} y={baseY - totalH - 19} textAnchor="middle"
                  fill="#fff" fontSize="12" fontWeight="700" fontFamily="system-ui">
                  {d.count} interventions
                </text>
              </g>
            )}

            {/* X Label */}
            <text x={x + barWidth / 2} y={height - 5} textAnchor="middle"
              fill="#9CA3AF" fontSize={isMobileWidth ? '8' : '10'} fontFamily="system-ui">
              {d.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function AnimatedDonutChart({ data, size = 180 }: {
  data: { label: string; value: number; color: string }[]
  size?: number
}) {
  const [animProgress, setAnimProgress] = useState(0)
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null)

  useEffect(() => {
    setAnimProgress(0)
    const startTime = performance.now()
    const duration = 1000
    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      setAnimProgress(1 - Math.pow(1 - progress, 3))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [data])

  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) {
    return (
      <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={size} height={size}>
          <defs>
            <linearGradient id="emptyGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#F3F4F6" />
              <stop offset="100%" stopColor="#E5E7EB" />
            </linearGradient>
          </defs>
          <circle cx={size / 2} cy={size / 2} r={size * 0.38} fill="none"
            stroke="url(#emptyGrad)" strokeWidth={size * 0.12} />
          <text x={size / 2} y={size / 2 + 5} textAnchor="middle" fill="#9CA3AF"
            fontSize="16" fontWeight="600" fontFamily="system-ui">0</text>
        </svg>
      </div>
    )
  }

  const cx = size / 2
  const cy = size / 2
  const r = size * 0.36
  const strokeW = size * 0.12
  const circumference = 2 * Math.PI * r
  const gapSize = 4 // Gap between segments

  let offset = 0
  const segments = data.filter(d => d.value > 0).map((d, i) => {
    const pct = d.value / total
    const length = Math.max(circumference * pct * animProgress - gapSize, 0)
    const seg = { ...d, pct, length, offset, index: i }
    offset += circumference * pct
    return seg
  })

  // Color variants for gradients
  const colorVariants: Record<string, { light: string; dark: string }> = {
    '#10B981': { light: '#34D399', dark: '#059669' },
    '#3B82F6': { light: '#60A5FA', dark: '#2563EB' },
    '#EF4444': { light: '#F87171', dark: '#DC2626' },
  }

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          {segments.map((seg, i) => {
            const variants = colorVariants[seg.color] || { light: seg.color, dark: seg.color }
            return (
              <linearGradient key={i} id={`donutGrad${i}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={variants.light} />
                <stop offset="100%" stopColor={variants.dark} />
              </linearGradient>
            )
          })}
          <filter id="donutShadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2"/>
          </filter>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F3F4F6" strokeWidth={strokeW} />
        {segments.map((seg, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={`url(#donutGrad${i})`}
            strokeWidth={hoveredSegment === i ? strokeW + 4 : strokeW}
            strokeDasharray={`${seg.length} ${circumference}`}
            strokeDashoffset={-seg.offset * animProgress}
            strokeLinecap="round"
            style={{
              transition: 'all 0.2s ease',
              filter: hoveredSegment === i ? 'url(#donutShadow)' : 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={() => setHoveredSegment(i)}
            onMouseLeave={() => setHoveredSegment(null)}
          />
        ))}
      </svg>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        <span style={{
          fontSize: size * 0.2,
          fontWeight: 700,
          color: '#111827',
          lineHeight: 1,
          background: 'linear-gradient(135deg, #111827 0%, #374151 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          {total}
        </span>
        <span style={{ fontSize: size * 0.08, color: '#9CA3AF', marginTop: 2, fontWeight: 500 }}>interventions</span>
      </div>
    </div>
  )
}

function TopServicesChart({ data, maxCount }: {
  data: { type: string; count: number; revenue: number }[]
  maxCount: number
}) {
  const [animProgress, setAnimProgress] = useState(0)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  useEffect(() => {
    setAnimProgress(0)
    const startTime = performance.now()
    const duration = 800
    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      setAnimProgress(1 - Math.pow(1 - progress, 3))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [data])

  const colorPairs = [
    { main: '#6366F1', light: '#818CF8', dark: '#4F46E5' },
    { main: '#8B5CF6', light: '#A78BFA', dark: '#7C3AED' },
    { main: '#EC4899', light: '#F472B6', dark: '#DB2777' },
    { main: '#F59E0B', light: '#FBBF24', dark: '#D97706' },
    { main: '#10B981', light: '#34D399', dark: '#059669' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {data.map((service, i) => {
        const colors = colorPairs[i] || colorPairs[0]
        const isHovered = hoveredIndex === i

        return (
          <div
            key={i}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            style={{
              padding: '10px 12px',
              borderRadius: '10px',
              background: isHovered ? '#F9FAFB' : 'transparent',
              transition: 'all 0.15s ease',
              cursor: 'default',
              marginLeft: '-12px',
              marginRight: '-12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '8px',
                  background: `linear-gradient(135deg, ${colors.light}30 0%, ${colors.main}20 100%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Wrench size={14} color={colors.main} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                  {service.type}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  fontSize: '12px', color: '#6B7280', fontWeight: 500,
                  background: '#F3F4F6', padding: '3px 8px', borderRadius: '6px',
                }}>
                  {formatCurrencyValue(service.revenue)}
                </span>
                <span style={{
                  fontSize: '14px', fontWeight: 700, color: colors.main,
                  minWidth: '24px', textAlign: 'right',
                }}>
                  {service.count}
                </span>
              </div>
            </div>
            <div style={{
              height: '6px', borderRadius: '3px', background: '#E5E7EB', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${(service.count / Math.max(maxCount, 1)) * 100 * animProgress}%`,
                borderRadius: '3px',
                background: `linear-gradient(90deg, ${colors.dark}, ${colors.main}, ${colors.light})`,
                transition: 'width 0.3s ease',
                boxShadow: isHovered ? `0 0 8px ${colors.main}50` : 'none',
              }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ============================================================================
// KPI CARD COMPONENT
// ============================================================================

interface KpiCardProps {
  title: string
  value: number
  isCurrency?: boolean
  variation: number
  icon: LucideIcon
  color: string
  bgColor: string
  isLoading: boolean
  isMobile?: boolean
}

function KpiCard({ title, value, isCurrency, variation, icon: Icon, color, bgColor, isLoading, isMobile }: KpiCardProps) {
  const animatedValue = useAnimatedNumber(value)

  if (isLoading) {
    return (
      <div style={{
        padding: isMobile ? '16px' : '24px', borderRadius: isMobile ? '14px' : '16px', background: '#fff', border: '1px solid #E5E7EB',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ width: '80px', height: '12px', background: '#F3F4F6', borderRadius: '4px', animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ width: isMobile ? '36px' : '40px', height: isMobile ? '36px' : '40px', background: '#F3F4F6', borderRadius: '10px', animation: 'pulse 1.5s ease-in-out infinite' }} />
        </div>
        <div style={{ width: '70px', height: '24px', background: '#F3F4F6', borderRadius: '6px', animation: 'pulse 1.5s ease-in-out infinite' }} />
      </div>
    )
  }

  const isPositive = variation > 0
  const isNegative = variation < 0
  const displayValue = isCurrency ? formatCurrency(animatedValue) : animatedValue

  return (
    <div
      style={{
        padding: isMobile ? '16px' : '24px', borderRadius: isMobile ? '14px' : '16px', background: '#fff',
        border: '1px solid #E5E7EB', transition: 'all 0.2s ease', cursor: 'default',
      }}
      onMouseEnter={(e) => {
        if (!isMobile) {
          e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
          e.currentTarget.style.transform = 'translateY(-2px)'
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: isMobile ? '10px' : '12px' }}>
        <p style={{ fontSize: isMobile ? '12px' : '13px', fontWeight: 500, color: '#6B7280', margin: 0 }}>{title}</p>
        <div style={{
          width: isMobile ? '36px' : '40px', height: isMobile ? '36px' : '40px', borderRadius: isMobile ? '8px' : '10px', background: bgColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={isMobile ? 18 : 20} color={color} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: isMobile ? '6px' : '10px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 700, color: '#111827' }}>{displayValue}</span>
        {variation !== 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '3px',
            padding: isMobile ? '2px 6px' : '3px 8px', borderRadius: '6px',
            background: isPositive ? '#ECFDF5' : isNegative ? '#FEF2F2' : '#F9FAFB',
          }}>
            {isPositive ? <TrendingUp size={isMobile ? 10 : 12} color="#10B981" /> : isNegative ? <TrendingDown size={isMobile ? 10 : 12} color="#EF4444" /> : null}
            <span style={{
              fontSize: isMobile ? '10px' : '12px', fontWeight: 600,
              color: isPositive ? '#10B981' : isNegative ? '#EF4444' : '#6B7280',
            }}>
              {isPositive ? '+' : ''}{variation}%
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function DashboardPage() {
  const { isMobile, isTablet } = useResponsive()
  const [period, setPeriod] = useState<'month' | '30days' | 'year'>('month')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [kpis, setKpis] = useState<KpiData | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [recentInterventions, setRecentInterventions] = useState<RecentIntervention[]>([])
  const [chartData, setChartData] = useState<ChartDataResponse | null>(null)
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [chartContainerWidth, setChartContainerWidth] = useState(300)
  const [secondChartWidth, setSecondChartWidth] = useState(300)
  const [dailyChartWidth, setDailyChartWidth] = useState(300)
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const secondChartRef = useRef<HTMLDivElement>(null)
  const dailyChartRef = useRef<HTMLDivElement>(null)

  // Measure chart containers
  useEffect(() => {
    const measure = () => {
      if (chartContainerRef.current) {
        const padding = isMobile ? 32 : 48
        setChartContainerWidth(Math.max(chartContainerRef.current.offsetWidth - padding, 250))
      }
      if (secondChartRef.current) {
        const padding = isMobile ? 32 : 48
        setSecondChartWidth(Math.max(secondChartRef.current.offsetWidth - padding, 250))
      }
      if (dailyChartRef.current) {
        const padding = isMobile ? 32 : 48
        setDailyChartWidth(Math.max(dailyChartRef.current.offsetWidth - padding, 250))
      }
    }
    // Delay to ensure DOM is ready
    const timer = setTimeout(measure, 100)
    window.addEventListener('resize', measure)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', measure)
    }
  }, [isMobile])

  // Calculer from/to en fonction de la période
  const getDateRange = useCallback((p: string): string => {
    const now = new Date()
    const to = now.toISOString().slice(0, 10)
    let from: string

    if (p === 'year') {
      from = `${now.getFullYear()}-01-01`
    } else if (p === 'month') {
      const d = new Date(now.getFullYear(), now.getMonth(), 1)
      from = d.toISOString().slice(0, 10)
    } else {
      // 30days
      const d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      from = d.toISOString().slice(0, 10)
    }
    return `from=${from}&to=${to}`
  }, [])

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const range = getDateRange(period)
    const errors: string[] = []

    // Charger chaque section indépendamment pour éviter qu'un crash bloque tout
    const [kpisResult, analyticsResult, recentResult, chartResult, alertsResult] = await Promise.allSettled([
      fetch(`/api/dashboard/kpis?${range}`).then(r => r.json()),
      fetch(`/api/dashboard/analytics?${range}`).then(r => r.json()),
      fetch(`/api/dashboard/recent-interventions?limit=6&${range}`).then(r => r.json()),
      fetch('/api/dashboard/chart-data').then(r => r.json()),
      fetch('/api/dashboard/alerts').then(r => r.json()),
    ])

    // KPIs
    if (kpisResult.status === 'fulfilled' && kpisResult.value?.ok) {
      setKpis(kpisResult.value.data)
    } else {
      setKpis(null)
      const errMsg = kpisResult.status === 'fulfilled' ? kpisResult.value?.error?.message : 'Erreur réseau'
      errors.push(`KPIs: ${errMsg || 'Erreur'}`)
      console.error('KPIs error:', kpisResult)
    }

    // Analytics
    if (analyticsResult.status === 'fulfilled' && analyticsResult.value?.ok) {
      setAnalytics(analyticsResult.value.data)
    } else {
      setAnalytics({ done: 0, inProgress: 0, cancelled: 0 })
      console.error('Analytics error:', analyticsResult)
    }

    // Recent interventions
    if (recentResult.status === 'fulfilled' && recentResult.value?.ok) {
      setRecentInterventions(recentResult.value.data || [])
    } else {
      setRecentInterventions([])
      console.error('Recent interventions error:', recentResult)
    }

    // Chart data
    if (chartResult.status === 'fulfilled' && chartResult.value?.ok) {
      setChartData(chartResult.value.data)
    } else {
      setChartData(null)
      console.error('Chart data error:', chartResult)
    }

    // Alerts
    if (alertsResult.status === 'fulfilled' && alertsResult.value?.ok) {
      setAlerts(alertsResult.value.data?.alerts || [])
    } else {
      setAlerts([])
      console.error('Alerts error:', alertsResult)
    }

    if (errors.length > 0) {
      setError(errors.join(' | '))
    }

    setIsLoading(false)
  }, [period, getDateRange])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const donutData = analytics ? [
    { label: 'Terminées', value: analytics.done, color: '#10B981' },
    { label: 'En cours', value: analytics.inProgress, color: '#3B82F6' },
    { label: 'Annulées', value: analytics.cancelled, color: '#EF4444' },
  ] : []

  return (
    <div style={{ padding: isMobile ? '16px' : isTablet ? '24px' : '32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'stretch' : 'flex-start',
        marginBottom: isMobile ? '24px' : '32px',
        gap: '16px',
      }}>
        <div>
          <h1 style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 700, color: '#111827', margin: 0, marginBottom: '4px' }}>
            Tableau de bord
          </h1>
          <p style={{ fontSize: isMobile ? '13px' : '15px', color: '#6B7280', margin: 0 }}>
            Vue d&apos;ensemble de votre activité
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={loadDashboardData}
            disabled={isLoading}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '40px', height: '40px', borderRadius: '10px',
              border: '1px solid #E5E7EB', background: '#fff',
              cursor: isLoading ? 'wait' : 'pointer', transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
          >
            <RefreshCw size={18} color="#6B7280" style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
          </button>

          <div style={{
            display: 'flex', gap: '4px', backgroundColor: '#F3F4F6', padding: '4px', borderRadius: '10px',
          }}>
            {[
              { value: 'month', label: 'Ce mois' },
              { value: '30days', label: '30 j' },
              { value: 'year', label: 'Année' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setPeriod(option.value as typeof period)}
                style={{
                  padding: isMobile ? '8px 12px' : '10px 18px',
                  fontSize: isMobile ? '13px' : '14px',
                  fontWeight: 500,
                  color: period === option.value ? '#FFFFFF' : '#6B7280',
                  background: period === option.value ? 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' : 'transparent',
                  border: 'none', borderRadius: '8px', cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: period === option.value ? '0 2px 8px rgba(99, 102, 241, 0.3)' : 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px',
          borderRadius: '12px', background: '#FEF2F2', border: '1px solid #FECACA', marginBottom: '24px',
        }}>
          <AlertCircle size={20} color="#EF4444" />
          <span style={{ fontSize: '14px', color: '#DC2626' }}>{error}</span>
          <button onClick={loadDashboardData} style={{
            marginLeft: 'auto', padding: '8px 16px', borderRadius: '8px',
            border: 'none', background: '#EF4444', color: '#fff',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          }}>
            Réessayer
          </button>
        </div>
      )}

      {/* Alerts Banner */}
      {alerts.length > 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px',
        }}>
          {alerts.slice(0, 3).map((alert) => {
            const config = alertTypeConfig[alert.type] || alertTypeConfig.info
            const AlertIcon = config.icon
            return (
              <div key={alert.id} style={{
                display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', gap: '12px', padding: '14px 18px',
                borderRadius: '12px', background: config.bg, border: `1px solid ${config.border}`,
                transition: 'all 0.15s ease', flexWrap: 'wrap',
              }}>
                <AlertIcon size={18} color={config.iconColor} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: config.color }}>
                    {alert.title}
                  </span>
                  <span style={{ fontSize: '13px', color: config.color, marginLeft: '8px', opacity: 0.8, wordBreak: 'break-word' }}>
                    {alert.message}
                  </span>
                </div>
                {alert.link && (
                  <Link href={alert.link} style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    fontSize: '12px', fontWeight: 600, color: config.color,
                    textDecoration: 'none', whiteSpace: 'nowrap',
                  }}>
                    Voir <ChevronRight size={14} />
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: isMobile ? '12px' : '20px',
        marginBottom: isMobile ? '24px' : '32px',
      }}>
        <KpiCard
          title="Interventions" value={kpis?.interventionsCount ?? 0}
          variation={kpis?.interventionsVariation ?? 0}
          icon={Wrench} color="#6366F1" bgColor="#EEF2FF" isLoading={isLoading} isMobile={isMobile}
        />
        <KpiCard
          title="Chiffre d'affaires" value={kpis?.revenueTotalCents ?? 0}
          isCurrency variation={kpis?.revenueVariation ?? 0}
          icon={Euro} color="#10B981" bgColor="#ECFDF5" isLoading={isLoading} isMobile={isMobile}
        />
        <KpiCard
          title="Nouveaux clients" value={kpis?.clientsCount ?? 0}
          variation={kpis?.clientsVariation ?? 0}
          icon={Users} color="#F59E0B" bgColor="#FFFBEB" isLoading={isLoading} isMobile={isMobile}
        />
        <KpiCard
          title="Véhicules ajoutés" value={kpis?.vehiclesCount ?? 0}
          variation={kpis?.vehiclesVariation ?? 0}
          icon={Car} color="#8B5CF6" bgColor="#F5F3FF" isLoading={isLoading} isMobile={isMobile}
        />
      </div>

      {/* Charts Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: isMobile ? '16px' : '24px',
        marginBottom: isMobile ? '16px' : '24px',
      }}>
        {/* Revenue Chart */}
        <div ref={chartContainerRef} style={{
          background: '#fff', borderRadius: isMobile ? '14px' : '16px', border: '1px solid #E5E7EB',
          padding: isMobile ? '16px' : '24px',
          minHeight: isMobile ? '260px' : '320px',
          overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMobile ? '16px' : '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '10px' }}>
              <div style={{
                width: isMobile ? '28px' : '32px', height: isMobile ? '28px' : '32px', borderRadius: '8px',
                background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Activity size={isMobile ? 14 : 16} color="#6366F1" />
              </div>
              <h3 style={{ fontSize: isMobile ? '14px' : '16px', fontWeight: 600, color: '#111827', margin: 0 }}>
                Évolution du CA
              </h3>
            </div>
          </div>
          {isLoading ? (
            <div style={{ height: isMobile ? '200px' : '240px', background: '#F9FAFB', borderRadius: '12px', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ) : (
            <div style={{ width: '100%', overflowX: 'auto', overflowY: 'hidden' }}>
              <AnimatedLineChart
                data={(chartData?.revenueByMonth || []).map(d => ({ label: d.month, value: d.revenue }))}
                width={chartContainerWidth}
                height={isMobile ? 200 : 240}
                color="#6366F1"
                gradientId="revenueGrad"
              />
            </div>
          )}
        </div>

        {/* Interventions Bar Chart */}
        <div ref={secondChartRef} style={{
          background: '#fff', borderRadius: isMobile ? '14px' : '16px', border: '1px solid #E5E7EB',
          padding: isMobile ? '16px' : '24px',
          minHeight: isMobile ? '260px' : '320px',
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex', alignItems: isMobile ? 'flex-start' : 'center',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between', marginBottom: isMobile ? '16px' : '20px',
            gap: isMobile ? '12px' : '0',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '10px' }}>
              <div style={{
                width: isMobile ? '28px' : '32px', height: isMobile ? '28px' : '32px', borderRadius: '8px',
                background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <BarChart3 size={isMobile ? 14 : 16} color="#8B5CF6" />
              </div>
              <h3 style={{ fontSize: isMobile ? '14px' : '16px', fontWeight: 600, color: '#111827', margin: 0 }}>
                Interventions par mois
              </h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '3px', background: 'linear-gradient(135deg, #34D399, #10B981)' }} />
                <span style={{ fontSize: isMobile ? '10px' : '11px', color: '#6B7280' }}>Terminées</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '3px', background: 'linear-gradient(135deg, #60A5FA, #3B82F6)' }} />
                <span style={{ fontSize: isMobile ? '10px' : '11px', color: '#6B7280' }}>En cours</span>
              </div>
            </div>
          </div>
          {isLoading ? (
            <div style={{ height: isMobile ? '200px' : '240px', background: '#F9FAFB', borderRadius: '12px', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ) : (
            <div style={{ width: '100%', overflowX: 'auto', overflowY: 'hidden' }}>
              <AnimatedBarChart
                data={(chartData?.interventionsByMonth || []).map(d => ({
                  label: d.month, count: d.count, done: d.done, inProgress: d.inProgress
                }))}
                width={secondChartWidth}
                height={isMobile ? 200 : 240}
              />
            </div>
          )}
        </div>
      </div>

      {/* Second Row: Donut + Top Services + Recent */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : 'minmax(260px, 300px) 1fr 1fr',
        gap: isMobile ? '16px' : '24px',
        marginBottom: isMobile ? '16px' : '24px',
      }}>
        {/* Donut Chart - Statut des interventions */}
        <div style={{
          background: '#fff', borderRadius: isMobile ? '14px' : '16px', border: '1px solid #E5E7EB',
          padding: isMobile ? '16px' : '24px',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          maxWidth: isMobile ? '100%' : 'none',
          width: '100%',
        }}>
          <h3 style={{ fontSize: isMobile ? '14px' : '16px', fontWeight: 600, color: '#111827', margin: 0, marginBottom: isMobile ? '16px' : '20px', alignSelf: 'flex-start' }}>
            Répartition des statuts
          </h3>
          {isLoading ? (
            <div style={{ width: '160px', height: '160px', borderRadius: '50%', background: '#F9FAFB', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ) : (
            <AnimatedDonutChart data={donutData} size={160} />
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginTop: '20px' }}>
            {[
              { label: 'Terminées', value: analytics?.done ?? 0, color: '#10B981', icon: CheckCircle },
              { label: 'En cours', value: analytics?.inProgress ?? 0, color: '#3B82F6', icon: Clock },
              { label: 'Annulées', value: analytics?.cancelled ?? 0, color: '#EF4444', icon: XCircle },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: item.color }} />
                  <span style={{ fontSize: '13px', color: '#6B7280' }}>{item.label}</span>
                </div>
                <span style={{ fontSize: '14px', fontWeight: 600, color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Services */}
        <div style={{
          background: '#fff', borderRadius: isMobile ? '14px' : '16px', border: '1px solid #E5E7EB',
          padding: isMobile ? '16px' : '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '10px', marginBottom: isMobile ? '16px' : '20px' }}>
            <div style={{
              width: isMobile ? '28px' : '32px', height: isMobile ? '28px' : '32px', borderRadius: '8px',
              background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Wrench size={isMobile ? 14 : 16} color="#F59E0B" />
            </div>
            <h3 style={{ fontSize: isMobile ? '14px' : '16px', fontWeight: 600, color: '#111827', margin: 0 }}>
              Top services
            </h3>
          </div>
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} style={{ height: '32px', background: '#F9FAFB', borderRadius: '8px', animation: 'pulse 1.5s ease-in-out infinite' }} />
              ))}
            </div>
          ) : chartData?.topServices && chartData.topServices.length > 0 ? (
            <TopServicesChart
              data={chartData.topServices}
              maxCount={Math.max(...chartData.topServices.map(s => s.count), 1)}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9CA3AF' }}>
              <FileText size={32} color="#D1D5DB" style={{ marginBottom: '8px' }} />
              <p style={{ margin: 0, fontSize: '13px' }}>Aucune donnée disponible</p>
            </div>
          )}
        </div>

        {/* Interventions récentes */}
        <div style={{
          background: '#fff', borderRadius: isMobile ? '14px' : '16px', border: '1px solid #E5E7EB',
          padding: isMobile ? '16px' : '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMobile ? '16px' : '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '10px' }}>
              <div style={{
                width: isMobile ? '28px' : '32px', height: isMobile ? '28px' : '32px', borderRadius: '8px',
                background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Calendar size={isMobile ? 14 : 16} color="#3B82F6" />
              </div>
              <h3 style={{ fontSize: isMobile ? '14px' : '16px', fontWeight: 600, color: '#111827', margin: 0 }}>
                Dernières interventions
              </h3>
            </div>
            <Link href="/interventions" style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              fontSize: isMobile ? '11px' : '12px', fontWeight: 600, color: '#6366F1', textDecoration: 'none',
              padding: '4px 8px', borderRadius: '6px', background: '#EEF2FF',
            }}>
              Tout <ArrowRight size={12} />
            </Link>
          </div>

          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ height: '48px', background: '#F9FAFB', borderRadius: '10px', animation: 'pulse 1.5s ease-in-out infinite' }} />
              ))}
            </div>
          ) : recentInterventions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: isMobile ? '30px 16px' : '40px 20px', color: '#6B7280' }}>
              <Wrench size={isMobile ? 28 : 32} color="#D1D5DB" style={{ marginBottom: '12px' }} />
              <p style={{ margin: 0, fontSize: isMobile ? '13px' : '14px' }}>Aucune intervention récente</p>
              <Link href="/interventions/new" style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                marginTop: '12px', fontSize: isMobile ? '13px' : '14px', fontWeight: 600, color: '#6366F1', textDecoration: 'none',
              }}>
                <Plus size={16} /> Créer une intervention
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {recentInterventions.slice(0, isMobile ? 4 : 5).map((intervention) => {
                const statusStyle = getStatusStyle(intervention.status)
                return (
                  <Link key={intervention.id} href={`/interventions/${intervention.id}`}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: isMobile ? '8px 10px' : '10px 12px', borderRadius: '10px', textDecoration: 'none',
                      transition: 'background 0.15s ease',
                      gap: '8px',
                      flexWrap: isMobile ? 'wrap' : 'nowrap',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '10px', flex: 1, minWidth: 0 }}>
                      <div style={{
                        width: isMobile ? '28px' : '32px', height: isMobile ? '28px' : '32px', borderRadius: '8px', background: '#F3F4F6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <Wrench size={isMobile ? 12 : 14} color="#6B7280" />
                      </div>
                      <div style={{ minWidth: 0, overflow: 'hidden' }}>
                        <p style={{ fontSize: isMobile ? '12px' : '13px', fontWeight: 500, color: '#111827', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {intervention.vehicleLabel || 'Véhicule'}
                        </p>
                        <p style={{ fontSize: isMobile ? '10px' : '11px', color: '#9CA3AF', margin: 0 }}>{intervention.ref}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '8px', flexShrink: 0 }}>
                      <span style={{
                        padding: isMobile ? '2px 6px' : '3px 8px', borderRadius: '6px', fontSize: isMobile ? '10px' : '11px', fontWeight: 600,
                        background: statusStyle.bg, color: statusStyle.color, whiteSpace: 'nowrap',
                      }}>
                        {getStatusLabel(intervention.status)}
                      </span>
                      <span style={{ fontSize: isMobile ? '12px' : '13px', fontWeight: 600, color: '#111827', whiteSpace: 'nowrap' }}>
                        {formatCurrency(intervention.totalCents)}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Revenue daily sparkline (full width) */}
      <div ref={dailyChartRef} style={{
        background: '#fff', borderRadius: isMobile ? '14px' : '16px', border: '1px solid #E5E7EB',
        padding: isMobile ? '16px' : '24px',
        marginBottom: isMobile ? '140px' : '32px',
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', alignItems: isMobile ? 'flex-start' : 'center',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between', marginBottom: isMobile ? '16px' : '20px',
          gap: isMobile ? '12px' : '0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '10px' }}>
            <div style={{
              width: isMobile ? '28px' : '32px', height: isMobile ? '28px' : '32px', borderRadius: '8px',
              background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Euro size={isMobile ? 14 : 16} color="#10B981" />
            </div>
            <div>
              <h3 style={{ fontSize: isMobile ? '14px' : '16px', fontWeight: 600, color: '#111827', margin: 0 }}>
                CA journalier {!isMobile && '(30 derniers jours)'}
              </h3>
              {!isMobile && (
                <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0, marginTop: '2px' }}>
                  Évolution quotidienne du chiffre d&apos;affaires
                </p>
              )}
            </div>
          </div>
          <Link href="/factures" style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            fontSize: isMobile ? '11px' : '12px', fontWeight: 600, color: '#10B981', textDecoration: 'none',
            padding: '4px 8px', borderRadius: '6px', background: '#ECFDF5',
          }}>
            Factures <ArrowRight size={12} />
          </Link>
        </div>
        {isLoading ? (
          <div style={{ height: isMobile ? '150px' : '180px', background: '#F9FAFB', borderRadius: '12px', animation: 'pulse 1.5s ease-in-out infinite' }} />
        ) : (
          <div style={{ width: '100%', overflowX: 'auto', overflowY: 'hidden' }}>
            <AnimatedLineChart
              data={(chartData?.revenueByDay || []).map(d => ({ label: d.day, value: d.revenue }))}
              width={dailyChartWidth}
              height={isMobile ? 150 : 180}
              color="#10B981"
              gradientId="dailyRevenueGrad"
            />
          </div>
        )}
      </div>

      {/* Quick Actions - Floating */}
      <div style={{
        position: 'fixed',
        bottom: isMobile ? '80px' : '32px',
        right: isMobile ? '16px' : '32px',
        left: isMobile ? '16px' : 'auto',
        display: 'flex', flexDirection: 'column', gap: '12px',
        alignItems: isMobile ? 'stretch' : 'flex-end',
        zIndex: 40
      }}>
        <Link href="/interventions/new" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          padding: isMobile ? '12px 20px' : '14px 24px', borderRadius: '14px',
          background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
          color: '#fff', fontSize: isMobile ? '14px' : '15px', fontWeight: 600,
          textDecoration: 'none', boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.4)',
          transition: 'all 0.2s ease',
        }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <Plus size={20} /> Nouvelle intervention
        </Link>
        {!isMobile && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link href="/clients/new" style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 18px', borderRadius: '12px',
              background: '#fff', border: '1px solid #E5E7EB', color: '#374151',
              fontSize: '14px', fontWeight: 600, textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)', transition: 'all 0.15s ease',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.background = '#F9FAFB' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.background = '#fff' }}
            >
              <UserPlus size={18} /> Nouveau client
            </Link>
            <Link href="/vehicules/search" style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 18px', borderRadius: '12px',
              background: '#fff', border: '1px solid #E5E7EB', color: '#374151',
              fontSize: '14px', fontWeight: 600, textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)', transition: 'all 0.15s ease',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.background = '#F9FAFB' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.background = '#fff' }}
            >
              <Search size={18} /> Recherche SIV
            </Link>
          </div>
        )}
      </div>

      {/* CSS Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}} />
    </div>
  )
}
