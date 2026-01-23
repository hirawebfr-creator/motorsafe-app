/**
 * Skeleton Loading - Paramètres
 */
export default function ParametresLoading() {
  return (
    <div style={{
      padding: '24px',
      maxWidth: '1000px',
      margin: '0 auto'
    }}>
      {/* Header skeleton */}
      <div style={{
        height: '36px',
        backgroundColor: '#F3F4F6',
        borderRadius: '8px',
        marginBottom: '32px',
        width: '180px'
      }} />
      
      {/* Tabs skeleton */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: '1px solid #E5E7EB',
        paddingBottom: '12px'
      }}>
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            style={{
              height: '36px',
              backgroundColor: '#F3F4F6',
              borderRadius: '8px',
              width: '100px'
            }}
          />
        ))}
      </div>
      
      {/* Form sections skeleton */}
      {[1, 2, 3].map(section => (
        <div
          key={section}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E5E7EB',
            padding: '24px',
            marginBottom: '24px'
          }}
        >
          {/* Section title */}
          <div style={{
            height: '20px',
            backgroundColor: '#F3F4F6',
            borderRadius: '4px',
            width: '150px',
            marginBottom: '20px'
          }} />
          
          {/* Form fields */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px'
          }}>
            {[1, 2, 3, 4].map(field => (
              <div key={field}>
                <div style={{
                  height: '14px',
                  backgroundColor: '#F3F4F6',
                  borderRadius: '4px',
                  width: '80px',
                  marginBottom: '8px'
                }} />
                <div style={{
                  height: '44px',
                  backgroundColor: '#F9FAFB',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB'
                }} />
              </div>
            ))}
          </div>
        </div>
      ))}
      
      {/* Save button skeleton */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end'
      }}>
        <div style={{
          height: '44px',
          backgroundColor: '#F3F4F6',
          borderRadius: '8px',
          width: '160px'
        }} />
      </div>
    </div>
  )
}
