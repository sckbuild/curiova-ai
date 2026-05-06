"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

function parseLoginError(message: string): FormErrors {
  if (
    message.includes("Invalid login credentials") ||
    message.includes("invalid credentials")
  ) {
    return { general: "Incorrect email or password. Please try again." };
  }
  if (
    message.includes("Email not confirmed") ||
    message.includes("not confirmed")
  ) {
    return {
      general:
        "Please check your inbox and confirm your email before signing in.",
    };
  }
  return { general: "Something went wrong. Please try again." };
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const newErrors: FormErrors = {};
    if (!email.trim()) newErrors.email = "Please enter your email.";
    if (!password) newErrors.password = "Please enter your password.";
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setErrors(parseLoginError(error.message));
      return;
    }

    const role = data.user?.user_metadata?.role ?? "parent";
    router.push(role === "child" ? "/learn" : "/dashboard");
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

        <h2 className="font-display font-bold text-2xl text-ink mb-1">
          Welcome back
        </h2>
        <p className="font-body text-muted text-sm mb-6">
          Sign in to continue your journey.
        </p>

        {errors.general && (
          <div className="mb-4 px-4 py-3 bg-rose/8 border border-rose/20 rounded-lg">
            <p className="font-body text-rose text-sm">{errors.general}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            placeholder="priya@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            autoComplete="email"
          />

          <div className="flex flex-col gap-1.5">
            <Input
              label="Password"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              autoComplete="current-password"
            />
            <Link
              href="/auth/reset"
              className="text-[13px] text-muted hover:text-coral font-body transition-colors self-end"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="w-full mt-2"
          >
            Sign in →
          </Button>
        </form>

        <p className="font-body text-sm text-muted text-center mt-6">
          New to Curiova?{" "}
          <Link
            href="/auth/signup"
            className="text-coral hover:underline font-medium"
          >
            Create account
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
