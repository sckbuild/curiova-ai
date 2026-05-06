export default function GrowthLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="h-8 w-40 bg-ink-light rounded-full animate-pulse" />
      <div className="bg-ink-light rounded-2xl h-72 animate-pulse" />
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-ink-light rounded-2xl h-24 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
