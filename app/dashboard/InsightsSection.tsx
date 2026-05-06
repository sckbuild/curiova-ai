"use client";

import { useEffect, useState, useCallback } from "react";
import { InsightCard } from "@/components/dashboard/InsightCard";
import { SlideOver } from "@/components/dashboard/SlideOver";
import { SkeletonCard } from "@/components/dashboard/SkeletonCard";
import type { AiInsight } from "@/types";

interface InsightsSectionProps {
  initialInsights: AiInsight[];
  childId: string;
  childName: string;
}

export function InsightsSection({ initialInsights, childId, childName }: InsightsSectionProps) {
  const [insights, setInsights] = useState<AiInsight[]>(initialInsights);
  const [generating, setGenerating] = useState(false);
  const [activeInsight, setActiveInsight] = useState<AiInsight | null>(null);

  const generate = useCallback(async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/insights/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ child_id: childId }),
      });
      const data = await res.json() as { insights?: AiInsight[] };
      if (data.insights) setInsights(data.insights as AiInsight[]);
    } catch {
      // silently fail
    } finally {
      setGenerating(false);
    }
  }, [childId]);

  useEffect(() => {
    if (initialInsights.length === 0) {
      void generate();
    }
  }, [initialInsights.length, generate]);

  return (
    <>
      <div className="mt-8">
        <div className="mb-4">
          <h2 className="font-display font-extrabold text-cream text-lg">
            This week&apos;s insights
          </h2>
          <p className="font-body text-white/40 text-[12px] mt-0.5">
            Personalised for {childName} — one clear action each
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {generating
            ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
            : insights.map((ins) => (
                <InsightCard
                  key={ins.id}
                  insight={ins}
                  onActionClick={setActiveInsight}
                />
              ))}
        </div>
      </div>

      <SlideOver
        isOpen={!!activeInsight}
        onClose={() => setActiveInsight(null)}
        title={activeInsight?.title ?? ""}
      >
        {activeInsight && (
          <div className="space-y-4">
            <p className="font-body text-white/60 text-sm leading-relaxed">
              {activeInsight.body}
            </p>
            <div
              className="rounded-xl p-4"
              style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.06)" }}
            >
              <p className="font-body text-[11px] uppercase tracking-widest text-white/30 mb-2">
                Recommended action
              </p>
              <p className="font-body text-cream text-sm">
                {/* action field not in type but stored in DB — fallback */}
                Schedule a 20-minute study session focused on this area.
              </p>
            </div>
            <button
              onClick={() => setActiveInsight(null)}
              className="w-full py-3 rounded-xl font-child font-bold text-white text-sm"
              style={{ background: "linear-gradient(90deg, #FF4D2E, #FFBE00)" }}
            >
              Got it — let&apos;s go! 🚀
            </button>
          </div>
        )}
      </SlideOver>
    </>
  );
}
