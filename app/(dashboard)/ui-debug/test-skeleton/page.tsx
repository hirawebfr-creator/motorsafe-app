'use client'

import {
  Skeleton,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonTableRow,
  SkeletonListItem,
  SkeletonKpiCard,
} from '@/components/shared/loading-skeleton'

// ─────────────────────────────────────────────────────────────
// Test Page
// ─────────────────────────────────────────────────────────────

export default function TestSkeletonPage() {
  return (
    <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0A1628', marginBottom: '8px' }}>
        LoadingSkeleton Component Test
      </h1>
      <p style={{ color: '#6B7280', marginBottom: '40px' }}>
        Test des placeholders animés pour indiquer le chargement de contenu.
      </p>

      {/* Text Variant */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          1. Variant Text (default)
        </h2>
        <div
          style={{
            padding: '20px',
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
          }}
        >
          <Skeleton variant="text" />
        </div>
      </section>

      {/* Multiple Text Lines */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          2. Plusieurs lignes (count=3)
        </h2>
        <div
          style={{
            padding: '20px',
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
          }}
        >
          <Skeleton variant="text" count={3} />
        </div>
      </section>

      {/* Title + Paragraph */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          3. Titre + Paragraphe
        </h2>
        <div
          style={{
            padding: '20px',
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
          }}
        >
          <Skeleton variant="text" width="60%" height="32px" />
          <div style={{ marginTop: '12px' }}>
            <Skeleton variant="text" count={3} />
          </div>
        </div>
      </section>

      {/* Circular Variant */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          4. Variant Circular (avatars)
        </h2>
        <div
          style={{
            padding: '20px',
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
          }}
        >
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="circular" width={40} height={40} />
          <Skeleton variant="circular" width={48} height={48} />
          <Skeleton variant="circular" width={64} height={64} />
          <Skeleton variant="circular" width={80} height={80} />
        </div>
      </section>

      {/* Rectangular Variant */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          5. Variant Rectangular (images sans border-radius)
        </h2>
        <div
          style={{
            padding: '20px',
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
          }}
        >
          <Skeleton variant="rectangular" width="100%" height={200} />
        </div>
      </section>

      {/* Rounded Variant */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          6. Variant Rounded (cards, conteneurs)
        </h2>
        <div
          style={{
            padding: '20px',
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
          }}
        >
          <Skeleton variant="rounded" width="100%" height={200} />
        </div>
      </section>

      {/* Custom Sizes */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          7. Tailles Personnalisées
        </h2>
        <div
          style={{
            padding: '20px',
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <Skeleton variant="text" width="30%" />
          <Skeleton variant="text" width="50%" />
          <Skeleton variant="text" width="70%" />
          <Skeleton variant="text" width="100%" />
        </div>
      </section>

      {/* Without Animation */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          8. Sans Animation (animate=false)
        </h2>
        <div
          style={{
            padding: '20px',
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
          }}
        >
          <Skeleton variant="circular" width={40} height={40} animate={false} />
          <div style={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" animate={false} />
            <div style={{ marginTop: '8px' }}>
              <Skeleton variant="text" width="40%" animate={false} />
            </div>
          </div>
        </div>
        <p style={{ marginTop: '8px', fontSize: '13px', color: '#6B7280' }}>
          Statique, sans effet shimmer
        </p>
      </section>

      {/* SkeletonAvatar Helper */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          9. SkeletonAvatar (helper)
        </h2>
        <div
          style={{
            padding: '20px',
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <SkeletonAvatar size={40} />
          <SkeletonAvatar size={48} />
          <SkeletonAvatar size={56} />
        </div>
      </section>

      {/* SkeletonCard Helper */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          10. SkeletonCard (helper)
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
          }}
        >
          <SkeletonCard imageHeight={140} />
          <SkeletonCard imageHeight={140} />
          <SkeletonCard imageHeight={140} />
        </div>
      </section>

      {/* SkeletonListItem Helper */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          11. SkeletonListItem (helper)
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <SkeletonListItem />
          <SkeletonListItem />
          <SkeletonListItem />
        </div>
      </section>

      {/* SkeletonKpiCard Helper */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          12. SkeletonKpiCard (helper)
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
          }}
        >
          <SkeletonKpiCard />
          <SkeletonKpiCard />
          <SkeletonKpiCard />
          <SkeletonKpiCard />
        </div>
      </section>

      {/* SkeletonTableRow Helper */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          13. SkeletonTableRow (helper)
        </h2>
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#F9FAFB' }}>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: '#374151',
                    borderBottom: '1px solid #E5E7EB',
                  }}
                >
                  Nom
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: '#374151',
                    borderBottom: '1px solid #E5E7EB',
                  }}
                >
                  Email
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: '#374151',
                    borderBottom: '1px solid #E5E7EB',
                  }}
                >
                  Statut
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: '#374151',
                    borderBottom: '1px solid #E5E7EB',
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <SkeletonTableRow columns={4} />
              <SkeletonTableRow columns={4} />
              <SkeletonTableRow columns={4} />
              <SkeletonTableRow columns={4} />
              <SkeletonTableRow columns={4} />
            </tbody>
          </table>
        </div>
      </section>

      {/* Full Page Loading Example */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          14. Exemple Page Complète (Dashboard)
        </h2>
        <div
          style={{
            padding: '24px',
            backgroundColor: '#F9FAFB',
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: '24px' }}>
            <Skeleton variant="text" width="200px" height="32px" />
            <div style={{ marginTop: '8px' }}>
              <Skeleton variant="text" width="300px" />
            </div>
          </div>

          {/* KPI Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px',
              marginBottom: '24px',
            }}
          >
            <SkeletonKpiCard />
            <SkeletonKpiCard />
            <SkeletonKpiCard />
            <SkeletonKpiCard />
          </div>

          {/* Chart */}
          <Skeleton variant="rounded" height={250} />
        </div>
      </section>

      {/* Client Detail Page Skeleton */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A1628', marginBottom: '16px' }}>
          15. Exemple Page Détail Client
        </h2>
        <div
          style={{
            padding: '24px',
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            <Skeleton variant="circular" width={80} height={80} />
            <div style={{ flex: 1 }}>
              <Skeleton variant="text" width="40%" height="32px" />
              <div style={{ marginTop: '8px' }}>
                <Skeleton variant="text" width="60%" />
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <Skeleton variant="rounded" width={100} height={32} />
                <Skeleton variant="rounded" width={100} height={32} />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            <Skeleton variant="rounded" width={120} height={40} />
            <Skeleton variant="rounded" width={120} height={40} />
            <Skeleton variant="rounded" width={120} height={40} />
          </div>

          {/* Content */}
          <Skeleton variant="rounded" height={300} />
        </div>
      </section>

      {/* Info Box */}
      <section
        style={{
          padding: '20px',
          backgroundColor: '#F0F9FF',
          borderRadius: '8px',
          border: '1px solid #BAE6FD',
        }}
      >
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0369A1', marginBottom: '12px' }}>
          📋 Récapitulatif
        </h3>
        <ul style={{ fontSize: '13px', color: '#0C4A6E', margin: 0, paddingLeft: '20px' }}>
          <li style={{ marginBottom: '4px' }}>
            <strong>4 variants</strong>: text, circular, rectangular, rounded
          </li>
          <li style={{ marginBottom: '4px' }}>
            <strong>count</strong>: répète plusieurs skeletons
          </li>
          <li style={{ marginBottom: '4px' }}>
            <strong>width/height</strong>: dimensions personnalisables (px ou %)
          </li>
          <li style={{ marginBottom: '4px' }}>
            <strong>animate</strong>: active/désactive l&apos;effet shimmer
          </li>
          <li style={{ marginBottom: '4px' }}>
            <strong>Helpers</strong>: SkeletonAvatar, SkeletonCard, SkeletonListItem
          </li>
          <li>
            <strong>SkeletonTableRow</strong>: pour les tableaux
          </li>
        </ul>
      </section>
    </div>
  )
}
