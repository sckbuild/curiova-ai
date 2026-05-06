export default function MasteryLoading() {
  return (
    <div className="p-6 space-y-4">
      <div className="h-8 w-48 bg-ink-light rounded-full animate-pulse" />
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-ink-light rounded-2xl p-5 space-y-3 animate-pulse">
          <div className="h-5 w-32 bg-cream/10 rounded-full" />
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, j) => (
              <div key={j} className="h-16 bg-cream/5 rounded-xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
