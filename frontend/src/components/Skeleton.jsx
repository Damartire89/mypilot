function Pulse({ style = {}, className = "" }) {
  return (
    <div
      className={`animate-pulse ${className}`}
      style={{
        background: "linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.4s ease-in-out infinite, pulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
        borderRadius: "6px",
        ...style,
      }}
    />
  );
}

export function SkeletonKpiCards() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
      {[...Array(4)].map((_, i) => (
        <div key={i} style={{
          background: "var(--surface)",
          borderRadius: "12px",
          border: "1px solid var(--border)",
          padding: "16px",
        }}>
          <Pulse style={{ height: 11, width: 80, marginBottom: 10 }} />
          <Pulse style={{ height: 28, width: 70 }} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ rows = 4 }) {
  return (
    <div style={{ background: "var(--surface)", borderRadius: "12px", border: "1px solid var(--border)", overflow: "hidden" }}>
      {[...Array(rows)].map((_, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: 12, padding: "13px 16px",
          borderBottom: i < rows - 1 ? "1px solid var(--border)" : "none",
        }}>
          <Pulse style={{ width: 36, height: 36, borderRadius: "9px", flexShrink: 0 }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <Pulse style={{ height: 12, width: 120 }} />
            <Pulse style={{ height: 10, width: 80 }} />
          </div>
          <Pulse style={{ height: 10, width: 40, flexShrink: 0 }} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonRideList({ rows = 5 }) {
  return (
    <div style={{ background: "var(--surface)", borderRadius: "12px", border: "1px solid var(--border)", overflow: "hidden" }}>
      {[...Array(rows)].map((_, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "flex-start", gap: 12, padding: "13px 16px",
          borderBottom: i < rows - 1 ? "1px solid var(--border)" : "none",
        }}>
          <Pulse style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, marginTop: 6 }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Pulse style={{ height: 12, width: 110 }} />
              <Pulse style={{ height: 12, width: 40, flexShrink: 0 }} />
            </div>
            <Pulse style={{ height: 10, width: 140 }} />
            <Pulse style={{ height: 10, width: 60 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div style={{ background: "var(--surface)", borderRadius: "12px", border: "1px solid var(--border)", padding: "16px", marginBottom: "12px" }}>
      <Pulse style={{ height: 11, width: 90, marginBottom: 14 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[...Array(3)].map((_, i) => (
          <div key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <Pulse style={{ height: 10, width: 70 }} />
              <Pulse style={{ height: 10, width: 40 }} />
            </div>
            <Pulse style={{ height: 6, width: "100%", borderRadius: "99px" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonCard({ className = "", style = {} }) {
  return <Pulse style={{ width: "100%", height: 80, borderRadius: "12px", ...style }} className={className} />;
}
