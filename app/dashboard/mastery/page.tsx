"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SUBJECTS } from "@/lib/constants";
import { SlideOver } from "@/components/dashboard/SlideOver";

interface MasteryRow {
  topic_id: string;
  subject_id: string;
  mastery_score: number;
  sessions_count: number;
  is_mastered: boolean;
  current_difficulty?: number;
}

interface QuestionResponseRow {
  question_type: string;
  is_correct: boolean;
  score?: number;
  answered_at: string;
  fill_answer?: string | null;
  selected_option?: string | null;
}

const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Starter", 2: "Building", 3: "Confident", 4: "Advanced", 5: "Mastery",
};

function masteryColor(score: number) {
  if (score >= 80) return "text-mint";
  if (score >= 40) return "text-amber-400";
  return "text-coral";
}

export default function MasteryPage() {
  const [masteryData, setMasteryData] = useState<MasteryRow[]>([]);
  const [childId, setChildId] = useState<string | null>(null);
  const [childName, setChildName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [slideOpen, setSlideOpen] = useState(false);
  const [slideSubjectId, setSlideSubjectId] = useState<string>("");
  const [slideTopicId, setSlideTopicId] = useState<string>("");
  const [slideTopicName, setSlideTopicName] = useState<string>("");
  const [topicResponses, setTopicResponses] = useState<QuestionResponseRow[]>([]);
  const [responsesLoading, setResponsesLoading] = useState(false);

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: child } = await supabase
      .from("children")
      .select("id, full_name")
      .eq("parent_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (!child) { setLoading(false); return; }
    setChildId(child.id);
    setChildName((child as { full_name?: string }).full_name ?? "");

    const { data: rows } = await supabase
      .from("topic_mastery")
      .select("topic_id, subject_id, mastery_score, sessions_count, is_mastered, current_difficulty")
      .eq("child_id", child.id);

    setMasteryData((rows as MasteryRow[]) ?? []);
    setLoading(false);
  }

  const openTopic = useCallback(async (subjectId: string, topicId: string, topicName: string) => {
    setSlideSubjectId(subjectId);
    setSlideTopicId(topicId);
    setSlideTopicName(topicName);
    setSlideOpen(true);
    setTopicResponses([]);
    setResponsesLoading(true);

    if (!childId) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("question_responses")
      .select("question_type, is_correct, answered_at, fill_answer, selected_option")
      .eq("child_id", childId)
      .order("answered_at", { ascending: false })
      .limit(10);

    setTopicResponses((data as QuestionResponseRow[]) ?? []);
    setResponsesLoading(false);
  }, [childId]);

  function toggleCollapse(subjectId: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(subjectId)) next.delete(subjectId);
      else next.add(subjectId);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 rounded-full border-4 border-coral border-t-transparent animate-spin" />
      </div>
    );
  }

  const masteryMap = new Map(masteryData.map((m) => [m.topic_id, m]));

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="font-display font-extrabold text-cream text-3xl">Mastery Map 🗺</h1>
        <p className="font-body text-white/50 text-sm mt-1">
          Track {childName}&apos;s progress across every topic
        </p>
      </div>

      <div className="space-y-6">
        {SUBJECTS.map((subj) => {
          const subjectRows = subj.topics.map((t) => ({
            topic: t,
            mastery: masteryMap.get(t.id),
          }));
          const masteredCount = subjectRows.filter((r) => r.mastery?.is_mastered).length;
          const avgScore =
            subjectRows.length > 0
              ? Math.round(
                  subjectRows.reduce((s, r) => s + (r.mastery?.mastery_score ?? 0), 0) /
                    subjectRows.length
                )
              : 0;
          const isCollapsed = collapsed.has(subj.id);

          return (
            <div
              key={subj.id}
              className="rounded-xl overflow-hidden"
              style={{ border: "1px solid rgba(255,255,255,.07)" }}
            >
              {/* Subject header */}
              <button
                onClick={() => toggleCollapse(subj.id)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left transition-colors"
                style={{ background: "#1C1917" }}
              >
                <span className="text-2xl">{subj.emoji}</span>
                <div className="flex-1">
                  <p className="font-display font-bold text-cream text-base">{subj.name}</p>
                  <p className="font-body text-white/40 text-[11px]">
                    {masteredCount} of {subj.topics.length} topics mastered
                  </p>
                </div>
                <span className={`font-display font-bold text-xl ${masteryColor(avgScore)}`}>
                  {avgScore}%
                </span>
                <span className="text-white/30 text-sm ml-2">{isCollapsed ? "▼" : "▲"}</span>
              </button>

              {/* Topic grid */}
              {!isCollapsed && (
                <div
                  className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4"
                  style={{ background: "rgba(255,255,255,.02)" }}
                >
                  {subjectRows.map(({ topic, mastery }) => {
                    const score = mastery?.mastery_score ?? 0;
                    const diff = mastery?.current_difficulty ?? 1;
                    return (
                      <button
                        key={topic.id}
                        onClick={() => void openTopic(subj.id, topic.id, topic.name)}
                        className="rounded-lg p-4 text-left transition-all hover:scale-[1.02]"
                        style={{
                          background: "#1C1917",
                          border: "1px solid rgba(255,255,255,.06)",
                        }}
                      >
                        <p className="font-body text-cream text-[13px] font-medium mb-2 leading-snug">
                          {topic.name}
                        </p>
                        <div className={`font-display font-bold text-2xl mb-1 ${masteryColor(score)}`}>
                          {score}%
                          {mastery?.is_mastered && (
                            <span className="ml-1 text-[10px] bg-mint/20 text-mint px-1.5 py-0.5 rounded-full font-body font-bold align-middle">
                              🏆 Mastered
                            </span>
                          )}
                        </div>
                        <p className="font-body text-white/30 text-[11px] mb-2">
                          {mastery?.sessions_count ?? 0} sessions attempted
                        </p>
                        {/* Mini progress bar */}
                        <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,.08)" }}>
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${score}%`,
                              background:
                                score >= 80
                                  ? "#00BF80"
                                  : score >= 40
                                  ? "#FBBF24"
                                  : "#FF4D2E",
                            }}
                          />
                        </div>
                        <p className="font-body text-white/25 text-[10px] mt-1.5">
                          {DIFFICULTY_LABELS[diff] ?? "Starter"}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Slide-over panel */}
      <SlideOver
        isOpen={slideOpen}
        onClose={() => setSlideOpen(false)}
        title={slideTopicName}
      >
        <div className="space-y-4">
          <Link
            href={`/learn/${slideSubjectId}/${slideTopicId}`}
            className="block w-full py-3 rounded-xl font-child font-bold text-white text-sm text-center"
            style={{ background: "linear-gradient(90deg, #FF4D2E, #FFBE00)" }}
          >
            🚀 Start a session on this topic
          </Link>

          <div>
            <p className="font-body text-[11px] uppercase tracking-widest text-white/30 mb-3">
              Last 10 responses
            </p>
            {responsesLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 rounded-lg bg-white/[.04] animate-pulse" />
                ))}
              </div>
            ) : topicResponses.length === 0 ? (
              <p className="font-body text-white/30 text-sm text-center py-8">
                No responses yet for this topic.
              </p>
            ) : (
              <div className="space-y-2">
                {topicResponses.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                    style={{ background: "rgba(255,255,255,.04)" }}
                  >
                    <span className="text-base">{r.is_correct ? "✅" : "❌"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-cream text-[12px] truncate">
                        {r.fill_answer ?? r.selected_option ?? r.question_type}
                      </p>
                      <p className="font-body text-white/30 text-[10px]">
                        {new Date(r.answered_at).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-bold ${r.is_correct ? "text-mint" : "text-rose"}`}
                    >
                      {r.is_correct ? "✓" : "✗"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SlideOver>
    </div>
  );
}
