export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-row">
        <div className="skeleton-avatar" />
        <div className="skeleton-lines">
          <div className="skeleton-line w-30" />
          <div className="skeleton-line w-20 small" />
        </div>
      </div>
      <div className="skeleton-line w-80" style={{ marginTop: 16 }} />
      <div className="skeleton-line w-90" />
      <div className="skeleton-line w-60" />
      <div className="skeleton-image" />
      <div className="skeleton-row" style={{ marginTop: 16 }}>
        <div className="skeleton-line w-15" />
        <div className="skeleton-line w-15" />
      </div>
    </div>
  );
}

export function SkeletonFeed({ count = 3 }) {
  return (
    <div className="feed-list">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
