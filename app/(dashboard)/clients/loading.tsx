/**
 * Skeleton Loading - Liste Clients
 */
export default function ClientsLoading() {
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
          width: '150px'
        }} />
        <div style={{
          height: '40px',
          backgroundColor: '#F3F4F6',
          borderRadius: '8px',
          width: '140px'
        }} />
      </div>
      
      {/* Search bar skeleton */}
      <div style={{
        height: '44px',
        backgroundColor: '#F3F4F6',
        borderRadius: '8px',
        marginBottom: '24px',
        width: '300px'
      }} />
      
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
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: '16px'
        }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              style={{
                height: '14px',
                backgroundColor: '#E5E7EB',
                borderRadius: '4px',
                flex: 1
              }}
            />
          ))}
        </div>
        
        {/* Table rows */}
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <div
            key={i}
            style={{
              height: '64px',
              borderBottom: '1px solid #F3F4F6',
              display: 'flex',
              alignItems: 'center',
              padding: '0 16px',
              gap: '16px'
            }}
          >
            {[1, 2, 3, 4, 5].map(j => (
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
