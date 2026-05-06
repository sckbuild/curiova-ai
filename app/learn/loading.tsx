export default function LearnLoading() {
  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-6">
        <div className="h-3 bg-cream/10 rounded-full animate-pulse" />
        <div className="bg-ink-light rounded-3xl p-8 space-y-4 animate-pulse">
          <div className="h-6 w-3/4 bg-cream/10 rounded-full" />
          <div className="h-4 w-1/2 bg-cream/10 rounded-full" />
          <div className="space-y-3 pt-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-14 bg-cream/5 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
