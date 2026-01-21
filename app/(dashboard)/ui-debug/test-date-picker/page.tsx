'use client'

import { useState } from 'react'
import { DatePicker } from '@/components/shared/date-picker'

// Helper to generate disabled weekends for next 60 days
function getDisabledWeekends(): Date[] {
  const dates: Date[] = []
  const today = new Date()
  for (let i = 0; i < 60; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    if (date.getDay() === 0 || date.getDay() === 6) {
      dates.push(date)
    }
  }
  return dates
}

export default function TestDatePickerPage() {
  const [basicDate, setBasicDate] = useState<Date | null>(null)
  const [controlledDate, setControlledDate] = useState<Date | null>(new Date())
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)

  const disabledWeekends = getDisabledWeekends()

  return (
    <div
      style={{
        padding: '40px',
        maxWidth: '900px',
        margin: '0 auto',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <h1
        style={{
          fontSize: '28px',
          fontWeight: 700,
          color: '#0A1628',
          marginBottom: '8px',
        }}
      >
        DatePicker Component Test
      </h1>
      <p
        style={{
          fontSize: '14px',
          color: '#6B7280',
          marginBottom: '40px',
        }}
      >
        Test all DatePicker variants and configurations
      </p>

      {/* Basic Usage */}
      <section style={{ marginBottom: '48px' }}>
        <h2
          style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#111827',
            marginBottom: '16px',
            paddingBottom: '8px',
            borderBottom: '1px solid #E5E7EB',
          }}
        >
          Basic Usage
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
          <DatePicker
            label="Simple date"
            placeholder="Sélectionner une date"
            value={basicDate}
            onChange={setBasicDate}
          />
          <div>
            <p style={{ fontSize: '13px', color: '#6B7280' }}>
              Selected: {basicDate ? basicDate.toLocaleDateString('fr-FR') : 'None'}
            </p>
          </div>
        </div>
      </section>

      {/* Sizes */}
      <section style={{ marginBottom: '48px' }}>
        <h2
          style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#111827',
            marginBottom: '16px',
            paddingBottom: '8px',
            borderBottom: '1px solid #E5E7EB',
          }}
        >
          Sizes
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <DatePicker label="Small (sm)" size="sm" placeholder="Small size" />
          <DatePicker label="Medium (md) - default" size="md" placeholder="Medium size" />
          <DatePicker label="Large (lg)" size="lg" placeholder="Large size" />
        </div>
      </section>

      {/* Formats */}
      <section style={{ marginBottom: '48px' }}>
        <h2
          style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#111827',
            marginBottom: '16px',
            paddingBottom: '8px',
            borderBottom: '1px solid #E5E7EB',
          }}
        >
          Date Formats
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          <DatePicker
            label="French (DD/MM/YYYY)"
            format="DD/MM/YYYY"
            value={controlledDate}
            onChange={setControlledDate}
          />
          <DatePicker
            label="US (MM/DD/YYYY)"
            format="MM/DD/YYYY"
            value={controlledDate}
            onChange={setControlledDate}
          />
          <DatePicker
            label="ISO (YYYY-MM-DD)"
            format="YYYY-MM-DD"
            value={controlledDate}
            onChange={setControlledDate}
          />
        </div>
      </section>

      {/* Min/Max Dates */}
      <section style={{ marginBottom: '48px' }}>
        <h2
          style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#111827',
            marginBottom: '16px',
            paddingBottom: '8px',
            borderBottom: '1px solid #E5E7EB',
          }}
        >
          Min/Max Date Constraints
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
          <DatePicker
            label="Future dates only (from today)"
            minDate={new Date()}
            helperText="Dates in the past are disabled"
          />
          <DatePicker
            label="Past dates only (until today)"
            maxDate={new Date()}
            helperText="Future dates are disabled"
          />
          <DatePicker
            label="Date of birth"
            minDate={new Date(1900, 0, 1)}
            maxDate={new Date()}
            placeholder="JJ/MM/AAAA"
            helperText="Between 1900 and today"
          />
          <DatePicker
            label="Next 30 days only"
            minDate={new Date()}
            maxDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
            helperText="Limited range selection"
          />
        </div>
      </section>

      {/* Disabled Dates */}
      <section style={{ marginBottom: '48px' }}>
        <h2
          style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#111827',
            marginBottom: '16px',
            paddingBottom: '8px',
            borderBottom: '1px solid #E5E7EB',
          }}
        >
          Disabled Dates
        </h2>
        <DatePicker
          label="Weekdays only"
          disabledDates={disabledWeekends}
          helperText="Saturdays and Sundays are disabled"
          fullWidth
        />
      </section>

      {/* Date Range */}
      <section style={{ marginBottom: '48px' }}>
        <h2
          style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#111827',
            marginBottom: '16px',
            paddingBottom: '8px',
            borderBottom: '1px solid #E5E7EB',
          }}
        >
          Date Range (Two DatePickers)
        </h2>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <DatePicker
            label="Start date"
            value={startDate}
            onChange={setStartDate}
            maxDate={endDate || undefined}
            helperText="Cannot be after end date"
          />
          <DatePicker
            label="End date"
            value={endDate}
            onChange={setEndDate}
            minDate={startDate || undefined}
            helperText="Cannot be before start date"
          />
        </div>
        <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '8px' }}>
          Range: {startDate?.toLocaleDateString('fr-FR') || '—'} →{' '}
          {endDate?.toLocaleDateString('fr-FR') || '—'}
        </p>
      </section>

      {/* States */}
      <section style={{ marginBottom: '48px' }}>
        <h2
          style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#111827',
            marginBottom: '16px',
            paddingBottom: '8px',
            borderBottom: '1px solid #E5E7EB',
          }}
        >
          States
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
          <DatePicker
            label="With helper text"
            helperText="Select the intervention date"
          />
          <DatePicker
            label="With error"
            error="La date est obligatoire"
          />
          <DatePicker
            label="Disabled"
            value={new Date()}
            disabled
          />
          <DatePicker
            label="Required field"
            required
            placeholder="Mandatory date"
          />
          <DatePicker
            label="Non-clearable"
            clearable={false}
            value={new Date()}
            helperText="Clear button is hidden"
          />
          <DatePicker
            label="Full width"
            fullWidth
            helperText="Expands to container width"
          />
        </div>
      </section>

      {/* Interactive Demo */}
      <section
        style={{
          marginBottom: '48px',
          padding: '24px',
          backgroundColor: '#F9FAFB',
          borderRadius: '12px',
        }}
      >
        <h2
          style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#111827',
            marginBottom: '16px',
          }}
        >
          Interactive Demo
        </h2>
        <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '16px' }}>
          Full-featured date picker with all options enabled
        </p>
        <DatePicker
          label="Date d'intervention"
          value={controlledDate}
          onChange={setControlledDate}
          minDate={new Date()}
          helperText="Sélectionnez une date future pour l'intervention"
          required
          fullWidth
        />
        <div
          style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
          }}
        >
          <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>
            <strong>Selected value:</strong>{' '}
            {controlledDate ? (
              <>
                {controlledDate.toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </>
            ) : (
              'No date selected'
            )}
          </p>
        </div>
      </section>

      {/* Tests checklist */}
      <section
        style={{
          padding: '24px',
          backgroundColor: '#F0FDF4',
          borderRadius: '12px',
          border: '1px solid #BBF7D0',
        }}
      >
        <h2
          style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#166534',
            marginBottom: '16px',
          }}
        >
          ✅ Tests Checklist
        </h2>
        <ul
          style={{
            margin: 0,
            paddingLeft: '20px',
            fontSize: '14px',
            color: '#166534',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px',
          }}
        >
          <li>Click input opens calendar</li>
          <li>Click day selects and closes</li>
          <li>Month navigation works</li>
          <li>Today button works</li>
          <li>Clear button clears date</li>
          <li>ESC closes calendar</li>
          <li>Click outside closes calendar</li>
          <li>MinDate disables past days</li>
          <li>MaxDate disables future days</li>
          <li>DisabledDates works</li>
          <li>Today has special border</li>
          <li>Selected day is navy blue</li>
          <li>All 3 date formats work</li>
          <li>Disabled state works</li>
        </ul>
      </section>
    </div>
  )
}
