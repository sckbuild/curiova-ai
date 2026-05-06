"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="text-center space-y-4 max-w-md">
        <p className="text-5xl">📊</p>
        <h2 className="font-display text-2xl text-cream">Dashboard unavailable</h2>
        <p className="text-cream/60 text-sm">
          We couldn&apos;t load your dashboard data. Please try again or go home.
        </p>
        <div className="flex gap-3 justify-center mt-4">
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-coral text-white rounded-2xl font-semibold hover:bg-coral/90 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="px-5 py-2.5 border border-cream/20 text-cream rounded-2xl font-semibold hover:bg-cream/5 transition-colors"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
