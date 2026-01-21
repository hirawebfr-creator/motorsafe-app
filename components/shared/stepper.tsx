"use client"

import React from "react"

interface Step {
  id: string
  label: string
  description?: string
  icon?: React.ReactNode
}

interface StepperProps {
  steps: Step[]
  currentStep: number
  onStepClick?: (stepIndex: number) => void
  orientation?: "horizontal" | "vertical"
  variant?: "default" | "simple"
  clickable?: boolean
  showConnector?: boolean
}

type StepStatus = "completed" | "current" | "pending"

const getStepColors = (status: StepStatus) => {
  switch (status) {
    case "completed":
      return {
        circle: "#DCFCE7",
        border: "#16A34A",
        icon: "#16A34A",
        label: "#166534",
        connector: "#16A34A",
      }
    case "current":
      return {
        circle: "#0A1628",
        border: "#0A1628",
        icon: "#FFFFFF",
        label: "#111827",
        connector: "#E5E7EB",
      }
    case "pending":
      return {
        circle: "#FFFFFF",
        border: "#D1D5DB",
        icon: "#9CA3AF",
        label: "#6B7280",
        connector: "#E5E7EB",
      }
  }
}

const CheckIcon = () => (
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
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

export function Stepper({
  steps,
  currentStep,
  onStepClick,
  orientation = "horizontal",
  variant = "default",
  clickable = false,
  showConnector = true,
}: StepperProps) {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null)

  const getStepStatus = (index: number): StepStatus => {
    if (index < currentStep) return "completed"
    if (index === currentStep) return "current"
    return "pending"
  }

  const isHorizontal = orientation === "horizontal"

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isHorizontal ? "row" : "column",
        alignItems: isHorizontal ? "flex-start" : "stretch",
        gap: 0,
      }}
    >
      {steps.map((step, index) => {
        const status = getStepStatus(index)
        const colors = getStepColors(status)
        const isLast = index === steps.length - 1
        const isClickableStep = clickable && (status === "completed" || status === "current")
        const isHovered = hoveredIndex === index && isClickableStep

        return (
          <div
            key={step.id}
            style={{
              display: "flex",
              flexDirection: isHorizontal ? "column" : "row",
              alignItems: isHorizontal ? "center" : "flex-start",
              flex: isHorizontal ? 1 : "none",
              position: "relative",
            }}
          >
            {/* Step content */}
            <div
              onClick={() => {
                if (isClickableStep && onStepClick) {
                  onStepClick(index)
                }
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                display: "flex",
                flexDirection: isHorizontal ? "column" : "row",
                alignItems: "center",
                gap: "12px",
                cursor: isClickableStep ? "pointer" : "default",
                transition: "all 0.2s ease",
                transform: isHovered ? "scale(1.02)" : "scale(1)",
              }}
            >
              {/* Circle with number/icon */}
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  backgroundColor: colors.circle,
                  border: `2px solid ${colors.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "all 0.2s ease",
                  boxShadow:
                    status === "current" || isHovered
                      ? "0 2px 4px rgba(0, 0, 0, 0.1)"
                      : "none",
                }}
              >
                {status === "completed" ? (
                  <div style={{ color: colors.icon, display: "flex" }}>
                    <CheckIcon />
                  </div>
                ) : step.icon ? (
                  <div style={{ color: colors.icon, display: "flex" }}>
                    {step.icon}
                  </div>
                ) : (
                  <span
                    style={{
                      fontSize: "16px",
                      fontWeight: 600,
                      color: colors.icon,
                    }}
                  >
                    {index + 1}
                  </span>
                )}
              </div>

              {/* Label + Description */}
              {variant === "default" && (
                <div
                  style={{
                    textAlign: isHorizontal ? "center" : "left",
                    maxWidth: isHorizontal ? "120px" : "none",
                  }}
                >
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: status === "current" ? 600 : 500,
                      color: colors.label,
                      whiteSpace: isHorizontal ? "nowrap" : "normal",
                      overflow: isHorizontal ? "hidden" : "visible",
                      textOverflow: isHorizontal ? "ellipsis" : "clip",
                    }}
                  >
                    {step.label}
                  </div>
                  {step.description && (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#6B7280",
                        marginTop: "2px",
                        whiteSpace: isHorizontal ? "nowrap" : "normal",
                        overflow: isHorizontal ? "hidden" : "visible",
                        textOverflow: isHorizontal ? "ellipsis" : "clip",
                      }}
                    >
                      {step.description}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Connector line */}
            {!isLast && showConnector && (
              <div
                style={{
                  position: isHorizontal ? "absolute" : "relative",
                  ...(isHorizontal
                    ? {
                        top: "20px",
                        left: "calc(50% + 24px)",
                        right: "calc(-50% + 24px)",
                        height: "2px",
                      }
                    : {
                        width: "2px",
                        height: "32px",
                        marginLeft: "19px",
                        marginTop: "4px",
                        marginBottom: "4px",
                      }),
                  backgroundColor: colors.connector,
                  transition: "all 0.2s ease",
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export type { Step, StepperProps }
