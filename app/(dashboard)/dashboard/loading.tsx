/**
 * Skeleton Loading - Dashboard
 */
export default function DashboardLoading() {
  return (
    <div style={{
      padding: '24px',
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
      {/* Header skeleton */}
      <div style={{
        height: '40px',
        backgroundColor: '#F3F4F6',
        borderRadius: '8px',
        marginBottom: '24px',
        width: '250px',
        animation: 'pulse 2s infinite'
      }} />
      
      {/* KPI Cards skeleton */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            style={{
              height: '120px',
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
              padding: '20px'
            }}
          >
            <div style={{
              height: '16px',
              backgroundColor: '#F3F4F6',
              borderRadius: '4px',
              width: '60%',
              marginBottom: '12px'
            }} />
            <div style={{
              height: '32px',
              backgroundColor: '#F3F4F6',
              borderRadius: '4px',
              width: '40%'
            }} />
          </div>
        ))}
      </div>
      
      {/* Chart skeleton */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E5E7EB',
        padding: '24px',
        height: '300px'
      }}>
        <div style={{
          height: '20px',
          backgroundColor: '#F3F4F6',
          borderRadius: '4px',
          width: '150px',
          marginBottom: '24px'
        }} />
        <div style={{
          height: '200px',
          backgroundColor: '#F9FAFB',
          borderRadius: '8px'
        }} />
      </div>
      
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
