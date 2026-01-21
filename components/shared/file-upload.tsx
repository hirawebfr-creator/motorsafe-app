'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'

interface FileUploadProps {
  value?: File[]
  onChange?: (files: File[]) => void
  onError?: (error: string) => void
  uploadProgress?: Record<string, number>
  label?: string
  description?: string
  error?: string
  helperText?: string
  accept?: string
  maxSize?: number // in bytes
  maxFiles?: number
  multiple?: boolean
  disabled?: boolean
  showPreview?: boolean
  name?: string
  required?: boolean
  fullWidth?: boolean
}

export const FileUpload: React.FC<FileUploadProps> = ({
  value,
  onChange,
  onError,
  uploadProgress,
  label,
  description,
  error,
  helperText,
  accept,
  maxSize,
  maxFiles,
  multiple = false,
  disabled = false,
  showPreview = false,
  required = false,
  fullWidth = false,
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState<File[]>(value || [])
  const [errors, setErrors] = useState<string[]>([])
  const [previews, setPreviews] = useState<Map<string, string>>(new Map())

  const inputRef = useRef<HTMLInputElement>(null)
  const dropzoneRef = useRef<HTMLDivElement>(null)

  // Sync with external value prop
  useEffect(() => {
    if (value !== undefined) {
      setFiles(value)
    }
  }, [value])

  // Generate previews for image files
  useEffect(() => {
    if (!showPreview) return

    const newPreviews = new Map<string, string>()

    files.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const key = `${file.name}-${file.size}-${file.lastModified}`
        if (!previews.has(key)) {
          const url = URL.createObjectURL(file)
          newPreviews.set(key, url)
        } else {
          newPreviews.set(key, previews.get(key)!)
        }
      }
    })

    // Revoke old URLs that are no longer needed
    previews.forEach((url, key) => {
      if (!newPreviews.has(key)) {
        URL.revokeObjectURL(url)
      }
    })

    setPreviews(newPreviews)

    // Cleanup on unmount
    return () => {
      newPreviews.forEach((url) => URL.revokeObjectURL(url))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, showPreview])

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
  }

  const validateFile = useCallback(
    (file: File): string | null => {
      // Check type
      if (accept) {
        const acceptedTypes = accept.split(',').map((t) => t.trim())
        const isAccepted = acceptedTypes.some((type) => {
          if (type.startsWith('.')) {
            return file.name.toLowerCase().endsWith(type.toLowerCase())
          }
          if (type.includes('*')) {
            const regex = new RegExp(type.replace('*', '.*'))
            return regex.test(file.type)
          }
          return file.type === type
        })

        if (!isAccepted) {
          return `Format ${file.type || 'inconnu'} non accepté`
        }
      }

      // Check size
      if (maxSize && file.size > maxSize) {
        return `Fichier trop volumineux (max: ${formatBytes(maxSize)})`
      }

      return null
    },
    [accept, maxSize]
  )

  const handleFiles = useCallback(
    (newFiles: File[]) => {
      const validFiles: File[] = []
      const fileErrors: string[] = []

      // Check max files limit
      const remainingSlots = maxFiles ? maxFiles - files.length : Infinity
      const filesToProcess = newFiles.slice(0, remainingSlots)

      if (newFiles.length > remainingSlots && maxFiles) {
        fileErrors.push(`Maximum ${maxFiles} fichier(s) autorisé(s)`)
      }

      // Validate each file
      filesToProcess.forEach((file) => {
        const validationError = validateFile(file)
        if (validationError) {
          fileErrors.push(`${file.name}: ${validationError}`)
        } else {
          validFiles.push(file)
        }
      })

      setErrors(fileErrors)

      if (fileErrors.length > 0) {
        onError?.(fileErrors[0])
      }

      if (validFiles.length > 0) {
        const updatedFiles = multiple ? [...files, ...validFiles] : validFiles

        setFiles(updatedFiles)
        onChange?.(updatedFiles)
      }
    },
    [files, maxFiles, multiple, onChange, onError, validateFile]
  )

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index)
    setFiles(updatedFiles)
    onChange?.(updatedFiles)
    setErrors([])
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Only set isDragging to false if we're leaving the dropzone itself
    if (e.currentTarget === dropzoneRef.current) {
      setIsDragging(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled) return

    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFiles(droppedFiles)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    handleFiles(selectedFiles)
    e.target.value = '' // Reset to allow re-selection of same file
  }

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click()
    }
  }

  const getFilePreviewUrl = (file: File): string | null => {
    if (!showPreview || !file.type.startsWith('image/')) return null
    const key = `${file.name}-${file.size}-${file.lastModified}`
    return previews.get(key) || null
  }

  return (
    <div
      style={{
        width: fullWidth ? '100%' : 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {/* Label */}
      {label && (
        <label
          style={{
            fontSize: '14px',
            fontWeight: 500,
            color: '#111827',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {label}
          {required && <span style={{ color: '#DC2626', marginLeft: '4px' }}>*</span>}
        </label>
      )}

      {/* Dropzone */}
      <div
        ref={dropzoneRef}
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          minHeight: '200px',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          backgroundColor: isDragging ? '#F3F4F6' : '#F9FAFB',
          border: `2px dashed ${error ? '#DC2626' : isDragging ? '#0A1628' : '#E5E7EB'}`,
          borderRadius: '8px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {/* Hidden input */}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={handleInputChange}
          style={{
            display: 'none',
          }}
        />

        {/* Upload icon */}
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: isDragging ? '#0A1628' : '#6B7280' }}
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>

        {/* Text */}
        <div
          style={{
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: '#111827',
            }}
          >
            {isDragging ? 'Déposez les fichiers ici' : 'Cliquez ou glissez-déposez'}
          </div>
          <div
            style={{
              fontSize: '13px',
              color: '#6B7280',
            }}
          >
            {accept ? `Formats: ${accept}` : 'Tous formats acceptés'}
            {maxSize && ` • Max: ${formatBytes(maxSize)}`}
            {maxFiles && ` • ${maxFiles} fichier(s) max`}
          </div>
        </div>
      </div>

      {/* Helper text / Description */}
      {(description || helperText) && !error && errors.length === 0 && (
        <div
          style={{
            fontSize: '12px',
            color: '#6B7280',
          }}
        >
          {description || helperText}
        </div>
      )}

      {/* Errors list */}
      {(errors.length > 0 || error) && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                color: '#DC2626',
              }}
            >
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
              {error}
            </div>
          )}
          {errors.map((err, idx) => (
            <div
              key={idx}
              style={{
                fontSize: '12px',
                color: '#DC2626',
                paddingLeft: '18px',
              }}
            >
              • {err}
            </div>
          ))}
        </div>
      )}

      {/* Files list */}
      {files.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginTop: '8px',
          }}
        >
          {files.map((file, index) => {
            const preview = getFilePreviewUrl(file)
            const progress = uploadProgress?.[file.name]

            return (
              <div
                key={`${file.name}-${file.size}-${index}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                }}
              >
                {/* Preview or icon */}
                {preview ? (
                  <img
                    src={preview}
                    alt={file.name}
                    style={{
                      width: '48px',
                      height: '48px',
                      objectFit: 'cover',
                      borderRadius: '6px',
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#F9FAFB',
                      borderRadius: '6px',
                      flexShrink: 0,
                      color: '#6B7280',
                    }}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                      <polyline points="13 2 13 9 20 9" />
                    </svg>
                  </div>
                )}

                {/* File info */}
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#111827',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {file.name}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#6B7280',
                    }}
                  >
                    {formatBytes(file.size)}
                  </div>
                  
                  {/* Progress bar */}
                  {progress !== undefined && progress < 100 && (
                    <div
                      style={{
                        marginTop: '6px',
                        height: '4px',
                        backgroundColor: '#E5E7EB',
                        borderRadius: '2px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${progress}%`,
                          backgroundColor: '#0A1628',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Remove button */}
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFile(index)
                    }}
                    style={{
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#6B7280',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#FEF2F2'
                      e.currentTarget.style.color = '#DC2626'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.color = '#6B7280'
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
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

FileUpload.displayName = 'FileUpload'
