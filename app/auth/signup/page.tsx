"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Role = "parent" | "child";

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  general?: string;
}

function parseSupabaseError(message: string): FormErrors {
  if (message.includes("already registered") || message.includes("already exists")) {
    return { email: "An account with this email already exists. Try signing in." };
  }
  if (message.includes("password") && message.includes("characters")) {
    return { password: "Password must be at least 6 characters." };
  }
  if (message.includes("valid email")) {
    return { email: "Please enter a valid email address." };
  }
  return { general: "Something went wrong. Please try again." };
}

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("parent");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const newErrors: FormErrors = {};
    if (!name.trim()) newErrors.name = "Please enter your full name.";
    if (!email.trim()) newErrors.email = "Please enter your email.";
    if (password.length < 6)
      newErrors.password = "Password must be at least 6 characters.";
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, role },
      },
    });

    setLoading(false);

    if (error) {
      setErrors(parseSupabaseError(error.message));
      return;
    }

    router.push(role === "parent" ? "/onboarding" : "/learn");
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
          Create your account
        </h2>
        <p className="font-body text-muted text-sm mb-6">
          Get started in under 3 minutes.
        </p>

        {/* Role selector */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {(["parent", "child"] as Role[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all duration-150 ${
                role === r
                  ? "border-coral bg-coral/6"
                  : "border-ink/10 hover:border-ink/25"
              }`}
            >
              <span className="text-2xl">{r === "parent" ? "👪" : "👦"}</span>
              <span
                className={`font-body font-medium text-sm ${
                  role === r ? "text-coral" : "text-ink/70"
                }`}
              >
                {r === "parent" ? "I'm a Parent" : "I'm a Child"}
              </span>
            </button>
          ))}
        </div>

        {errors.general && (
          <div className="mb-4 px-4 py-3 bg-rose/8 border border-rose/20 rounded-lg">
            <p className="font-body text-rose text-sm">{errors.general}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Full name"
            type="text"
            placeholder="Priya Sharma"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            autoComplete="name"
          />
          <Input
            label="Email"
            type="email"
            placeholder="priya@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            autoComplete="new-password"
            hint="Minimum 6 characters"
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="w-full mt-2"
          >
            Create account →
          </Button>
        </form>

        <p className="font-body text-sm text-muted text-center mt-6">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="text-coral hover:underline font-medium"
          >
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
