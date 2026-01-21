"use client"

import React, { useState, useRef, useEffect } from "react"

interface DatePickerProps {
  value?: Date | string | null
  onChange?: (date: Date | null) => void
  label?: string
  placeholder?: string
  error?: string
  helperText?: string
  required?: boolean
  disabled?: boolean
  minDate?: Date
  maxDate?: Date
  name?: string
  fullWidth?: boolean
}

const MONTHS_FR = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
]

const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]

export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      value,
      onChange,
      label,
      placeholder = "JJ/MM/AAAA",
      error,
      helperText,
      required = false,
      disabled = false,
      minDate,
      maxDate,
      name,
      fullWidth = false,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false)
    const [inputValue, setInputValue] = useState("")
    const [viewDate, setViewDate] = useState(() => {
      if (value) {
        const d = typeof value === "string" ? new Date(value) : value
        return isNaN(d.getTime()) ? new Date() : d
      }
      return new Date()
    })
    const [isFocused, setIsFocused] = useState(false)
    const [hoveredDay, setHoveredDay] = useState<number | null>(null)
    const [hoveredNav, setHoveredNav] = useState<"prev" | "next" | null>(null)

    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const selectedDate = value
      ? typeof value === "string"
        ? new Date(value)
        : value
      : null
    const today = new Date()

    const formatDate = (date: Date | null): string => {
      if (!date || isNaN(date.getTime())) return ""
      const day = date.getDate().toString().padStart(2, "0")
      const month = (date.getMonth() + 1).toString().padStart(2, "0")
      const year = date.getFullYear()
      return `${day}/${month}/${year}`
    }

    const parseDate = (dateString: string): Date | null => {
      const parts = dateString.split("/")
      if (parts.length !== 3) return null
      const day = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10) - 1
      const year = parseInt(parts[2], 10)
      if (isNaN(day) || isNaN(month) || isNaN(year)) return null
      const date = new Date(year, month, day)
      return isNaN(date.getTime()) ? null : date
    }

    const getDaysInMonth = (date: Date): Date[] => {
      const year = date.getFullYear()
      const month = date.getMonth()
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
      const days: Date[] = []

      const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1
      for (let i = startDay - 1; i >= 0; i--) {
        days.push(new Date(year, month, -i))
      }

      for (let i = 1; i <= lastDay.getDate(); i++) {
        days.push(new Date(year, month, i))
      }

      const remainingDays = 42 - days.length
      for (let i = 1; i <= remainingDays; i++) {
        days.push(new Date(year, month + 1, i))
      }

      return days
    }

    const isSameDay = (date1: Date | null, date2: Date | null): boolean => {
      if (!date1 || !date2) return false
      return (
        date1.getDate() === date2.getDate() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getFullYear() === date2.getFullYear()
      )
    }

    const isDateDisabled = (date: Date): boolean => {
      if (minDate) {
        const min = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())
        const check = new Date(date.getFullYear(), date.getMonth(), date.getDate())
        if (check < min) return true
      }
      if (maxDate) {
        const max = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate())
        const check = new Date(date.getFullYear(), date.getMonth(), date.getDate())
        if (check > max) return true
      }
      return false
    }

    // Synchronize inputValue with value
    useEffect(() => {
      if (value) {
        const d = typeof value === "string" ? new Date(value) : value
        setInputValue(formatDate(d))
        if (!isNaN(d.getTime())) {
          setViewDate(d)
        }
      } else {
        setInputValue("")
      }
    }, [value])

    // Close on click outside
    useEffect(() => {
      if (!isOpen) return

      const handleClickOutside = (event: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false)
        }
      }

      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [isOpen])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setInputValue(newValue)

      if (newValue.length === 10) {
        const parsed = parseDate(newValue)
        if (parsed && !isDateDisabled(parsed)) {
          onChange?.(parsed)
          setViewDate(parsed)
        }
      } else if (newValue === "") {
        onChange?.(null)
      }
    }

    const handleDayClick = (date: Date) => {
      if (isDateDisabled(date)) return
      onChange?.(date)
      setInputValue(formatDate(date))
      setIsOpen(false)
    }

    const handlePrevMonth = () => {
      setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
    }

    const handleNextMonth = () => {
      setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))
    }

    const days = getDaysInMonth(viewDate)

    return (
      <div
        ref={containerRef}
        style={{
          width: fullWidth ? "100%" : "auto",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          marginBottom: "20px",
          position: "relative",
        }}
      >
        {/* Label */}
        {label && (
          <label
            htmlFor={name}
            style={{
              fontSize: "14px",
              fontWeight: 500,
              color: "#111827",
              marginBottom: "6px",
            }}
          >
            {label}
            {required && (
              <span style={{ color: "#DC2626", marginLeft: "4px" }}>*</span>
            )}
          </label>
        )}

        {/* Input */}
        <div style={{ position: "relative" }}>
          <input
            ref={(node) => {
              inputRef.current = node
              if (typeof ref === "function") {
                ref(node)
              } else if (ref) {
                ref.current = node
              }
            }}
            type="text"
            name={name}
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => {
              setIsFocused(true)
              setIsOpen(true)
            }}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            style={{
              width: "100%",
              height: "40px",
              padding: "0 40px 0 14px",
              fontSize: "14px",
              color: "#111827",
              backgroundColor: disabled ? "#F9FAFB" : "#FFFFFF",
              border: `1px solid ${error ? "#DC2626" : isFocused ? "#0A1628" : "#E5E7EB"}`,
              borderRadius: "8px",
              outline: "none",
              transition: "all 0.2s ease",
              cursor: disabled ? "not-allowed" : "text",
              opacity: disabled ? 0.6 : 1,
            }}
          />

          {/* Calendar icon */}
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              padding: 0,
              width: "20px",
              height: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "transparent",
              border: "none",
              color: "#6B7280",
              cursor: disabled ? "not-allowed" : "pointer",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </button>
        </div>

        {/* Calendar dropdown */}
        {isOpen && !disabled && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              zIndex: 50,
              width: "280px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: "12px",
              boxShadow:
                "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
              padding: "12px",
            }}
          >
            {/* Header navigation */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "12px",
              }}
            >
              <button
                type="button"
                onClick={handlePrevMonth}
                onMouseEnter={() => setHoveredNav("prev")}
                onMouseLeave={() => setHoveredNav(null)}
                style={{
                  padding: "4px",
                  backgroundColor: hoveredNav === "prev" ? "#F9FAFB" : "transparent",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  color: "#6B7280",
                  transition: "all 0.15s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>

              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#111827",
                }}
              >
                {MONTHS_FR[viewDate.getMonth()]} {viewDate.getFullYear()}
              </span>

              <button
                type="button"
                onClick={handleNextMonth}
                onMouseEnter={() => setHoveredNav("next")}
                onMouseLeave={() => setHoveredNav(null)}
                style={{
                  padding: "4px",
                  backgroundColor: hoveredNav === "next" ? "#F9FAFB" : "transparent",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  color: "#6B7280",
                  transition: "all 0.15s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            {/* Days header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: "4px",
                marginBottom: "4px",
              }}
            >
              {DAYS_FR.map((day) => (
                <div
                  key={day}
                  style={{
                    textAlign: "center",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#6B7280",
                    padding: "4px 0",
                  }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: "2px",
              }}
            >
              {days.map((date, index) => {
                const isSelected = isSameDay(date, selectedDate)
                const isToday = isSameDay(date, today)
                const isCurrentMonth = date.getMonth() === viewDate.getMonth()
                const isDisabled = isDateDisabled(date)
                const isHovered = hoveredDay === index && !isDisabled && !isSelected

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleDayClick(date)}
                    onMouseEnter={() => setHoveredDay(index)}
                    onMouseLeave={() => setHoveredDay(null)}
                    disabled={isDisabled}
                    style={{
                      width: "36px",
                      height: "36px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: isSelected
                        ? "#FFFFFF"
                        : isDisabled
                          ? "#D1D5DB"
                          : !isCurrentMonth
                            ? "#9CA3AF"
                            : "#111827",
                      backgroundColor: isSelected
                        ? "#0A1628"
                        : isHovered
                          ? "#F9FAFB"
                          : isToday
                            ? "#DBEAFE"
                            : "transparent",
                      border: "none",
                      borderRadius: "6px",
                      cursor: isDisabled ? "not-allowed" : "pointer",
                      transition: "all 0.15s ease",
                      opacity: isDisabled ? 0.4 : 1,
                    }}
                  >
                    {date.getDate()}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Error / Helper text */}
        {(error || helperText) && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "12px",
              color: error ? "#DC2626" : "#6B7280",
              marginTop: "4px",
            }}
          >
            {error && (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
            <span>{error || helperText}</span>
          </div>
        )}
      </div>
    )
  }
)

DatePicker.displayName = "DatePicker"
