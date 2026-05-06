"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// ─── Confetti ─────────────────────────────────────────────────────────────────

function ConfettiBurst() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const COLORS = ["#FF4D2E", "#FFBE00", "#00BF80", "#2B7FFF", "#7C3AED", "#F0134D"];
    const PIECES = 120;

    type Particle = {
      x: number; y: number;
      vx: number; vy: number;
      color: string;
      size: number;
      rotation: number;
      rotationV: number;
      gravity: number;
    };

    const particles: Particle[] = Array.from({ length: PIECES }, () => ({
      x: canvas.width / 2,
      y: canvas.height * 0.4,
      vx: (Math.random() - 0.5) * 18,
      vy: Math.random() * -14 - 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: Math.random() * 8 + 4,
      rotation: Math.random() * 360,
      rotationV: (Math.random() - 0.5) * 8,
      gravity: 0.35,
    }));

    let frame: number;
    let tick = 0;

    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.99;
        p.rotation += p.rotationV;

        ctx!.save();
        ctx!.translate(p.x, p.y);
        ctx!.rotate((p.rotation * Math.PI) / 180);
        ctx!.fillStyle = p.color;
        ctx!.globalAlpha = Math.max(0, 1 - tick / 120);
        ctx!.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.5);
        ctx!.restore();
      });

      tick++;
      if (tick < 140) {
        frame = requestAnimationFrame(draw);
      }
    }

    draw();
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ width: "100%", height: "100%" }}
    />
  );
}

// ─── XP bar ───────────────────────────────────────────────────────────────────

function XpBar({ xp }: { xp: number }) {
  const MAX_XP = 1000;
  const pct = Math.min((xp / MAX_XP) * 100, 100);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1.5">
        <span className="font-body text-xs text-muted">XP to next level</span>
        <span className="font-body text-xs font-semibold text-ink">{xp} / {MAX_XP}</span>
      </div>
      <div className="h-3 bg-ink/8 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, #FF4D2E, #FFBE00)" }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: EASE, delay: 0.8 }}
        />
      </div>
    </div>
  );
}

// ─── Stat box ─────────────────────────────────────────────────────────────────

function StatBox({
  label, value, sub, color, delay,
}: {
  label: string;
  value: string;
  sub?: string;
  color: "mint" | "coral" | "sky";
  delay: number;
}) {
  const colorMap = {
    mint:  { bg: "bg-mint/10",  text: "text-mint",  border: "border-mint/25" },
    coral: { bg: "bg-coral/10", text: "text-coral",  border: "border-coral/25" },
    sky:   { bg: "bg-sky/10",   text: "text-sky",    border: "border-sky/25" },
  };
  const cls = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE, delay }}
      className={`rounded-xl p-4 border-2 text-center ${cls.bg} ${cls.border}`}
    >
      <p className="font-body text-xs text-muted mb-1">{label}</p>
      <p className={`font-display font-bold text-2xl ${cls.text}`}>{value}</p>
      {sub && <p className="font-body text-[11px] text-muted mt-0.5">{sub}</p>}
    </motion.div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────

function Badge({ emoji, label, earned }: { emoji: string; label: string; earned: boolean }) {
  return (
    <div
      className={`flex flex-col items-center gap-1 transition-all ${
        earned ? "opacity-100" : "opacity-30 grayscale"
      }`}
    >
      <div className="w-14 h-14 rounded-full bg-white border-2 border-ink/8 shadow-sm flex items-center justify-center text-2xl">
        {emoji}
      </div>
      <p className="font-body text-[10px] text-muted text-center leading-tight max-w-[60px]">{label}</p>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface SessionData {
  childName: string;
  correctAnswers: number;
  totalQuestions: number;
  xpEarned: number;
  screenMinutes: number;
  startedAt: string;
  completedAt: string | null;
  currentStreak: number;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SessionCompletePage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadSession() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth/login"); return; }

    // Fetch child
    const { data: childRow } = await supabase
      .from("children")
      .select("id, full_name")
      .or(`id.eq.${user.id},parent_id.eq.${user.id}`)
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    // Fetch session
    const { data: sess } = await supabase
      .from("study_sessions")
      .select("correct_answers, total_questions, xp_earned, screen_minutes_earned, started_at, completed_at")
      .eq("id", sessionId)
      .single();

    // Fetch streak
    const { data: streakRow } = await supabase
      .from("streaks")
      .select("current_streak")
      .eq("child_id", (childRow as { id?: string; full_name?: string } | null)?.id ?? user.id)
      .single();

    setSession({
      childName: (childRow as { full_name?: string } | null)?.full_name ?? "Explorer",
      correctAnswers: (sess as { correct_answers?: number } | null)?.correct_answers ?? 0,
      totalQuestions: (sess as { total_questions?: number } | null)?.total_questions ?? 10,
      xpEarned: (sess as { xp_earned?: number } | null)?.xp_earned ?? 0,
      screenMinutes: (sess as { screen_minutes_earned?: number } | null)?.screen_minutes_earned ?? 0,
      startedAt: (sess as { started_at?: string } | null)?.started_at ?? new Date().toISOString(),
      completedAt: (sess as { completed_at?: string | null } | null)?.completed_at ?? null,
      currentStreak: (streakRow as { current_streak?: number } | null)?.current_streak ?? 0,
    });
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-coral border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <p className="font-body text-muted mb-4">Session not found.</p>
          <Link href="/learn" className="font-body text-sm text-coral hover:underline">
            ← Back to quests
          </Link>
        </div>
      </div>
    );
  }

  const { childName, correctAnswers, totalQuestions, xpEarned, screenMinutes, startedAt, completedAt, currentStreak } = session;

  // Time taken
  const startMs  = new Date(startedAt).getTime();
  const endMs    = completedAt ? new Date(completedAt).getTime() : Date.now();
  const durationS = Math.round((endMs - startMs) / 1000);
  const mins = Math.floor(durationS / 60);
  const secs = durationS % 60;
  const timeStr = `${mins}m ${secs}s`;

  const accuracy = Math.round((correctAnswers / totalQuestions) * 100);

  // Badges
  const isSpeedSolver = durationS < totalQuestions * 20; // avg < 20s/q
  const isPerfect = accuracy === 100;
  const isStreaking = currentStreak >= 3;
  const isHighAccuracy = accuracy >= 80;

  return (
    <>
      <ConfettiBurst />

      <div className="min-h-screen bg-cream pb-16 flex flex-col items-center">
        <div className="w-full max-w-[500px] px-5 pt-12">
          {/* Trophy */}
          <div className="flex justify-center mb-4">
            <motion.div
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 18, delay: 0.1 }}
              className="text-7xl"
            >
              🏆
            </motion.div>
          </div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EASE, delay: 0.3 }}
            className="font-display font-bold text-ink text-2xl text-center leading-tight mb-1"
          >
            You absolutely SMASHED it, {childName}! 🔥
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: EASE, delay: 0.45 }}
            className="font-body text-muted text-sm text-center mb-8"
          >
            {accuracy >= 80
              ? "Incredible accuracy — you're on fire!"
              : accuracy >= 60
              ? "Great effort — keep pushing for mastery!"
              : "Every attempt makes you stronger — keep going!"}
          </motion.p>

          {/* Stat boxes */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <StatBox
              label="Correct"
              value={`${correctAnswers}/${totalQuestions}`}
              sub={`${accuracy}%`}
              color="mint"
              delay={0.5}
            />
            <StatBox
              label="XP Earned"
              value={`+${xpEarned}`}
              sub="experience"
              color="coral"
              delay={0.6}
            />
            <StatBox
              label="Time"
              value={timeStr}
              color="sky"
              delay={0.7}
            />
          </div>

          {/* XP bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.75 }}
            className="bg-white rounded-xl p-4 border-2 border-ink/8 mb-6"
          >
            <XpBar xp={xpEarned} />
          </motion.div>

          {/* Badges */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE, delay: 0.85 }}
            className="bg-white rounded-xl p-4 border-2 border-ink/8 mb-6"
          >
            <p className="font-body text-xs text-muted text-center mb-3 uppercase tracking-widest">Badges</p>
            <div className="flex justify-around">
              <Badge emoji="🏅" label="High Accuracy" earned={isHighAccuracy} />
              <Badge emoji="⚡" label="Speed Solver"  earned={isSpeedSolver} />
              <Badge emoji="💯" label="Perfect Score" earned={isPerfect} />
              <Badge emoji="🔥" label={`${currentStreak}-Day Streak`} earned={isStreaking} />
            </div>
          </motion.div>

          {/* Screen time card */}
          {screenMinutes > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE, delay: 0.95 }}
              className="rounded-xl p-5 mb-6 text-center"
              style={{ background: "linear-gradient(135deg, #2B7FFF 0%, #00BF80 100%)" }}
            >
              <div className="text-3xl mb-2">🎮</div>
              <p className="font-display font-bold text-white text-xl mb-0.5">
                You just unlocked {screenMinutes} bonus minutes!
              </p>
              <p className="font-body text-white/75 text-sm">
                Screen time earned from today&apos;s quests
              </p>
            </motion.div>
          )}

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE, delay: 1.05 }}
          >
            <Link
              href="/learn"
              className="block w-full py-4 rounded-xl font-child font-bold text-xl text-white text-center transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98]"
              style={{ background: "linear-gradient(90deg, #FF4D2E, #FFBE00)" }}
            >
              🚀 Back to my quests
            </Link>
          </motion.div>
        </div>
      </div>
    </>
  );
}
