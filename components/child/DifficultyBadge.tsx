"use client";

import { motion } from "framer-motion";

const CONFIG = {
  1: { label: "Starter",   emoji: "🌱", cls: "bg-mint/15 text-mint border-mint/30" },
  2: { label: "Building",  emoji: "🌿", cls: "bg-sky/15 text-sky border-sky/30" },
  3: { label: "Confident", emoji: "⚡", cls: "bg-sun/15 text-[#b38600] border-sun/40" },
  4: { label: "Advanced",  emoji: "🚀", cls: "bg-coral/15 text-coral border-coral/30" },
  5: { label: "Mastery",   emoji: "🏆", cls: "bg-grape/15 text-grape border-grape/30" },
} as const;

interface Props {
  level: 1 | 2 | 3 | 4 | 5;
  animate?: boolean;
  size?: "sm" | "md";
}

export function DifficultyBadge({ level, animate = false, size = "md" }: Props) {
  const cfg = CONFIG[level];
  const sz = size === "sm" ? "px-2 py-0.5 text-[11px] gap-1" : "px-3 py-1.5 text-sm gap-1.5";

  const inner = (
    <span
      className={`inline-flex items-center rounded-full border font-body font-semibold ${cfg.cls} ${sz}`}
    >
      <span>{cfg.emoji}</span>
      <span>{cfg.label}</span>
    </span>
  );

  if (!animate) return inner;

  return (
    <motion.span
      key={level}
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 22 }}
      className="inline-flex"
    >
      {inner}
    </motion.span>
  );
}
