"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { SUBJECTS } from "@/lib/constants";

interface WeekBucket {
  label: string;
  weekStart: Date;
  accuracy: number;
  sessions: number;
  subjectAccuracy: Record<string, number>;
}

interface SessionRow {
  id: string;
  subject_id: string;
  started_at: string;
  completed_at: string | null;
  correct_answers: number;
  total_questions: number;
}

interface MilestoneRow {
  type: "first_session" | "first_mastered" | "longest_streak" | "most_improved";
  label: string;
  sub: string;
  date: string;
}

const SUBJECT_COLORS: Record<string, string> = {
  english:          "#16A34A",
  maths:            "#2B7FFF",
  science:          "#7C3AED",
  "social-studies": "#D97706",
};

function smoothPath(points: [number, number][]): string {
  if (points.length < 2) return "";
  const cmds: string[] = [`M ${points[0][0]} ${points[0][1]}`];
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    const cx = (x0 + x1) / 2;
    cmds.push(`C ${cx} ${y0} ${cx} ${y1} ${x1} ${y1}`);
  }
  return cmds.join(" ");
}

export default function GrowthPage() {
  const [weeks, setWeeks] = useState<WeekBucket[]>([]);
  const [childName, setChildName] = useState("");
  const [loading, setLoading] = useState(true);
  const [visibleSubjects, setVisibleSubjects] = useState<Set<string>>(
    new Set(SUBJECTS.map((s) => s.id))
  );
  const [tooltipIdx, setTooltipIdx] = useState<number | null>(null);
  const [milestones, setMilestones] = useState<MilestoneRow[]>([]);
  const [streakRow, setStreakRow] = useState<{ current_streak: number; longest_streak: number } | null>(null);

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
    setChildName((child as { full_name?: string }).full_name ?? "");

    const since = new Date();
    since.setDate(since.getDate() - 90);

    const [{ data: sessions }, { data: streak }, { data: mastery }] = await Promise.all([
      supabase
        .from("study_sessions")
        .select("id, subject_id, started_at, completed_at, correct_answers, total_questions")
        .eq("child_id", child.id)
        .gte("started_at", since.toISOString())
        .not("completed_at", "is", null),
      supabase
        .from("streaks")
        .select("current_streak, longest_streak")
        .eq("child_id", child.id)
        .single(),
      supabase
        .from("topic_mastery")
        .select("topic_id, subject_id, is_mastered, last_studied_at, mastery_score")
        .eq("child_id", child.id),
    ]);

    setStreakRow(streak as { current_streak: number; longest_streak: number } | null);

    // Build 12-week buckets
    const now = new Date();
    const buckets: WeekBucket[] = [];
    for (let w = 11; w >= 0; w--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - w * 7 - ((now.getDay() + 6) % 7));
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const weekSessions = (sessions as SessionRow[] | null ?? []).filter((s) => {
        const d = new Date(s.started_at);
        return d >= weekStart && d < weekEnd;
      });

      const total = weekSessions.reduce((s, r) => s + (r.total_questions ?? 0), 0);
      const correct = weekSessions.reduce((s, r) => s + (r.correct_answers ?? 0), 0);
      const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

      const subjectAccuracy: Record<string, number> = {};
      for (const subj of SUBJECTS) {
        const subs = weekSessions.filter((s) => s.subject_id === subj.id);
        const st = subs.reduce((a, s) => a + (s.total_questions ?? 0), 0);
        const sc = subs.reduce((a, s) => a + (s.correct_answers ?? 0), 0);
        subjectAccuracy[subj.id] = st > 0 ? Math.round((sc / st) * 100) : 0;
      }

      const label = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      buckets.push({ label, weekStart, accuracy, sessions: weekSessions.length, subjectAccuracy });
    }
    setWeeks(buckets);

    // Build milestones
    const ms: MilestoneRow[] = [];
    const firstSession = (sessions as SessionRow[] | null ?? []).sort(
      (a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime()
    )[0];
    if (firstSession) {
      ms.push({
        type: "first_session",
        label: "First session completed 🎯",
        sub: "",
        date: firstSession.started_at,
      });
    }
    const firstMastered = (mastery ?? [])
      .filter((m: { is_mastered: boolean }) => m.is_mastered)
      .sort((a: { last_studied_at: string | null }, b: { last_studied_at: string | null }) =>
        new Date(a.last_studied_at ?? 0).getTime() - new Date(b.last_studied_at ?? 0).getTime()
      )[0];
    if (firstMastered) {
      const allTopics: { id: string; name: string }[] = [];
      for (const s of SUBJECTS) for (const t of s.topics) allTopics.push({ id: t.id, name: t.name });
      const topicName = allTopics.find(
        (t) => t.id === (firstMastered as { topic_id: string }).topic_id
      )?.name ?? "a topic";
      ms.push({
        type: "first_mastered",
        label: "First topic mastered 🏆",
        sub: topicName,
        date: (firstMastered as { last_studied_at: string | null }).last_studied_at ?? "",
      });
    }
    if (streak && (streak as { longest_streak: number }).longest_streak > 0) {
      ms.push({
        type: "longest_streak",
        label: "Longest streak achieved 🔥",
        sub: `${(streak as { longest_streak: number }).longest_streak} days`,
        date: "",
      });
    }
    setMilestones(ms);
    setLoading(false);
  }

  function toggleSubject(id: string) {
    setVisibleSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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

  const W = 600;
  const H = 180;
  const PAD = { l: 40, r: 20, t: 16, b: 24 };
  const chartW = W - PAD.l - PAD.r;
  const chartH = H - PAD.t - PAD.b;
  const xStep = weeks.length > 1 ? chartW / (weeks.length - 1) : chartW;

  function yPos(pct: number) {
    return PAD.t + chartH - (pct / 100) * chartH;
  }

  const overallPoints: [number, number][] = weeks.map((w, i) => [
    PAD.l + i * xStep,
    yPos(w.accuracy),
  ]);

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="font-display font-extrabold text-cream text-3xl">Growth Over Time 📈</h1>
        <p className="font-body text-white/50 text-sm mt-1">
          {childName}&apos;s accuracy trends across the last 12 weeks
        </p>
      </div>

      {/* Chart card */}
      <div
        className="rounded-xl p-5 mb-6"
        style={{ background: "#1C1917", border: "1px solid rgba(255,255,255,.07)" }}
      >
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <p className="font-body font-semibold text-cream text-sm flex-1">Accuracy over time</p>
          {SUBJECTS.map((s) => (
            <button
              key={s.id}
              onClick={() => toggleSubject(s.id)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full font-body text-[11px] transition-opacity"
              style={{
                background: visibleSubjects.has(s.id)
                  ? `${SUBJECT_COLORS[s.id]}25`
                  : "rgba(255,255,255,.06)",
                color: visibleSubjects.has(s.id) ? SUBJECT_COLORS[s.id] : "rgba(255,255,255,.3)",
                border: `1px solid ${visibleSubjects.has(s.id) ? `${SUBJECT_COLORS[s.id]}50` : "transparent"}`,
              }}
            >
              {s.emoji} {s.name}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            width="100%"
            style={{ minWidth: 300 }}
            onMouseLeave={() => setTooltipIdx(null)}
          >
            {/* Grid lines */}
            {[25, 50, 75, 100].map((pct) => (
              <g key={pct}>
                <line
                  x1={PAD.l} y1={yPos(pct)} x2={W - PAD.r} y2={yPos(pct)}
                  stroke="rgba(255,255,255,.06)" strokeWidth="1" strokeDasharray="4 4"
                />
                <text
                  x={PAD.l - 6} y={yPos(pct) + 4}
                  textAnchor="end" fontSize="9" fill="rgba(255,255,255,.25)"
                >
                  {pct}%
                </text>
              </g>
            ))}

            {/* Subject lines */}
            {SUBJECTS.filter((s) => visibleSubjects.has(s.id)).map((subj) => {
              const pts: [number, number][] = weeks.map((w, i) => [
                PAD.l + i * xStep,
                yPos(w.subjectAccuracy[subj.id] ?? 0),
              ]);
              return (
                <path
                  key={subj.id}
                  d={smoothPath(pts)}
                  fill="none"
                  stroke={SUBJECT_COLORS[subj.id]}
                  strokeWidth="1.5"
                  strokeOpacity="0.5"
                  strokeLinecap="round"
                />
              );
            })}

            {/* Overall accuracy line */}
            <path
              d={smoothPath(overallPoints)}
              fill="none"
              stroke="#FF4D2E"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Data points + hover zones */}
            {overallPoints.map(([x, y], i) => (
              <g key={i} onMouseEnter={() => setTooltipIdx(i)}>
                <circle cx={x} cy={y} r="12" fill="transparent" />
                <circle
                  cx={x} cy={y} r="4"
                  fill="#FF4D2E"
                  stroke="white"
                  strokeWidth="1.5"
                  opacity={tooltipIdx === i ? 1 : 0.7}
                />
                {tooltipIdx === i && (
                  <g>
                    <rect
                      x={Math.min(x - 32, W - PAD.r - 72)}
                      y={y - 36}
                      width="72" height="28"
                      rx="6"
                      fill="#141210"
                      stroke="rgba(255,255,255,.12)"
                      strokeWidth="1"
                    />
                    <text
                      x={Math.min(x - 32, W - PAD.r - 72) + 36}
                      y={y - 26}
                      textAnchor="middle"
                      fontSize="9"
                      fill="rgba(255,255,255,.5)"
                    >
                      {weeks[i]?.label}
                    </text>
                    <text
                      x={Math.min(x - 32, W - PAD.r - 72) + 36}
                      y={y - 14}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="700"
                      fill="#F5F1EA"
                    >
                      {weeks[i]?.accuracy}%
                    </text>
                  </g>
                )}
                {/* X label */}
                {i % 2 === 0 && (
                  <text
                    x={x} y={H - 4}
                    textAnchor="middle"
                    fontSize="8"
                    fill="rgba(255,255,255,.3)"
                  >
                    {weeks[i]?.label}
                  </text>
                )}
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Milestones */}
      {milestones.length > 0 && (
        <div>
          <h2 className="font-display font-bold text-cream text-lg mb-3">Key milestones</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {milestones.map((m, i) => (
              <div
                key={i}
                className="rounded-xl p-4"
                style={{ background: "#1C1917", border: "1px solid rgba(255,255,255,.07)" }}
              >
                <p className="font-body font-semibold text-cream text-sm">{m.label}</p>
                {m.sub && <p className="font-body text-white/50 text-[12px] mt-0.5">{m.sub}</p>}
                {m.date && (
                  <p className="font-body text-white/30 text-[11px] mt-1">
                    {new Date(m.date).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
            ))}
            {streakRow && streakRow.longest_streak > 0 && (
              <div
                className="rounded-xl p-4"
                style={{ background: "#1C1917", border: "1px solid rgba(255,255,255,.07)" }}
              >
                <p className="font-body font-semibold text-cream text-sm">
                  Longest streak achieved 🔥
                </p>
                <p className="font-body text-white/50 text-[12px] mt-0.5">
                  {streakRow.longest_streak} days in a row
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {weeks.every((w) => w.sessions === 0) && (
        <div className="text-center py-16">
          <p className="font-body text-white/30 text-sm">No sessions in the last 90 days yet.</p>
        </div>
      )}
    </div>
  );
}
