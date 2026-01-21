'use client'

import { Avatar } from '@/components/shared/avatar'

export default function TestAvatarPage() {
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
        Avatar Component Test
      </h1>
      <p
        style={{
          fontSize: '14px',
          color: '#6B7280',
          marginBottom: '40px',
        }}
      >
        Test all Avatar variants: sizes, shapes, status, fallbacks
      </p>

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'center' }}>
            <Avatar name="Jean Dupont" size="xs" />
            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '8px' }}>xs (24px)</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Avatar name="Jean Dupont" size="sm" />
            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '8px' }}>sm (32px)</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Avatar name="Jean Dupont" size="md" />
            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '8px' }}>md (40px)</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Avatar name="Jean Dupont" size="lg" />
            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '8px' }}>lg (48px)</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Avatar name="Jean Dupont" size="xl" />
            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '8px' }}>xl (64px)</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Avatar name="Jean Dupont" size="2xl" />
            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '8px' }}>2xl (80px)</div>
          </div>
        </div>
      </section>

      {/* Shapes */}
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
          Shapes
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ textAlign: 'center' }}>
            <Avatar name="Garage Horizon" size="lg" shape="circle" />
            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '8px' }}>Circle</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Avatar name="Garage Horizon" size="lg" shape="square" />
            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '8px' }}>Square</div>
          </div>
        </div>
      </section>

      {/* Status Indicators */}
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
          Status Indicators
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ textAlign: 'center' }}>
            <Avatar name="Alice" size="lg" status="online" showStatus />
            <div style={{ fontSize: '12px', color: '#16A34A', marginTop: '8px' }}>Online</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Avatar name="Bob" size="lg" status="away" showStatus />
            <div style={{ fontSize: '12px', color: '#F59E0B', marginTop: '8px' }}>Away</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Avatar name="Charlie" size="lg" status="busy" showStatus />
            <div style={{ fontSize: '12px', color: '#DC2626', marginTop: '8px' }}>Busy</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Avatar name="David" size="lg" status="offline" showStatus />
            <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '8px' }}>Offline</div>
          </div>
        </div>
      </section>

      {/* Initials Fallback */}
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
          Initials Fallback (No Image)
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'center' }}>
            <Avatar name="Jean Dupont" size="lg" />
            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '8px' }}>
              Jean Dupont → JD
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Avatar name="Marie" size="lg" />
            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '8px' }}>Marie → MA</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Avatar name="Jean-Pierre Martin" size="lg" />
            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '8px' }}>
              Jean-Pierre Martin → JM
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Avatar name="" size="lg" />
            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '8px' }}>Empty → ?</div>
          </div>
        </div>
      </section>

      {/* Custom Colors */}
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
          Custom Fallback Colors
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Avatar name="Garage Horizon" size="xl" fallbackBg="#FF7F00" fallbackColor="#FFFFFF" />
          <Avatar name="Auto Service" size="xl" fallbackBg="#16A34A" fallbackColor="#FFFFFF" />
          <Avatar name="Motor Plus" size="xl" fallbackBg="#DC2626" fallbackColor="#FFFFFF" />
          <Avatar name="Car Expert" size="xl" fallbackBg="#7C3AED" fallbackColor="#FFFFFF" />
        </div>
      </section>

      {/* Clickable */}
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
          Clickable (Hover to scale)
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Avatar
            name="Jean Dupont"
            size="lg"
            onClick={() => alert('Avatar clicked!')}
            status="online"
            showStatus
          />
          <span style={{ fontSize: '14px', color: '#6B7280' }}>← Hover and click me</span>
        </div>
      </section>

      {/* Image Error Handling */}
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
          Image Error Handling
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Avatar
            src="/this-image-does-not-exist.jpg"
            name="Jean Dupont"
            size="lg"
          />
          <span style={{ fontSize: '14px', color: '#6B7280' }}>
            ← Broken image URL, shows initials fallback
          </span>
        </div>
      </section>

      {/* Avatar Group */}
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
          Avatar Group (Stacked)
        </h2>
        <div style={{ display: 'flex' }}>
          {['Alice B', 'Bob C', 'Charlie D', 'David E'].map((name, index) => (
            <div
              key={name}
              style={{
                marginLeft: index > 0 ? '-10px' : 0,
                position: 'relative',
                zIndex: 10 - index,
              }}
            >
              <Avatar name={name} size="md" />
            </div>
          ))}
          <div
            style={{
              marginLeft: '-10px',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#F3F4F6',
              border: '2px solid #FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 600,
              color: '#6B7280',
            }}
          >
            +5
          </div>
        </div>
      </section>

      {/* User Card Example */}
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
          User Card Example
        </h2>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '16px',
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
          }}
        >
          <Avatar name="Jean Dupont" size="xl" status="online" showStatus />
          <div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>Jean Dupont</div>
            <div style={{ fontSize: '14px', color: '#6B7280' }}>Administrateur</div>
            <div style={{ fontSize: '12px', color: '#16A34A', marginTop: '4px' }}>● En ligne</div>
          </div>
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
          <li>Image displays correctly</li>
          <li>Fallback initials if no image</li>
          <li>Fallback initials on image error</li>
          <li>Initials calculated correctly</li>
          <li>Status indicator positioned</li>
          <li>All status colors correct</li>
          <li>All 6 sizes work</li>
          <li>Circle and square shapes</li>
          <li>Hover scale if onClick</li>
          <li>No hover if no onClick</li>
          <li>White border around status</li>
          <li>Custom fallback colors work</li>
        </ul>
      </section>
    </div>
  )
}
