"use client";

import type { AiInsight } from "@/types";

interface InsightCardProps {
  insight: AiInsight;
  onActionClick?: (insight: AiInsight) => void;
}

const VARIANT_CFG = {
  win:  { bg: "bg-green-500/[.06]",  border: "border-green-500/[.15]",  accent: "text-green-400",  emoji: "🏆" },
  warn: { bg: "bg-amber-500/[.06]", border: "border-amber-500/[.15]", accent: "text-amber-400", emoji: "💡" },
  info: { bg: "bg-sky/[.08]",        border: "border-sky/[.20]",        accent: "text-sky",        emoji: "ℹ️" },
} as const;

export function InsightCard({ insight, onActionClick }: InsightCardProps) {
  const cfg = VARIANT_CFG[insight.insight_type as keyof typeof VARIANT_CFG] ?? VARIANT_CFG.info;

  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-3 h-full ${cfg.bg} ${cfg.border}`}>
      <div className="flex items-start gap-3 flex-1">
        <span className="text-2xl mt-0.5 flex-shrink-0">{cfg.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="font-body font-semibold text-cream text-[13px] leading-snug mb-1.5">
            {insight.title}
          </p>
          <p className="font-body text-white/50 text-[12px] leading-relaxed">
            {insight.body}
          </p>
        </div>
      </div>
      {onActionClick && (
        <button
          onClick={() => onActionClick(insight)}
          className={`font-body text-[12px] font-semibold self-start flex items-center gap-1 ${cfg.accent} hover:opacity-80 transition-opacity`}
        >
          See action →
        </button>
      )}
    </div>
  );
}
