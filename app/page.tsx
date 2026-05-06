"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";

// ─── Motion helpers ────────────────────────────────────────────────────────────

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: EASE, delay },
});

// ─── App Preview Card (right column of hero) ──────────────────────────────────

function AppPreviewCard() {
  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Glow */}
      <div className="absolute -inset-4 bg-coral/20 rounded-3xl blur-2xl pointer-events-none" />

      <div className="relative bg-[#1C1917] rounded-2xl overflow-hidden shadow-xl border border-white/10">
        {/* Card header */}
        <div className="bg-gradient-to-r from-coral to-sun px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-white/70 text-xs font-body font-medium uppercase tracking-wide">
              Arjun&apos;s quests
            </p>
            <p className="text-white font-display font-bold text-lg leading-tight">
              Today&apos;s quests
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5">
            <span className="text-sm">🔥</span>
            <span className="text-white font-display font-bold text-sm">7</span>
            <span className="text-white/70 text-xs font-body">day streak</span>
          </div>
        </div>

        {/* XP bar */}
        <div className="px-5 py-3 border-b border-white/6">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-white/50 text-xs font-body">XP today</span>
            <span className="text-white font-body font-medium text-xs">
              80 / 100
            </span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-coral to-sun rounded-full"
              style={{ width: "80%" }}
            />
          </div>
        </div>

        {/* Quest rows */}
        <div className="px-5 py-3 flex flex-col gap-2">
          {/* Done */}
          <div className="flex items-center gap-3 p-3 bg-mint/10 rounded-lg border border-mint/20">
            <div className="w-7 h-7 rounded-full bg-mint flex items-center justify-center shrink-0">
              <span className="text-white text-xs">✓</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-body font-medium truncate">
                Algebra — Level 3
              </p>
              <p className="text-mint text-xs font-body">+30 XP earned</p>
            </div>
            <span className="text-mint text-xs font-body font-medium shrink-0">
              Done!
            </span>
          </div>

          {/* Active */}
          <div className="flex items-center gap-3 p-3 bg-coral/10 rounded-lg border border-coral/30">
            <div className="w-7 h-7 rounded-full bg-coral flex items-center justify-center shrink-0">
              <span className="text-white text-xs">⚡</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-body font-medium truncate">
                Science — Cells
              </p>
              <p className="text-coral text-xs font-body">In progress…</p>
            </div>
            <span className="text-coral text-xs font-body font-semibold shrink-0 animate-pulse">
              Active
            </span>
          </div>

          {/* Locked */}
          <div className="flex items-center gap-3 p-3 bg-white/4 rounded-lg border border-white/8 opacity-50">
            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
              <span className="text-white/50 text-xs">🔒</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/50 text-sm font-body font-medium truncate">
                English — Grammar
              </p>
              <p className="text-white/30 text-xs font-body">
                Complete Science first
              </p>
            </div>
          </div>
        </div>

        {/* Screen time earned */}
        <div className="px-5 py-3 bg-white/4 border-t border-white/8 flex items-center gap-2">
          <span className="text-base">🎮</span>
          <p className="text-white/80 text-sm font-body">
            <span className="font-semibold text-white">45m</span> screen time
            earned today
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Hero ──────────────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="relative min-h-screen bg-ink flex flex-col justify-center overflow-hidden pt-[60px]">
      {/* SVG grain overlay */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.035]"
        aria-hidden
      >
        <filter id="grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>

      {/* Radial glow */}
      <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-coral/8 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />

      <div className="relative max-w-7xl mx-auto px-6 py-20 w-full grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        {/* Left column */}
        <div className="flex flex-col gap-8">
          {/* Eyebrow */}
          <motion.div {...fadeUp(0)} className="flex items-center gap-2 w-fit">
            <div className="flex items-center gap-2 bg-white/8 border border-white/12 rounded-full px-3 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-coral shrink-0" />
              <span className="text-white/60 font-body uppercase tracking-widest text-[11px]">
                India · US · CBSE · ICSE · K–12 · Ages 7–17
              </span>
            </div>
          </motion.div>

          {/* H1 */}
          <motion.h1
            {...fadeUp(0)}
            className="font-display font-extrabold text-cream leading-[1.05]"
            style={{ fontSize: "clamp(52px,6vw,88px)" }}
          >
            Curious minds
            <br />
            <span className="text-coral">level up.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            {...fadeUp(0.15)}
            className="font-body font-light text-[17px] leading-relaxed max-w-lg"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            Curiova turns &ldquo;I don&apos;t want to study&rdquo; into a
            high-five moment — and gives parents one calm, clear place to see it
            all happen.
          </motion.p>

          {/* CTAs */}
          <motion.div
            {...fadeUp(0.3)}
            className="flex flex-wrap items-center gap-3"
          >
            <Link
              href="/onboarding"
              className="bg-coral text-white font-body font-semibold px-7 py-3.5 rounded-full hover:bg-[#e6441f] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-coral/30 transition-all duration-150"
            >
              Start free — 3 min setup →
            </Link>
            <Link
              href="/learn"
              className="text-white/70 font-body font-medium px-5 py-3.5 rounded-full border border-white/15 hover:border-white/30 hover:text-white hover:bg-white/8 transition-all duration-150 flex items-center gap-2"
            >
              <span className="text-xs">▶</span> See the child experience
            </Link>
          </motion.div>
        </div>

        {/* Right column — app card */}
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.2 }}
          className="hidden md:flex justify-center"
        >
          <AppPreviewCard />
        </motion.div>
      </div>
    </section>
  );
}

// ─── Stats strip ───────────────────────────────────────────────────────────────

const STATS = [
  { value: "2.4M", label: "questions answered this month" },
  { value: "94%", label: "of kids complete every session" },
  { value: "3×", label: "average test score improvement" },
  { value: "0", label: "ads. ever. full stop." },
];

function StatsSection() {
  return (
    <section
      className="bg-cream-dark py-16 px-6"
      data-nav-theme="light"
    >
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-0">
        {STATS.map((stat, i) => (
          <div
            key={stat.value}
            className={`flex flex-col items-center text-center px-6 py-4 ${
              i < STATS.length - 1
                ? "border-b md:border-b-0 md:border-r border-ink/10"
                : ""
            } ${i % 2 === 0 && i < 2 ? "border-r border-ink/10 md:border-none" : ""}`}
          >
            <span
              className="font-display font-extrabold text-ink"
              style={{ fontSize: "40px" }}
            >
              {stat.value}
            </span>
            <span className="font-body text-[13px] text-muted mt-1 max-w-[130px]">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Marquee strip ─────────────────────────────────────────────────────────────

const MARQUEE_ITEMS = [
  "CBSE",
  "ICSE",
  "US K–12",
  "Adaptive Learning",
  "Screen Time Rewards",
  "Privacy First",
  "Ages 7–17",
  "India & US",
  "No Ads Ever",
];

function MarqueeSection() {
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];

  return (
    <section className="bg-coral overflow-hidden py-4">
      <div className="relative flex">
        <div className="animate-marquee flex items-center whitespace-nowrap">
          {items.map((item, i) => (
            <span
              key={i}
              className="font-display font-bold text-[14px] uppercase tracking-widest text-white px-8 flex items-center gap-8"
            >
              {item}
              <span className="text-white/40 text-lg">·</span>
            </span>
          ))}
        </div>
        <div
          className="animate-marquee flex items-center whitespace-nowrap"
          aria-hidden
        >
          {items.map((item, i) => (
            <span
              key={i}
              className="font-display font-bold text-[14px] uppercase tracking-widest text-white px-8 flex items-center gap-8"
            >
              {item}
              <span className="text-white/40 text-lg">·</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features ──────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: "🎯",
    color: "bg-coral/10 text-coral",
    title: "Gets smarter as they do",
    body: "Every answer teaches Curiova something new. Questions adjust in real-time — always challenging, never crushing.",
  },
  {
    icon: "🎮",
    color: "bg-sun/10 text-sun",
    title: "Learn it. Earn it. Play it.",
    body: "Study sessions unlock real screen time. Kids feel the reward instantly. Parents set the rules once and relax.",
  },
  {
    icon: "🌏",
    color: "bg-sky/10 text-sky",
    title: "Built for every child",
    body: "CBSE, ICSE, US K-12. English, Hindi, Tamil, Telugu. One platform, built for millions of curious minds.",
  },
  {
    icon: "🔒",
    color: "bg-mint/10 text-mint",
    title: "Fort Knox for family data",
    body: "Zero ads. Zero data sales. Zero third parties in your child's learning space. COPPA + DPDP compliant.",
  },
];

function FeaturesSection() {
  return (
    <section
      className="bg-warm-white py-24 px-6"
      data-nav-theme="light"
    >
      <div className="max-w-5xl mx-auto">
        {/* Eyebrow + heading */}
        <div className="mb-16 max-w-2xl">
          <p className="text-coral font-body text-[11px] uppercase tracking-widest font-semibold mb-3">
            Why Curiova works
          </p>
          <h2
            className="font-display font-extrabold text-ink leading-[1.1]"
            style={{ fontSize: "clamp(36px,4vw,56px)" }}
          >
            Built for the way kids actually learn.
          </h2>
        </div>

        {/* 2×2 grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 border border-ink/10 rounded-xl overflow-hidden">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className={`p-8 group hover:bg-cream-dark/50 transition-colors duration-200 ${
                i % 2 === 0 ? "md:border-r border-ink/10" : ""
              } ${i < 2 ? "border-b border-ink/10" : ""}`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-5 ${f.color}`}
              >
                {f.icon}
              </div>
              <h3 className="font-display font-bold text-ink text-xl mb-3">
                {f.title}
              </h3>
              <p className="font-body text-muted text-[15px] leading-relaxed">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Trust section ─────────────────────────────────────────────────────────────

const TRUST_BADGES = [
  {
    icon: "🛡️",
    title: "COPPA + DPDP compliant",
    desc: "We meet or exceed every child privacy law in India and the US.",
  },
  {
    icon: "📵",
    title: "Zero ads, zero tracking",
    desc: "Your child's data is never sold, shared, or analysed for profit.",
  },
  {
    icon: "🔔",
    title: "Weekly parent digest",
    desc: "One email every Sunday — wins, focus areas, and what's next.",
  },
];

const INSIGHT_CARDS = [
  {
    icon: "🌟",
    title: "Arjun is crushing it in English",
    tag: "✦ This week's win",
    tagColor: "bg-mint/20 text-mint",
    glow: "border-mint/20 bg-mint/4",
  },
  {
    icon: "📐",
    title: "Fractions need a quick boost",
    tag: "↗ Quick action available",
    tagColor: "bg-sun/20 text-sun",
    glow: "border-sun/20 bg-sun/4",
  },
  {
    icon: "⏰",
    title: "Golden hour alert",
    tag: "◎ Pattern spotted",
    tagColor: "bg-sky/20 text-sky",
    glow: "border-sky/20 bg-sky/4",
  },
];

function TrustSection() {
  return (
    <section className="bg-ink py-24 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        {/* Left */}
        <div>
          <p className="text-coral font-body text-[11px] uppercase tracking-widest font-semibold mb-4">
            For parents
          </p>
          <h2
            className="font-display font-extrabold text-cream leading-[1.1] mb-6"
            style={{ fontSize: "clamp(32px,3.5vw,52px)" }}
          >
            Calm visibility.
            <br />
            Zero anxiety.
          </h2>
          <p className="font-body text-white/50 text-[16px] leading-relaxed mb-10">
            Curiova gives you the full picture — what your child studied, how
            they&apos;re doing, and what they need next — delivered in plain
            language, not charts.
          </p>
          <div className="flex flex-col gap-6">
            {TRUST_BADGES.map((b) => (
              <div key={b.title} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/6 flex items-center justify-center text-xl shrink-0">
                  {b.icon}
                </div>
                <div>
                  <p className="font-body font-semibold text-cream text-sm mb-0.5">
                    {b.title}
                  </p>
                  <p className="font-body text-white/40 text-sm leading-relaxed">
                    {b.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — insight cards */}
        <div className="flex flex-col gap-4">
          {INSIGHT_CARDS.map((card) => (
            <div
              key={card.title}
              className={`rounded-xl border p-5 flex items-center gap-4 ${card.glow}`}
            >
              <div className="w-11 h-11 rounded-xl bg-white/6 flex items-center justify-center text-2xl shrink-0">
                {card.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body font-semibold text-cream text-sm mb-1.5 leading-snug">
                  {card.title}
                </p>
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-body font-medium px-2.5 py-1 rounded-full ${card.tagColor}`}
                >
                  {card.tag}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA section ───────────────────────────────────────────────────────────────

function CtaSection() {
  return (
    <section
      className="bg-cream py-32 px-6 text-center"
      data-nav-theme="light"
    >
      <div className="max-w-3xl mx-auto">
        <h2
          className="font-display font-extrabold text-ink leading-[1.05] tracking-tight mb-5"
          style={{ fontSize: "clamp(40px,5vw,72px)" }}
        >
          Ready to spark it?
        </h2>
        <p className="font-body text-muted text-lg mb-10">
          Free to start. Takes 3 minutes. No credit card.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/onboarding"
            className="bg-ink text-cream font-body font-semibold px-8 py-4 rounded-full hover:bg-[#1c1917] hover:-translate-y-0.5 hover:shadow-xl transition-all duration-150 text-[17px]"
          >
            Build your child&apos;s world →
          </Link>
          <Link
            href="/learn"
            className="text-ink font-body font-medium px-6 py-4 rounded-full border-[1.5px] border-ink/20 hover:border-ink/50 hover:bg-ink/4 transition-all duration-150 text-[17px]"
          >
            See child demo first
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer
      className="bg-ink border-t border-white/6 py-8 px-6"
      data-nav-theme="dark"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <span className="font-display font-bold text-cream/80 text-sm">
          curio<span className="text-coral">·</span>va.ai
        </span>
        <span className="font-body text-white/30 text-xs">
          © 2025 Curiova. COPPA & DPDP compliant · No ads · No data sales
        </span>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <>
      <Navbar variant="auto" />
      <HeroSection />
      <StatsSection />
      <MarqueeSection />
      <FeaturesSection />
      <TrustSection />
      <CtaSection />
      <Footer />
    </>
  );
}
