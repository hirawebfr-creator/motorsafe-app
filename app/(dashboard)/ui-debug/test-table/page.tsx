'use client'

import { DataTableInline, DataTableColumn } from '@/components/shared/data-table-inline'
import { Pagination } from '@/components/shared/pagination'
import { Users } from 'lucide-react'
import { useState } from 'react'

// Fake data
const fakeClients = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  nom: `Client ${i + 1}`,
  email: `client${i + 1}@example.com`,
  telephone: `06 ${Math.floor(10000000 + Math.random() * 90000000)}`,
  createdAt: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toLocaleDateString('fr-FR')
}))

type FakeClient = typeof fakeClients[number]

export default function TestTablePage() {
  const [page, setPage] = useState(1)
  const [showLoading, setShowLoading] = useState(false)
  const [showEmpty, setShowEmpty] = useState(false)
  const pageSize = 10

  const columns: DataTableColumn<FakeClient>[] = [
    { key: 'nom', label: 'Nom', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'telephone', label: 'Téléphone' },
    { key: 'createdAt', label: 'Date création', sortable: true, width: '150px' },
    {
      key: 'actions',
      label: 'Actions',
      width: '100px',
      render: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              alert(`Voir client ${row.nom}`)
            }}
            style={{
              padding: '4px 12px',
              fontSize: '12px',
              backgroundColor: '#0A1628',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Voir
          </button>
        </div>
      )
    }
  ]

  const paginatedData = fakeClients.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div style={{ 
      padding: '32px', 
      maxWidth: '1400px', 
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
        Test DataTable
      </h1>

      {/* Controls */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        marginBottom: '32px',
        padding: '16px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e5e7eb'
      }}>
        <button
          onClick={() => {
            setShowLoading(false)
            setShowEmpty(false)
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: !showLoading && !showEmpty ? '#0A1628' : '#ffffff',
            color: !showLoading && !showEmpty ? '#ffffff' : '#374151',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Données normales
        </button>
        <button
          onClick={() => {
            setShowLoading(true)
            setShowEmpty(false)
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: showLoading ? '#0A1628' : '#ffffff',
            color: showLoading ? '#ffffff' : '#374151',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Loading state
        </button>
        <button
          onClick={() => {
            setShowLoading(false)
            setShowEmpty(true)
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: showEmpty ? '#0A1628' : '#ffffff',
            color: showEmpty ? '#ffffff' : '#374151',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Empty state
        </button>
      </div>

      {/* Table */}
      <div style={{ marginBottom: '24px' }}>
        <DataTableInline
          columns={columns}
          data={showLoading || showEmpty ? [] : paginatedData}
          loading={showLoading}
          onRowClick={(row) => console.log('Clicked:', row)}
          emptyState={
            showEmpty ? (
              <div style={{
                padding: '80px 32px',
                textAlign: 'center',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                minHeight: '400px',
                display: 'flex',
                flexDirection: 'column' as const,
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  marginBottom: '24px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Users style={{ width: '32px', height: '32px', color: '#6b7280' }} />
                </div>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  marginBottom: '8px', 
                  color: '#111827',
                  margin: '0 0 8px 0'
                }}>
                  Aucun client
                </h3>
                <p style={{ 
                  fontSize: '14px', 
                  color: '#6b7280', 
                  margin: '0 0 24px 0'
                }}>
                  Commencez par créer votre premier client
                </p>
                <button 
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#0A1628',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#1a2638'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#0A1628'
                  }}
                >
                  Nouveau client
                </button>
              </div>
            ) : undefined
          }
        />
        
        {!showLoading && !showEmpty && (
          <Pagination
            page={page}
            pageSize={pageSize}
            total={fakeClients.length}
            onPageChange={setPage}
          />
        )}
      </div>

      {/* Info */}
      <div style={{
        padding: '16px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        fontSize: '14px',
        color: '#6b7280'
      }}>
        <strong style={{ color: '#111827' }}>Instructions :</strong> Utilisez les boutons ci-dessus pour tester les différents états du tableau.
      </div>
    </div>
  )
}
