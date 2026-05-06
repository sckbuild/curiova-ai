import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-6">
      <div className="text-center space-y-4 max-w-md">
        <p className="font-display text-[120px] leading-none text-coral font-bold">404</p>
        <h2 className="font-display text-2xl text-cream">Page not found</h2>
        <p className="text-cream/60">
          This page doesn&apos;t exist — but your learning journey does.
        </p>
        <Link
          href="/dashboard"
          className="inline-block mt-4 px-6 py-3 bg-coral text-white rounded-2xl font-semibold hover:bg-coral/90 transition-colors"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
