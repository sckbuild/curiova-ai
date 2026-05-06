export default function Loading() {
  return (
    <div className="min-h-screen bg-ink flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-coral/20 animate-pulse" />
        <div className="w-32 h-3 rounded-full bg-cream/10 animate-pulse" />
      </div>
    </div>
  );
}
