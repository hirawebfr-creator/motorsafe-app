'use client'

import { useState } from 'react'
import { FileUpload } from '@/components/shared/file-upload'

export default function TestFileUploadPage() {
  const [basicFiles, setBasicFiles] = useState<File[]>([])
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [pdfFiles, setPdfFiles] = useState<File[]>([])

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
        FileUpload Component Test
      </h1>
      <p
        style={{
          fontSize: '14px',
          color: '#6B7280',
          marginBottom: '40px',
        }}
      >
        Test drag & drop, file validation, and previews
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
        <FileUpload
          label="Documents"
          description="Upload any type of file"
          value={basicFiles}
          onChange={setBasicFiles}
          multiple
        />
        <div
          style={{
            marginTop: '8px',
            padding: '12px',
            backgroundColor: '#F9FAFB',
            borderRadius: '8px',
            fontSize: '13px',
            color: '#6B7280',
          }}
        >
          Files selected: {basicFiles.length}
        </div>
      </section>

      {/* Images with Preview */}
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
          Images with Preview
        </h2>
        <FileUpload
          label="Photos du véhicule"
          description="Ajoutez jusqu'à 5 photos (max 5MB chacune)"
          accept="image/*"
          maxSize={5 * 1024 * 1024}
          maxFiles={5}
          multiple
          showPreview
          value={imageFiles}
          onChange={setImageFiles}
          fullWidth
        />
      </section>

      {/* PDF Only */}
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
          PDF Only (Single File)
        </h2>
        <FileUpload
          label="Facture"
          description="Format PDF uniquement, max 2MB"
          accept=".pdf"
          maxSize={2 * 1024 * 1024}
          multiple={false}
          value={pdfFiles}
          onChange={setPdfFiles}
        />
      </section>

      {/* Strict Validation */}
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
          Strict Validation
        </h2>
        <div style={{ display: 'grid', gap: '24px' }}>
          <FileUpload
            label="Small files only"
            description="Max 100KB per file"
            accept="image/*,.pdf"
            maxSize={100 * 1024}
            multiple
            helperText="Try uploading a large file to see the error"
          />

          <FileUpload
            label="Max 2 files"
            description="Limited to 2 files total"
            maxFiles={2}
            multiple
            helperText="Try uploading more than 2 files"
          />
        </div>
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
        <div style={{ display: 'grid', gap: '24px' }}>
          <FileUpload
            label="With error"
            error="Veuillez fournir au moins un document"
            accept=".pdf"
          />

          <FileUpload
            label="Required field"
            required
            accept="image/*,.pdf"
            helperText="This field is mandatory"
          />

          <FileUpload label="Disabled" disabled description="Upload is not allowed" />
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
          Full-featured file upload with all options
        </p>
        <FileUpload
          label="Documents intervention"
          description="Photos, devis, factures..."
          accept="image/*,.pdf,.doc,.docx"
          maxSize={10 * 1024 * 1024}
          maxFiles={10}
          multiple
          showPreview
          required
          fullWidth
        />
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
          <li>Click opens file selector</li>
          <li>Drag & drop works</li>
          <li>File type validation</li>
          <li>File size validation</li>
          <li>Max files limit enforced</li>
          <li>Image preview displayed</li>
          <li>File icon for non-images</li>
          <li>Remove button works</li>
          <li>Multiple/single mode works</li>
          <li>Errors displayed clearly</li>
          <li>Disabled blocks interactions</li>
          <li>No memory leaks (URL cleanup)</li>
        </ul>
      </section>
    </div>
  )
}
