/**
 * Skeleton Loading - Liste Véhicules
 */
export default function VehiculesLoading() {
  return (
    <div style={{
      padding: '24px',
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
      {/* Header skeleton */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div style={{
          height: '36px',
          backgroundColor: '#F3F4F6',
          borderRadius: '8px',
          width: '180px'
        }} />
        <div style={{
          display: 'flex',
          gap: '12px'
        }}>
          <div style={{
            height: '40px',
            backgroundColor: '#F3F4F6',
            borderRadius: '8px',
            width: '140px'
          }} />
          <div style={{
            height: '40px',
            backgroundColor: '#F3F4F6',
            borderRadius: '8px',
            width: '140px'
          }} />
        </div>
      </div>
      
      {/* Filters skeleton */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <div style={{
          height: '44px',
          backgroundColor: '#F3F4F6',
          borderRadius: '8px',
          width: '250px'
        }} />
        <div style={{
          height: '44px',
          backgroundColor: '#F3F4F6',
          borderRadius: '8px',
          width: '150px'
        }} />
        <div style={{
          height: '44px',
          backgroundColor: '#F3F4F6',
          borderRadius: '8px',
          width: '150px'
        }} />
      </div>
      
      {/* Table skeleton */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E5E7EB',
        overflow: 'hidden'
      }}>
        {/* Table header */}
        <div style={{
          height: '48px',
          backgroundColor: '#F9FAFB',
          borderBottom: '1px solid #E5E7EB'
        }} />
        
        {/* Table rows */}
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <div
            key={i}
            style={{
              height: '72px',
              borderBottom: '1px solid #F3F4F6',
              display: 'flex',
              alignItems: 'center',
              padding: '0 16px',
              gap: '16px'
            }}
          >
            {/* Vehicle image placeholder */}
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: '#F3F4F6',
              borderRadius: '8px',
              flexShrink: 0
            }} />
            {/* Content placeholders */}
            {[1, 2, 3, 4].map(j => (
              <div
                key={j}
                style={{
                  height: '16px',
                  backgroundColor: '#F3F4F6',
                  borderRadius: '4px',
                  flex: 1
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
