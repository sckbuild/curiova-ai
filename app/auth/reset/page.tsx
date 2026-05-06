"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ResetPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?type=recovery`,
      }
    );

    setLoading(false);

    if (resetError) {
      setError("Something went wrong. Please try again.");
      return;
    }

    setSent(true);
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] }}
        className="w-full max-w-[440px] bg-white rounded-2xl shadow-xl p-8"
      >
        {/* Wordmark */}
        <Link
          href="/"
          className="font-display font-bold text-xl text-ink flex items-baseline mb-8"
        >
          curio<span className="text-coral">·</span>va
          <span className="text-xs text-muted font-body ml-0.5">.ai</span>
        </Link>

        {sent ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center py-4"
          >
            <div className="w-16 h-16 rounded-full bg-mint/15 flex items-center justify-center mx-auto mb-5">
              <span className="text-3xl">📬</span>
            </div>
            <h2 className="font-display font-bold text-2xl text-ink mb-2">
              Check your inbox
            </h2>
            <p className="font-body text-muted text-sm leading-relaxed mb-6">
              We&apos;ve sent a reset link to{" "}
              <span className="text-ink font-medium">{email}</span>. It expires
              in 1 hour.
            </p>
            <Link
              href="/auth/login"
              className="font-body text-sm text-coral hover:underline"
            >
              ← Back to sign in
            </Link>
          </motion.div>
        ) : (
          <>
            <h2 className="font-display font-bold text-2xl text-ink mb-1">
              Reset your password
            </h2>
            <p className="font-body text-muted text-sm mb-6">
              Enter your email and we&apos;ll send you a link to reset your
              password.
            </p>

            {error && (
              <div className="mb-4 px-4 py-3 bg-rose/8 border border-rose/20 rounded-lg">
                <p className="font-body text-rose text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label="Email"
                type="email"
                placeholder="priya@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full mt-2"
              >
                Send reset link →
              </Button>
            </form>

            <p className="font-body text-sm text-muted text-center mt-6">
              Remember your password?{" "}
              <Link
                href="/auth/login"
                className="text-coral hover:underline font-medium"
              >
                Sign in
              </Link>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
