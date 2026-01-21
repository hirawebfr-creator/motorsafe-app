"use client"

import { useState } from "react"
import { Stepper } from "@/components/shared/stepper"

// Simple icons for testing
const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const BuildingIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
    <path d="M9 22v-4h6v4" />
    <path d="M8 6h.01" />
    <path d="M16 6h.01" />
    <path d="M12 6h.01" />
    <path d="M12 10h.01" />
    <path d="M12 14h.01" />
    <path d="M16 10h.01" />
    <path d="M16 14h.01" />
    <path d="M8 10h.01" />
    <path d="M8 14h.01" />
  </svg>
)

const CreditCardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
)

const CheckCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

export default function TestStepperPage() {
  const [step1, setStep1] = useState(1)
  const [step2, setStep2] = useState(0)
  const [stepVertical, setStepVertical] = useState(2)

  return (
    <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#0A1628", marginBottom: "8px" }}>
        Stepper Component Test
      </h1>
      <p style={{ color: "#6B7280", marginBottom: "40px" }}>
        Testing all stepper variants, orientations, and states
      </p>

      {/* Basic Horizontal */}
      <section style={{ marginBottom: "48px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", marginBottom: "16px" }}>
          Basic Horizontal (Step 2 of 3)
        </h2>
        <div style={{ padding: "24px", backgroundColor: "#F9FAFB", borderRadius: "8px" }}>
          <Stepper
            steps={[
              { id: "1", label: "Informations" },
              { id: "2", label: "Coordonnées" },
              { id: "3", label: "Confirmation" },
            ]}
            currentStep={1}
          />
        </div>
      </section>

      {/* With Descriptions */}
      <section style={{ marginBottom: "48px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", marginBottom: "16px" }}>
          With Descriptions
        </h2>
        <div style={{ padding: "24px", backgroundColor: "#F9FAFB", borderRadius: "8px" }}>
          <Stepper
            steps={[
              { id: "1", label: "Compte", description: "Créez votre compte" },
              { id: "2", label: "Profil", description: "Complétez votre profil" },
              { id: "3", label: "Validation", description: "Validez vos informations" },
            ]}
            currentStep={1}
          />
        </div>
      </section>

      {/* With Custom Icons */}
      <section style={{ marginBottom: "48px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", marginBottom: "16px" }}>
          With Custom Icons (Step 3 of 4)
        </h2>
        <div style={{ padding: "24px", backgroundColor: "#F9FAFB", borderRadius: "8px" }}>
          <Stepper
            steps={[
              { id: "1", label: "Utilisateur", icon: <UserIcon /> },
              { id: "2", label: "Garage", icon: <BuildingIcon /> },
              { id: "3", label: "Paiement", icon: <CreditCardIcon /> },
              { id: "4", label: "Terminé", icon: <CheckCircleIcon /> },
            ]}
            currentStep={2}
          />
        </div>
      </section>

      {/* Clickable Navigation */}
      <section style={{ marginBottom: "48px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", marginBottom: "16px" }}>
          Clickable Navigation (Current: Step {step1 + 1})
        </h2>
        <div style={{ padding: "24px", backgroundColor: "#F9FAFB", borderRadius: "8px" }}>
          <Stepper
            steps={[
              { id: "1", label: "Informations" },
              { id: "2", label: "Adresse" },
              { id: "3", label: "Paiement" },
              { id: "4", label: "Confirmation" },
            ]}
            currentStep={step1}
            onStepClick={(index) => setStep1(index)}
            clickable
          />
          <div style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
            <button
              onClick={() => setStep1((prev) => Math.max(0, prev - 1))}
              disabled={step1 === 0}
              style={{
                padding: "8px 16px",
                backgroundColor: step1 === 0 ? "#E5E7EB" : "#FFFFFF",
                border: "1px solid #D1D5DB",
                borderRadius: "6px",
                cursor: step1 === 0 ? "not-allowed" : "pointer",
                color: step1 === 0 ? "#9CA3AF" : "#374151",
              }}
            >
              Précédent
            </button>
            <button
              onClick={() => setStep1((prev) => Math.min(3, prev + 1))}
              disabled={step1 === 3}
              style={{
                padding: "8px 16px",
                backgroundColor: step1 === 3 ? "#E5E7EB" : "#0A1628",
                border: "none",
                borderRadius: "6px",
                cursor: step1 === 3 ? "not-allowed" : "pointer",
                color: "#FFFFFF",
              }}
            >
              Suivant
            </button>
          </div>
        </div>
      </section>

      {/* All States */}
      <section style={{ marginBottom: "48px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", marginBottom: "16px" }}>
          All States Visible
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px" }}>
          <div style={{ padding: "24px", backgroundColor: "#F9FAFB", borderRadius: "8px" }}>
            <p style={{ fontSize: "12px", color: "#6B7280", marginBottom: "12px" }}>All Pending (Step 0)</p>
            <Stepper
              steps={[
                { id: "1", label: "Step 1" },
                { id: "2", label: "Step 2" },
                { id: "3", label: "Step 3" },
              ]}
              currentStep={0}
            />
          </div>
          <div style={{ padding: "24px", backgroundColor: "#F9FAFB", borderRadius: "8px" }}>
            <p style={{ fontSize: "12px", color: "#6B7280", marginBottom: "12px" }}>Middle (Step 1)</p>
            <Stepper
              steps={[
                { id: "1", label: "Step 1" },
                { id: "2", label: "Step 2" },
                { id: "3", label: "Step 3" },
              ]}
              currentStep={1}
            />
          </div>
          <div style={{ padding: "24px", backgroundColor: "#F9FAFB", borderRadius: "8px" }}>
            <p style={{ fontSize: "12px", color: "#6B7280", marginBottom: "12px" }}>All Completed (Step 3)</p>
            <Stepper
              steps={[
                { id: "1", label: "Step 1" },
                { id: "2", label: "Step 2" },
                { id: "3", label: "Step 3" },
              ]}
              currentStep={3}
            />
          </div>
        </div>
      </section>

      {/* Vertical Orientation */}
      <section style={{ marginBottom: "48px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", marginBottom: "16px" }}>
          Vertical Orientation
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          <div style={{ padding: "24px", backgroundColor: "#F9FAFB", borderRadius: "8px" }}>
            <p style={{ fontSize: "12px", color: "#6B7280", marginBottom: "16px" }}>With Descriptions</p>
            <Stepper
              orientation="vertical"
              steps={[
                { id: "1", label: "Étape 1", description: "Description de l'étape 1" },
                { id: "2", label: "Étape 2", description: "Description de l'étape 2" },
                { id: "3", label: "Étape 3", description: "Description de l'étape 3" },
                { id: "4", label: "Étape 4", description: "Description de l'étape 4" },
              ]}
              currentStep={1}
            />
          </div>
          <div style={{ padding: "24px", backgroundColor: "#F9FAFB", borderRadius: "8px" }}>
            <p style={{ fontSize: "12px", color: "#6B7280", marginBottom: "16px" }}>
              Clickable Vertical (Current: {stepVertical + 1})
            </p>
            <Stepper
              orientation="vertical"
              steps={[
                { id: "created", label: "Intervention créée", description: "21 janv. 2026 - 10:30" },
                { id: "started", label: "En cours", description: "21 janv. 2026 - 14:00" },
                { id: "review", label: "En révision", description: "En attente" },
                { id: "completed", label: "Terminée", description: "À venir" },
              ]}
              currentStep={stepVertical}
              onStepClick={(index) => setStepVertical(index)}
              clickable
            />
          </div>
        </div>
      </section>

      {/* Simple Variant */}
      <section style={{ marginBottom: "48px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", marginBottom: "16px" }}>
          Simple Variant (No Labels)
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          <div style={{ padding: "24px", backgroundColor: "#F9FAFB", borderRadius: "8px" }}>
            <p style={{ fontSize: "12px", color: "#6B7280", marginBottom: "12px" }}>Horizontal Simple</p>
            <Stepper
              variant="simple"
              steps={[
                { id: "1", label: "Step 1" },
                { id: "2", label: "Step 2" },
                { id: "3", label: "Step 3" },
                { id: "4", label: "Step 4" },
              ]}
              currentStep={step2}
              onStepClick={(index) => setStep2(index)}
              clickable
            />
            <div style={{ marginTop: "16px", textAlign: "center" }}>
              <span style={{ fontSize: "14px", color: "#6B7280" }}>
                Step {step2 + 1} of 4
              </span>
            </div>
          </div>
          <div style={{ padding: "24px", backgroundColor: "#F9FAFB", borderRadius: "8px" }}>
            <p style={{ fontSize: "12px", color: "#6B7280", marginBottom: "12px" }}>Vertical Simple</p>
            <Stepper
              orientation="vertical"
              variant="simple"
              steps={[
                { id: "1", label: "Step 1" },
                { id: "2", label: "Step 2" },
                { id: "3", label: "Step 3" },
              ]}
              currentStep={1}
            />
          </div>
        </div>
      </section>

      {/* Without Connector */}
      <section style={{ marginBottom: "48px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", marginBottom: "16px" }}>
          Without Connector Lines
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          <div style={{ padding: "24px", backgroundColor: "#F9FAFB", borderRadius: "8px" }}>
            <p style={{ fontSize: "12px", color: "#6B7280", marginBottom: "12px" }}>Horizontal</p>
            <Stepper
              showConnector={false}
              steps={[
                { id: "1", label: "Étape 1" },
                { id: "2", label: "Étape 2" },
                { id: "3", label: "Étape 3" },
              ]}
              currentStep={1}
            />
          </div>
          <div style={{ padding: "24px", backgroundColor: "#F9FAFB", borderRadius: "8px" }}>
            <p style={{ fontSize: "12px", color: "#6B7280", marginBottom: "12px" }}>Vertical</p>
            <Stepper
              orientation="vertical"
              showConnector={false}
              steps={[
                { id: "1", label: "Étape 1" },
                { id: "2", label: "Étape 2" },
                { id: "3", label: "Étape 3" },
              ]}
              currentStep={1}
            />
          </div>
        </div>
      </section>

      {/* Real World Example: Signup Flow */}
      <section style={{ marginBottom: "48px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", marginBottom: "16px" }}>
          Real World: Signup Flow
        </h2>
        <div
          style={{
            padding: "32px",
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            border: "1px solid #E5E7EB",
          }}
        >
          <Stepper
            steps={[
              { id: "account", label: "Compte", description: "Email et mot de passe", icon: <UserIcon /> },
              { id: "garage", label: "Garage", description: "Informations du garage", icon: <BuildingIcon /> },
              { id: "billing", label: "Facturation", description: "Coordonnées de paiement", icon: <CreditCardIcon /> },
              { id: "done", label: "Terminé", description: "Bienvenue !", icon: <CheckCircleIcon /> },
            ]}
            currentStep={1}
          />
          <div
            style={{
              marginTop: "40px",
              padding: "24px",
              backgroundColor: "#F9FAFB",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <h3 style={{ fontSize: "20px", fontWeight: 600, color: "#111827", marginBottom: "8px" }}>
              Garage
            </h3>
            <p style={{ color: "#6B7280" }}>Renseignez les informations de votre garage</p>
          </div>
        </div>
      </section>

      {/* Many Steps */}
      <section style={{ marginBottom: "48px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", marginBottom: "16px" }}>
          Many Steps (6 Steps)
        </h2>
        <div style={{ padding: "24px", backgroundColor: "#F9FAFB", borderRadius: "8px" }}>
          <Stepper
            steps={[
              { id: "1", label: "Accueil" },
              { id: "2", label: "Compte" },
              { id: "3", label: "Profil" },
              { id: "4", label: "Garage" },
              { id: "5", label: "Abonnement" },
              { id: "6", label: "Terminé" },
            ]}
            currentStep={3}
          />
        </div>
      </section>

      {/* Onboarding Example */}
      <section style={{ marginBottom: "48px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", marginBottom: "16px" }}>
          Onboarding Progress
        </h2>
        <div
          style={{
            padding: "32px",
            backgroundColor: "#0A1628",
            borderRadius: "12px",
            color: "#FFFFFF",
          }}
        >
          <div style={{ maxWidth: "600px", margin: "0 auto" }}>
            <Stepper
              steps={[
                { id: "1", label: "Bienvenue", description: "Découvrez MotorSafe" },
                { id: "2", label: "Configuration", description: "Paramétrez votre compte" },
                { id: "3", label: "Premier client", description: "Ajoutez un client" },
                { id: "4", label: "Prêt !", description: "Commencez à travailler" },
              ]}
              currentStep={2}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
