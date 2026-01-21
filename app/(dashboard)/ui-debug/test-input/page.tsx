'use client'

import { Input } from '@/components/shared/input'
import { Search, Mail, Lock, CheckCircle, User, Phone, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useRef, useState } from 'react'

export default function TestInputPage() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [description, setDescription] = useState('')

  return (
    <div style={{ 
      padding: '32px', 
      maxWidth: '800px', 
      margin: '0 auto',
      minHeight: '100vh',
      backgroundColor: '#f9fafb'
    }}>
      <h1 style={{ 
        fontSize: '30px', 
        fontWeight: '700', 
        marginBottom: '32px',
        color: '#111827'
      }}>
        Test Input Component
      </h1>

      {/* Basic Inputs */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          marginBottom: '16px',
          color: '#374151'
        }}>
          Basic Inputs
        </h2>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: '20px',
          padding: '24px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <Input placeholder="Simple input sans label" />
          <Input label="Nom complet" placeholder="Jean Dupont" />
          <Input label="Email" type="email" placeholder="exemple@email.com" />
        </div>
      </section>

      {/* Sizes */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          marginBottom: '16px',
          color: '#374151'
        }}>
          Sizes
        </h2>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: '20px',
          padding: '24px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <Input size="sm" label="Small" placeholder="Small input" />
          <Input size="md" label="Medium (default)" placeholder="Medium input" />
          <Input size="lg" label="Large" placeholder="Large input" />
        </div>
      </section>

      {/* With Icons */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          marginBottom: '16px',
          color: '#374151'
        }}>
          With Icons
        </h2>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: '20px',
          padding: '24px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <Input 
            label="Recherche" 
            leftIcon={<Search size={16} />}
            placeholder="Rechercher un client..."
          />
          <Input 
            label="Email" 
            type="email"
            leftIcon={<Mail size={16} />}
            placeholder="exemple@email.com"
          />
          <Input 
            label="Téléphone" 
            type="tel"
            leftIcon={<Phone size={16} />}
            placeholder="06 12 34 56 78"
          />
          <Input 
            label="Utilisateur" 
            leftIcon={<User size={16} />}
            rightIcon={<CheckCircle size={16} style={{ color: '#16A34A' }} />}
            placeholder="Nom d'utilisateur"
            defaultValue="jean.dupont"
          />
        </div>
      </section>

      {/* Password with toggle */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          marginBottom: '16px',
          color: '#374151'
        }}>
          Password Toggle
        </h2>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: '20px',
          padding: '24px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ position: 'relative' }}>
            <Input 
              label="Mot de passe" 
              type={showPassword ? 'text' : 'password'}
              leftIcon={<Lock size={16} />}
              placeholder="••••••••"
              helperText="8 caractères minimum"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '36px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#6B7280',
                padding: '4px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      </section>

      {/* Variants */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          marginBottom: '16px',
          color: '#374151'
        }}>
          Variants (default, error, success)
        </h2>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: '20px',
          padding: '24px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <Input 
            label="Default" 
            variant="default"
            placeholder="Focus pour voir le style"
            helperText="Ceci est un texte d'aide"
          />
          <Input 
            label="Error" 
            variant="error"
            leftIcon={<Mail size={16} />}
            rightIcon={<AlertCircle size={16} style={{ color: '#DC2626' }} />}
            defaultValue="email-invalide"
            errorText="Veuillez entrer un email valide"
          />
          <Input 
            label="Success" 
            variant="success"
            leftIcon={<Mail size={16} />}
            rightIcon={<CheckCircle size={16} style={{ color: '#16A34A' }} />}
            defaultValue="contact@motorsafe.fr"
            helperText="Email vérifié ✓"
          />
        </div>
      </section>

      {/* Character Count */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          marginBottom: '16px',
          color: '#374151'
        }}>
          Character Count
        </h2>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: '20px',
          padding: '24px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <Input 
            label="Description courte" 
            placeholder="Décrivez votre problème..."
            maxLength={50}
            showCharCount
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            helperText="Soyez bref et précis"
          />
          <Input 
            label="Titre" 
            placeholder="Titre de l'intervention"
            maxLength={30}
            showCharCount
            defaultValue="Vidange + filtres"
          />
        </div>
      </section>

      {/* Disabled & FullWidth */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          marginBottom: '16px',
          color: '#374151'
        }}>
          Disabled & FullWidth
        </h2>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: '20px',
          padding: '24px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <Input 
            label="SIRET (disabled)" 
            defaultValue="123 456 789 01234"
            disabled
            leftIcon={<Lock size={16} />}
          />
          <Input 
            label="Adresse complète (fullWidth)" 
            placeholder="123 rue de la Paix, 75001 Paris"
            fullWidth
          />
        </div>
      </section>

      {/* Ref Test */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          marginBottom: '16px',
          color: '#374151'
        }}>
          Ref Test
        </h2>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: '16px',
          padding: '24px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <Input 
            ref={inputRef}
            label="Focus me via ref" 
            placeholder="Cliquez le bouton ci-dessous"
          />
          <button
            onClick={() => inputRef.current?.focus()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#0A1628',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              alignSelf: 'flex-start'
            }}
          >
            Focus l'input
          </button>
        </div>
      </section>

      {/* Input Types */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          marginBottom: '16px',
          color: '#374151'
        }}>
          Different Input Types
        </h2>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '20px',
          padding: '24px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <Input label="Text" type="text" placeholder="Texte" />
          <Input label="Number" type="number" placeholder="123" />
          <Input label="Date" type="date" />
          <Input label="Time" type="time" />
          <Input label="URL" type="url" placeholder="https://..." />
          <Input label="Search" type="search" placeholder="Rechercher..." />
        </div>
      </section>

      {/* Checklist */}
      <div style={{
        padding: '16px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        fontSize: '14px',
        color: '#6b7280'
      }}>
        <strong style={{ color: '#111827' }}>Checklist :</strong>
        <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
          <li>✅ Focus affiche border + shadow</li>
          <li>✅ Blur retire le focus style</li>
          <li>✅ Hover change la border (si pas focus)</li>
          <li>✅ Error variant : border rouge + errorText</li>
          <li>✅ Success variant : border verte</li>
          <li>✅ Icons gauche/droite bien positionnées</li>
          <li>✅ Label affiché au-dessus</li>
          <li>✅ Helper text affiché en dessous</li>
          <li>✅ Character count fonctionne</li>
          <li>✅ Disabled bloque interactions</li>
          <li>✅ FullWidth prend 100% largeur</li>
          <li>✅ Ref fonctionne (bouton focus)</li>
        </ul>
      </div>
    </div>
  )
}
