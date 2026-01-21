"use client"

import { useState } from "react"
import { DatePicker } from "@/components/shared/datepicker"

export default function TestDatePickerPage() {
  const [date1, setDate1] = useState<Date | null>(null)
  const [date2, setDate2] = useState<Date | null>(new Date())
  const [date3, setDate3] = useState<Date | null>(null)
  const [date4, setDate4] = useState<Date | null>(null)

  const today = new Date()
  const minDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const maxDate = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate())

  return (
    <div style={{ padding: "40px", maxWidth: "800px", margin: "0 auto" }}>
      <h1
        style={{
          fontSize: "28px",
          fontWeight: 700,
          color: "#0A1628",
          marginBottom: "8px",
        }}
      >
        DatePicker Component Test
      </h1>
      <p style={{ color: "#6B7280", marginBottom: "40px" }}>
        Testing all DatePicker states and configurations
      </p>

      {/* Basic DatePicker */}
      <section style={{ marginBottom: "48px" }}>
        <h2
          style={{
            fontSize: "18px",
            fontWeight: 600,
            color: "#111827",
            marginBottom: "16px",
          }}
        >
          Basic DatePicker
        </h2>
        <div
          style={{
            padding: "24px",
            backgroundColor: "#F9FAFB",
            borderRadius: "8px",
          }}
        >
          <DatePicker
            label="Date d'intervention"
            placeholder="Sélectionner une date"
            value={date1}
            onChange={setDate1}
          />
          <p style={{ fontSize: "14px", color: "#6B7280", marginTop: "8px" }}>
            Selected: {date1 ? date1.toLocaleDateString("fr-FR") : "None"}
          </p>
        </div>
      </section>

      {/* With Initial Value */}
      <section style={{ marginBottom: "48px" }}>
        <h2
          style={{
            fontSize: "18px",
            fontWeight: 600,
            color: "#111827",
            marginBottom: "16px",
          }}
        >
          With Initial Value
        </h2>
        <div
          style={{
            padding: "24px",
            backgroundColor: "#F9FAFB",
            borderRadius: "8px",
          }}
        >
          <DatePicker
            label="Date de création"
            value={date2}
            onChange={setDate2}
          />
          <p style={{ fontSize: "14px", color: "#6B7280", marginTop: "8px" }}>
            Selected: {date2 ? date2.toLocaleDateString("fr-FR") : "None"}
          </p>
        </div>
      </section>

      {/* Required Field */}
      <section style={{ marginBottom: "48px" }}>
        <h2
          style={{
            fontSize: "18px",
            fontWeight: 600,
            color: "#111827",
            marginBottom: "16px",
          }}
        >
          Required Field
        </h2>
        <div
          style={{
            padding: "24px",
            backgroundColor: "#F9FAFB",
            borderRadius: "8px",
          }}
        >
          <DatePicker
            label="Date de naissance"
            required
            placeholder="JJ/MM/AAAA"
          />
        </div>
      </section>

      {/* With MinDate and MaxDate */}
      <section style={{ marginBottom: "48px" }}>
        <h2
          style={{
            fontSize: "18px",
            fontWeight: 600,
            color: "#111827",
            marginBottom: "16px",
          }}
        >
          With MinDate / MaxDate
        </h2>
        <div
          style={{
            padding: "24px",
            backgroundColor: "#F9FAFB",
            borderRadius: "8px",
          }}
        >
          <DatePicker
            label="Date de rendez-vous"
            value={date3}
            onChange={setDate3}
            minDate={minDate}
            maxDate={maxDate}
            helperText="Choisissez une date dans les 3 prochains mois"
          />
          <p style={{ fontSize: "14px", color: "#6B7280", marginTop: "8px" }}>
            Min: {minDate.toLocaleDateString("fr-FR")} | Max:{" "}
            {maxDate.toLocaleDateString("fr-FR")}
          </p>
          <p style={{ fontSize: "14px", color: "#6B7280", marginTop: "4px" }}>
            Selected: {date3 ? date3.toLocaleDateString("fr-FR") : "None"}
          </p>
        </div>
      </section>

      {/* Error State */}
      <section style={{ marginBottom: "48px" }}>
        <h2
          style={{
            fontSize: "18px",
            fontWeight: 600,
            color: "#111827",
            marginBottom: "16px",
          }}
        >
          Error State
        </h2>
        <div
          style={{
            padding: "24px",
            backgroundColor: "#F9FAFB",
            borderRadius: "8px",
          }}
        >
          <DatePicker
            label="Date de naissance"
            error="La date est invalide ou manquante"
          />
        </div>
      </section>

      {/* Disabled State */}
      <section style={{ marginBottom: "48px" }}>
        <h2
          style={{
            fontSize: "18px",
            fontWeight: 600,
            color: "#111827",
            marginBottom: "16px",
          }}
        >
          Disabled State
        </h2>
        <div
          style={{
            padding: "24px",
            backgroundColor: "#F9FAFB",
            borderRadius: "8px",
          }}
        >
          <DatePicker
            label="Date de création"
            value={new Date()}
            disabled
          />
          <DatePicker
            label="Date vide (disabled)"
            disabled
            placeholder="Non disponible"
          />
        </div>
      </section>

      {/* With Helper Text */}
      <section style={{ marginBottom: "48px" }}>
        <h2
          style={{
            fontSize: "18px",
            fontWeight: 600,
            color: "#111827",
            marginBottom: "16px",
          }}
        >
          With Helper Text
        </h2>
        <div
          style={{
            padding: "24px",
            backgroundColor: "#F9FAFB",
            borderRadius: "8px",
          }}
        >
          <DatePicker
            label="Date d'expiration"
            helperText="Format attendu : JJ/MM/AAAA"
          />
        </div>
      </section>

      {/* Full Width */}
      <section style={{ marginBottom: "48px" }}>
        <h2
          style={{
            fontSize: "18px",
            fontWeight: 600,
            color: "#111827",
            marginBottom: "16px",
          }}
        >
          Full Width
        </h2>
        <div
          style={{
            padding: "24px",
            backgroundColor: "#F9FAFB",
            borderRadius: "8px",
          }}
        >
          <DatePicker
            label="Date complète"
            fullWidth
            value={date4}
            onChange={setDate4}
          />
        </div>
      </section>

      {/* Multiple DatePickers in Grid */}
      <section style={{ marginBottom: "48px" }}>
        <h2
          style={{
            fontSize: "18px",
            fontWeight: 600,
            color: "#111827",
            marginBottom: "16px",
          }}
        >
          Multiple DatePickers (Form Layout)
        </h2>
        <div
          style={{
            padding: "24px",
            backgroundColor: "#FFFFFF",
            borderRadius: "8px",
            border: "1px solid #E5E7EB",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "24px",
            }}
          >
            <DatePicker label="Date d'entrée" required />
            <DatePicker label="Date de sortie prévue" />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "24px",
            }}
          >
            <DatePicker
              label="Prochaine révision"
              helperText="Optionnel"
            />
            <DatePicker
              label="Contrôle technique"
              minDate={new Date()}
              helperText="Date future uniquement"
            />
          </div>
        </div>
      </section>

      {/* Real World Example: Intervention Form */}
      <section style={{ marginBottom: "48px" }}>
        <h2
          style={{
            fontSize: "18px",
            fontWeight: 600,
            color: "#111827",
            marginBottom: "16px",
          }}
        >
          Real World: Intervention Form
        </h2>
        <div
          style={{
            padding: "32px",
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            border: "1px solid #E5E7EB",
          }}
        >
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "#0A1628",
              marginBottom: "24px",
            }}
          >
            Nouvelle intervention
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "24px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#111827",
                  marginBottom: "6px",
                }}
              >
                Client
              </label>
              <input
                type="text"
                placeholder="Nom du client"
                style={{
                  width: "100%",
                  height: "40px",
                  padding: "0 14px",
                  fontSize: "14px",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  marginBottom: "20px",
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#111827",
                  marginBottom: "6px",
                }}
              >
                Véhicule
              </label>
              <input
                type="text"
                placeholder="Immatriculation"
                style={{
                  width: "100%",
                  height: "40px",
                  padding: "0 14px",
                  fontSize: "14px",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  marginBottom: "20px",
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "24px",
            }}
          >
            <DatePicker
              label="Date d'entrée"
              required
              value={new Date()}
            />
            <DatePicker
              label="Date de sortie estimée"
              minDate={new Date()}
            />
          </div>

          <div style={{ marginTop: "24px" }}>
            <button
              style={{
                padding: "10px 20px",
                backgroundColor: "#0A1628",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Créer l&apos;intervention
            </button>
          </div>
        </div>
      </section>

      {/* All States Summary */}
      <section style={{ marginBottom: "48px" }}>
        <h2
          style={{
            fontSize: "18px",
            fontWeight: 600,
            color: "#111827",
            marginBottom: "16px",
          }}
        >
          All States Summary
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "24px",
          }}
        >
          <div
            style={{
              padding: "16px",
              backgroundColor: "#F9FAFB",
              borderRadius: "8px",
            }}
          >
            <p
              style={{
                fontSize: "12px",
                color: "#6B7280",
                marginBottom: "8px",
              }}
            >
              Default
            </p>
            <DatePicker label="Date" />
          </div>
          <div
            style={{
              padding: "16px",
              backgroundColor: "#F9FAFB",
              borderRadius: "8px",
            }}
          >
            <p
              style={{
                fontSize: "12px",
                color: "#6B7280",
                marginBottom: "8px",
              }}
            >
              Required
            </p>
            <DatePicker label="Date" required />
          </div>
          <div
            style={{
              padding: "16px",
              backgroundColor: "#F9FAFB",
              borderRadius: "8px",
            }}
          >
            <p
              style={{
                fontSize: "12px",
                color: "#6B7280",
                marginBottom: "8px",
              }}
            >
              Error
            </p>
            <DatePicker label="Date" error="Champ requis" />
          </div>
          <div
            style={{
              padding: "16px",
              backgroundColor: "#F9FAFB",
              borderRadius: "8px",
            }}
          >
            <p
              style={{
                fontSize: "12px",
                color: "#6B7280",
                marginBottom: "8px",
              }}
            >
              Disabled
            </p>
            <DatePicker label="Date" disabled value={new Date()} />
          </div>
        </div>
      </section>
    </div>
  )
}
