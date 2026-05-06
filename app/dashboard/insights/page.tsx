import Link from "next/link";

export default function InsightsPage() {
  return (
    <div className="p-6">
      <h1 className="font-display font-extrabold text-cream text-3xl mb-2">Weekly Wins 💡</h1>
      <p className="font-body text-white/50 text-sm mb-6">
        AI-powered insights about your child&apos;s learning journey.
      </p>
      <Link
        href="/dashboard"
        className="font-body text-sm text-coral hover:underline"
      >
        ← Back to dashboard
      </Link>
    </div>
  );
}
