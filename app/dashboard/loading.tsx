export default function DashboardLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-ink-light rounded-2xl p-5 h-28 animate-pulse" />
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-ink-light rounded-2xl h-56 animate-pulse" />
        <div className="bg-ink-light rounded-2xl h-56 animate-pulse" />
      </div>
      <div className="bg-ink-light rounded-2xl h-40 animate-pulse" />
    </div>
  );
}
