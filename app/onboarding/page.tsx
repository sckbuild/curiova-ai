"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  childName: string;
  age: number;
  grade: number;
  country: "IN" | "US";
  curriculum: string;
  language: string;
  sessionsPerDay: number;
  screenTimeRatio: number;
  consent1: boolean;
  consent2: boolean;
  consent3: boolean;
}

const INIT: FormData = {
  childName: "", age: 10, grade: 5, country: "IN",
  curriculum: "CBSE", language: "English",
  sessionsPerDay: 2, screenTimeRatio: 2,
  consent1: false, consent2: false, consent3: false,
};

const STEPS = [
  { label: "Welcome", desc: "Role confirmation" },
  { label: "Build their world", desc: "Child profile" },
  { label: "Set the boundaries", desc: "Guardrails" },
  { label: "Your trust, protected", desc: "Privacy consent" },
];

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const CURRICULA = ["CBSE", "ICSE", "State Board", "US K–12", "IB"];
const LANGUAGES = ["English", "Hindi", "Tamil", "Telugu", "Marathi", "Bengali"];

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ current }: { current: number }) {
  return (
    <aside className="hidden md:flex flex-col w-72 shrink-0 bg-[#141210] px-8 py-10 min-h-screen">
      <div className="font-display font-bold text-xl text-cream mb-14">
        curio<span className="text-coral">·</span>va
        <span className="text-xs text-muted font-body ml-0.5">.ai</span>
      </div>

      <div className="flex flex-col gap-8 flex-1">
        {STEPS.map((step, i) => {
          const num = i + 1;
          const done = num < current;
          const active = num === current;

          return (
            <div key={i} className="flex gap-4 items-start">
              {/* Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all ${
                    done
                      ? "bg-mint text-white"
                      : active
                      ? "bg-coral text-white"
                      : "bg-white/10 text-white/30"
                  }`}
                >
                  {done ? "✓" : num}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`w-px mt-2 transition-all duration-500 ${
                      done ? "h-10 bg-mint/40" : "h-10 bg-white/10"
                    }`}
                  />
                )}
              </div>

              {/* Labels */}
              <div className="pt-1">
                <p
                  className={`font-body font-semibold text-sm ${
                    active ? "text-white" : done ? "text-white/60" : "text-white/30"
                  }`}
                >
                  {step.label}
                </p>
                <p className="font-body text-xs text-white/30 mt-0.5">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      <p className="font-body text-xs text-white/20 leading-relaxed mt-8">
        🔒 Fort Knox for family data — No ads. No data sales. Delete everything anytime.
      </p>
    </aside>
  );
}

// ─── Chip button ──────────────────────────────────────────────────────────────

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-body font-medium border transition-all duration-150 ${
        selected
          ? "bg-coral text-white border-coral"
          : "bg-cream text-muted border-cream-dark hover:border-coral"
      }`}
    >
      {label}
    </button>
  );
}

// ─── Slider with live value ───────────────────────────────────────────────────

function StepSlider({
  label, value, min, max, onChange, display, hint, leftLabel, rightLabel,
}: {
  label: string; value: number; min: number; max: number;
  onChange: (v: number) => void; display: React.ReactNode;
  hint: string; leftLabel: string; rightLabel: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="font-body font-semibold text-ink text-sm">{label}</p>
        <span className="font-display font-bold text-coral text-2xl">{display}</span>
      </div>
      <input
        type="range"
        min={min} max={max} value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full accent-coral h-2 rounded-full cursor-pointer"
      />
      <div className="flex justify-between">
        <span className="font-body text-xs text-muted">{leftLabel}</span>
        <span className="font-body text-xs text-muted">{rightLabel}</span>
      </div>
      <p className="font-body text-sm text-muted">{hint}</p>
    </div>
  );
}

// ─── Steps ────────────────────────────────────────────────────────────────────

function Step1({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display font-bold text-3xl text-ink mb-2">Let&apos;s build their world.</h2>
        <p className="font-body text-muted text-[15px] leading-relaxed">
          Two minutes here = months of perfectly personalised learning.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-2">
        <div className="flex flex-col items-center gap-2 p-5 rounded-xl border-2 border-coral bg-coral/6">
          <span className="text-3xl">👪</span>
          <span className="font-body font-semibold text-coral text-sm">Parent — that&apos;s you!</span>
          <span className="font-body text-xs text-muted text-center">Set up your child&apos;s account and monitor progress</span>
        </div>
        <div className="flex flex-col items-center gap-2 p-5 rounded-xl border-2 border-ink/10 opacity-50">
          <span className="text-3xl">👦</span>
          <span className="font-body font-semibold text-muted text-sm">Child</span>
          <span className="font-body text-xs text-muted text-center">A separate profile is created for your child</span>
        </div>
      </div>
      <Button variant="primary" size="lg" className="w-full mt-2" onClick={onNext}>
        Let&apos;s go →
      </Button>
    </div>
  );
}

function Step2({ data, setData, onNext, onBack }: {
  data: FormData; setData: (d: FormData) => void; onNext: () => void; onBack: () => void;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!data.childName.trim()) e.childName = "Please enter your child's name.";
    if (data.age < 7 || data.age > 17) e.age = "Age must be between 7 and 17.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-display font-bold text-3xl text-ink mb-2">About your child</h2>
        <p className="font-body text-muted text-sm">This personalises every question just for them.</p>
      </div>

      <Input
        label="Child's name"
        placeholder="Arjun"
        value={data.childName}
        onChange={(e) => setData({ ...data, childName: e.target.value })}
        error={errors.childName}
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink/80 font-body">Age</label>
          <select
            value={data.age}
            onChange={(e) => setData({ ...data, age: parseInt(e.target.value) })}
            className="w-full px-4 py-3 rounded-md border-[1.5px] border-ink/15 bg-white font-body text-ink text-sm focus:outline-none focus:ring-[3px] focus:ring-coral/20 focus:border-coral"
          >
            {Array.from({ length: 11 }, (_, i) => i + 7).map((a) => (
              <option key={a} value={a}>{a} years old</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink/80 font-body">Grade</label>
          <select
            value={data.grade}
            onChange={(e) => setData({ ...data, grade: parseInt(e.target.value) })}
            className="w-full px-4 py-3 rounded-md border-[1.5px] border-ink/15 bg-white font-body text-ink text-sm focus:outline-none focus:ring-[3px] focus:ring-coral/20 focus:border-coral"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
              <option key={g} value={g}>Grade {g}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Country */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-ink/80 font-body">Country</label>
        <div className="flex gap-3">
          {(["IN", "US"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setData({ ...data, country: c })}
              className={`flex-1 py-3 rounded-xl border-2 font-body font-medium text-sm transition-all ${
                data.country === c ? "border-coral bg-coral/6 text-coral" : "border-ink/10 text-muted hover:border-ink/25"
              }`}
            >
              {c === "IN" ? "🇮🇳 India" : "🇺🇸 United States"}
            </button>
          ))}
        </div>
      </div>

      {/* Curriculum */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-ink/80 font-body">Curriculum board</label>
        <div className="flex flex-wrap gap-2">
          {CURRICULA.map((c) => (
            <Chip key={c} label={c} selected={data.curriculum === c} onClick={() => setData({ ...data, curriculum: c })} />
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-ink/80 font-body">Learning language</label>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((l) => (
            <Chip key={l} label={l} selected={data.language === l} onClick={() => setData({ ...data, language: l })} />
          ))}
        </div>
      </div>

      <div className="flex gap-3 mt-2">
        <Button variant="ghost" size="lg" className="text-muted border-ink/20" onClick={onBack}>← Back</Button>
        <Button variant="primary" size="lg" className="flex-1" onClick={() => validate() && onNext()}>Continue →</Button>
      </div>
    </div>
  );
}

function Step3({ data, setData, onNext, onBack }: {
  data: FormData; setData: (d: FormData) => void; onNext: () => void; onBack: () => void;
}) {
  const ratio = data.screenTimeRatio;
  const studyW = Math.round((1 / (1 + ratio)) * 100);
  const playW = 100 - studyW;

  return (
    <div className="flex flex-col gap-7">
      <div>
        <h2 className="font-display font-bold text-3xl text-ink mb-2">Set the boundaries</h2>
        <p className="font-body text-muted text-sm">Set once and relax — Curiova handles the rest.</p>
      </div>

      <StepSlider
        label="📚 Daily quest sessions"
        value={data.sessionsPerDay} min={1} max={5}
        onChange={(v) => setData({ ...data, sessionsPerDay: v })}
        display={data.sessionsPerDay}
        hint="We recommend 2 sessions of 15–20 minutes each"
        leftLabel="1 session" rightLabel="5 sessions"
      />

      <StepSlider
        label="🎮 Play time reward ratio"
        value={ratio} min={1} max={5}
        onChange={(v) => setData({ ...data, screenTimeRatio: v })}
        display={`1:${ratio}`}
        hint={`For every 1 min of study, ${data.childName || "your child"} earns ${ratio} min of screen time`}
        leftLabel="1:1 strict" rightLabel="1:5 generous"
      />

      {/* Ratio visualiser */}
      <div className="flex rounded-lg overflow-hidden h-8">
        <div
          className="bg-coral flex items-center justify-center text-white text-xs font-body font-semibold transition-all duration-300"
          style={{ width: `${studyW}%` }}
        >
          {studyW > 15 ? "Study" : ""}
        </div>
        <div
          className="bg-sky flex items-center justify-center text-white text-xs font-body font-semibold transition-all duration-300"
          style={{ width: `${playW}%` }}
        >
          {playW > 15 ? "Play" : ""}
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="ghost" size="lg" className="text-muted border-ink/20" onClick={onBack}>← Back</Button>
        <Button variant="primary" size="lg" className="flex-1" onClick={onNext}>Continue →</Button>
      </div>
    </div>
  );
}

function Step4({ data, setData, onSubmit, onBack, loading, submitError }: {
  data: FormData; setData: (d: FormData) => void;
  onSubmit: () => void; onBack: () => void; loading: boolean; submitError: string | null;
}) {
  const allChecked = data.consent1 && data.consent2 && data.consent3;

  const CB = ({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) => (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div
        onClick={onChange}
        className={`w-5 h-5 rounded flex items-center justify-center border-2 shrink-0 mt-0.5 transition-all ${
          checked ? "border-coral bg-coral" : "border-ink/20 hover:border-coral/60"
        }`}
      >
        {checked && <span className="text-white text-xs">✓</span>}
      </div>
      <span className="font-body text-sm text-ink/80 leading-relaxed">{label}</span>
    </label>
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display font-bold text-3xl text-ink mb-2">Your trust, protected.</h2>
        <p className="font-body text-muted text-sm leading-relaxed">
          Here&apos;s exactly what we collect and why. Nothing more.
        </p>
      </div>

      <div className="flex flex-col gap-4 bg-white border border-ink/8 rounded-xl p-5">
        <CB
          checked={data.consent1}
          onChange={() => setData({ ...data, consent1: !data.consent1 })}
          label="I understand Curiova collects my child's quiz responses to personalise their learning"
        />
        <CB
          checked={data.consent2}
          onChange={() => setData({ ...data, consent2: !data.consent2 })}
          label="I agree to the Terms of Service and Privacy Policy"
        />
        <CB
          checked={data.consent3}
          onChange={() => setData({ ...data, consent3: !data.consent3 })}
          label="I confirm I am the parent or guardian of the child being registered"
        />
      </div>

      {/* Badges */}
      <div className="flex gap-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-mint/10 border border-mint/30 rounded-lg text-xs font-body text-mint font-semibold">
          🛡️ COPPA Compliant
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-sky/10 border border-sky/30 rounded-lg text-xs font-body text-sky font-semibold">
          🔒 DPDP Compliant
        </div>
      </div>

      <p className="font-body text-xs text-muted">
        You can download or delete all data anytime from the Privacy Center.
      </p>

      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 font-body">
          {submitError}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="ghost" size="lg" className="text-muted border-ink/20" onClick={onBack}>← Back</Button>
        <Button
          variant="primary" size="lg" className="flex-1"
          disabled={!allChecked} loading={loading}
          onClick={onSubmit}
        >
          Start {data.childName || "their"}&apos;s adventure →
        </Button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<FormData>(INIT);
  const [loading, setLoading] = useState(false);
  const [direction, setDirection] = useState(1);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function goNext() {
    setDirection(1);
    setStep((s) => s + 1);
  }

  function goBack() {
    setDirection(-1);
    setStep((s) => s - 1);
  }

  async function handleSubmit() {
    setLoading(true);
    setSubmitError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      const curriculumMap: Record<string, string> = {
        "CBSE": "CBSE", "ICSE": "ICSE", "State Board": "STATE", "US K–12": "US_K12", "IB": "IB",
      };

      const { error } = await supabase.from("children").insert({
        parent_id: user.id,
        full_name: data.childName,
        grade: data.grade,
        curriculum: curriculumMap[data.curriculum] ?? "CBSE",
        screen_time_ratio: data.screenTimeRatio,
        total_xp: 0,
        current_difficulty: 2,
        screen_minutes_earned: 0,
        screen_minutes_used: 0,
      });

      if (error) {
        setSubmitError(error.message);
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const stepProps = { data, setData, onNext: goNext, onBack: goBack };

  return (
    <div className="flex min-h-screen">
      <Sidebar current={step} />

      <main className="flex-1 bg-cream flex items-start justify-center py-16 px-6">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={{ x: direction * 60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: direction * -60, opacity: 0 }}
              transition={{ duration: 0.25, ease: EASE }}
            >
              {step === 1 && <Step1 onNext={goNext} />}
              {step === 2 && <Step2 {...stepProps} />}
              {step === 3 && <Step3 {...stepProps} />}
              {step === 4 && (
                <Step4 {...{ data, setData, onBack: goBack, onSubmit: handleSubmit, loading, submitError }} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
