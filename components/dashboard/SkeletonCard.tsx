export function SkeletonCard() {
  return (
    <div
      className="bg-[#1C1917] rounded-lg p-5 flex flex-col gap-3 animate-pulse"
      style={{ border: "1px solid rgba(255,255,255,.07)" }}
    >
      <div className="flex items-start justify-between">
        <div className="w-8 h-8 rounded-md bg-white/[.06]" />
        <div className="w-16 h-5 rounded-full bg-white/[.06]" />
      </div>
      <div className="space-y-2">
        <div className="w-24 h-2.5 rounded bg-white/[.06]" />
        <div className="w-14 h-8 rounded bg-white/[.06]" />
        <div className="w-32 h-2 rounded bg-white/[.06]" />
      </div>
    </div>
  );
}
