function Pulse({ className }) {
  return <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />;
}

export function SkeletonKpiCards() {
  return (
    <div className="grid grid-cols-2 gap-3 mb-5">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
          <Pulse className="h-3 w-16 mb-2" />
          <Pulse className="h-7 w-20" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ rows = 4 }) {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i < rows - 1 ? "border-b border-gray-50" : ""}`}>
          <Pulse className="w-9 h-9 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Pulse className="h-3 w-32" />
            <Pulse className="h-2.5 w-20" />
          </div>
          <Pulse className="h-3 w-12 flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonRideList({ rows = 5 }) {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className={`flex items-start gap-3 px-4 py-3 ${i < rows - 1 ? "border-b border-gray-50" : ""}`}>
          <Pulse className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5" />
          <div className="flex-1 space-y-1.5">
            <div className="flex justify-between">
              <Pulse className="h-3 w-28" />
              <Pulse className="h-3 w-10 flex-shrink-0" />
            </div>
            <Pulse className="h-2.5 w-36" />
            <Pulse className="h-2.5 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
      <Pulse className="h-3 w-20 mb-3" />
      <div className="space-y-2.5">
        {[...Array(3)].map((_, i) => (
          <div key={i}>
            <div className="flex justify-between mb-1">
              <Pulse className="h-2.5 w-16" />
              <Pulse className="h-2.5 w-12" />
            </div>
            <Pulse className="h-2 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonCard({ className = "h-24" }) {
  return <Pulse className={`w-full rounded-xl ${className}`} />;
}
