"use client";

import { useEffect } from "react";

export default function GlobalError({
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
    <div className="min-h-screen bg-ink flex items-center justify-center p-6">
      <div className="text-center space-y-4 max-w-md">
        <p className="text-5xl">⚡</p>
        <h2 className="font-display text-2xl text-cream">Something went wrong</h2>
        <p className="text-cream/60 text-sm">
          An unexpected error occurred. Don&apos;t worry — your progress is saved.
        </p>
        <button
          onClick={reset}
          className="mt-4 px-6 py-3 bg-coral text-white rounded-2xl font-semibold hover:bg-coral/90 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
