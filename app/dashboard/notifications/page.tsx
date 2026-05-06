import Link from "next/link";

export default function NotificationsPage() {
  return (
    <div className="p-6">
      <h1 className="font-display font-extrabold text-cream text-3xl mb-2">Notifications 🔔</h1>
      <p className="font-body text-white/50 text-sm mb-6">
        Manage when and how you receive updates about your child&apos;s progress.
      </p>
      <Link href="/dashboard/settings" className="font-body text-sm text-coral hover:underline">
        Configure in Settings →
      </Link>
    </div>
  );
}
