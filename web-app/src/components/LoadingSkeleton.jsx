export function PostSkeleton() {
  return (
    <div className="skeleton-post">
      <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
        <div className="skeleton skeleton-circle" style={{ width: 42, height: 42, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton skeleton-line" style={{ width: '40%' }} />
          <div className="skeleton skeleton-line" style={{ width: '25%', marginTop: 6 }} />
        </div>
      </div>
      <div className="skeleton skeleton-line" style={{ width: '100%' }} />
      <div className="skeleton skeleton-line" style={{ width: '85%' }} />
      <div className="skeleton skeleton-line" style={{ width: '70%' }} />
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <div className="skeleton" style={{ width: 60, height: 28, borderRadius: 8 }} />
        <div className="skeleton" style={{ width: 60, height: 28, borderRadius: 8 }} />
        <div className="skeleton" style={{ width: 60, height: 28, borderRadius: 8 }} />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="skeleton" style={{ height: 140 }} />
      <div style={{ padding: '0 24px 24px' }}>
        <div style={{ transform: 'translateY(-40px)', marginBottom: -28 }}>
          <div className="skeleton skeleton-circle" style={{ width: 80, height: 80 }} />
        </div>
        <div className="skeleton skeleton-line" style={{ width: '50%', marginTop: 12 }} />
        <div className="skeleton skeleton-line" style={{ width: '35%' }} />
        <div className="skeleton skeleton-line" style={{ width: '80%', marginTop: 16 }} />
        <div className="skeleton skeleton-line" style={{ width: '65%' }} />
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 4 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, padding: '14px 16px', borderRadius: 14, background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}>
          <div className="skeleton skeleton-circle" style={{ width: 42, height: 42, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton skeleton-line" style={{ width: '55%' }} />
            <div className="skeleton skeleton-line" style={{ width: '75%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card">
          <div className="skeleton skeleton-circle" style={{ width: 48, height: 48, marginBottom: 16 }} />
          <div className="skeleton skeleton-line" style={{ width: '40%', height: 32 }} />
          <div className="skeleton skeleton-line" style={{ width: '60%', marginTop: 8 }} />
        </div>
      ))}
    </div>
  );
}
