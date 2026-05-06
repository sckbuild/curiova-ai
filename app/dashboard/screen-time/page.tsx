"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface DayBucket {
  label: string;
  date: Date;
  earned: number;
}

interface SessionRow {
  id: string;
  subject_id: string;
  topic_id: string;
  started_at: string;
  completed_at: string | null;
  screen_minutes_earned: number;
  correct_answers: number;
  total_questions: number;
}

function ProgressRing({ pct, size = 80 }: { pct: number; size?: number }) {
  const r = size / 2 - 8;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(pct, 100) / 100);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="8" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke="#2B7FFF"
        strokeWidth="8"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x={size / 2} y={size / 2 + 5}
        textAnchor="middle"
        fontSize="14"
        fontWeight="700"
        fill="#F5F1EA"
      >
        {Math.round(Math.min(pct, 100))}%
      </text>
    </svg>
  );
}

export default function ScreenTimePage() {
  const [childId, setChildId] = useState<string | null>(null);
  const [childName, setChildName] = useState("");
  const [ratio, setRatio] = useState(2);
  const [pendingRatio, setPendingRatio] = useState(2);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [todayEarned, setTodayEarned] = useState(0);
  const [todaySessions, setTodaySessions] = useState<SessionRow[]>([]);
  const [days, setDays] = useState<DayBucket[]>([]);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: child } = await supabase
      .from("children")
      .select("id, full_name, screen_time_ratio")
      .eq("parent_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .single();
    if (!child) { setLoading(false); return; }
    setChildId(child.id);
    setChildName((child as { full_name?: string }).full_name ?? "");
    const r = (child as { screen_time_ratio?: number }).screen_time_ratio ?? 2;
    setRatio(r);
    setPendingRatio(r);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const since14 = new Date();
    since14.setDate(since14.getDate() - 14);

    const [{ data: todayRows }, { data: allRows }] = await Promise.all([
      supabase
        .from("study_sessions")
        .select("id, subject_id, topic_id, started_at, completed_at, screen_minutes_earned, correct_answers, total_questions")
        .eq("child_id", child.id)
        .gte("started_at", todayStart.toISOString()),
      supabase
        .from("study_sessions")
        .select("started_at, screen_minutes_earned, completed_at")
        .eq("child_id", child.id)
        .gte("started_at", since14.toISOString()),
    ]);

    setTodaySessions((todayRows as SessionRow[]) ?? []);
    const earned = (todayRows as SessionRow[] ?? [])
      .filter((s) => s.completed_at)
      .reduce((sum, s) => sum + (s.screen_minutes_earned ?? 0), 0);
    setTodayEarned(earned);

    // Build 14-day buckets
    const buckets: DayBucket[] = [];
    const now = new Date();
    for (let d = 13; d >= 0; d--) {
      const date = new Date(now);
      date.setDate(now.getDate() - d);
      date.setHours(0, 0, 0, 0);
      const next = new Date(date);
      next.setDate(date.getDate() + 1);
      const dayEarned = (allRows ?? [])
        .filter((s: { started_at: string; completed_at: string | null }) => {
          const sd = new Date(s.started_at);
          return sd >= date && sd < next && s.completed_at;
        })
        .reduce((sum: number, s: { screen_minutes_earned: number }) => sum + (s.screen_minutes_earned ?? 0), 0);
      buckets.push({
        label: date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
        date,
        earned: dayEarned,
      });
    }
    setDays(buckets);
    setLoading(false);
  }

  async function saveRatio() {
    if (!childId) return;
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("children")
      .update({ screen_time_ratio: pendingRatio })
      .eq("id", childId);
    setRatio(pendingRatio);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const dailyLimit = ratio * 15;
  const pct = dailyLimit > 0 ? (todayEarned / dailyLimit) * 100 : 0;
  const previewLimit = pendingRatio * 15;
  const maxDayEarned = Math.max(...days.map((d) => d.earned), dailyLimit, 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 rounded-full border-4 border-coral border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-8">
        <h1 className="font-display font-extrabold text-cream text-3xl">Screen Time ⏱</h1>
        <p className="font-body text-white/50 text-sm mt-1">
          {childName}&apos;s earned play time
        </p>
      </div>

      {/* Today summary */}
      <div
        className="rounded-xl p-5 flex items-center gap-6 mb-6"
        style={{ background: "#1C1917", border: "1px solid rgba(255,255,255,.07)" }}
      >
        <ProgressRing pct={pct} size={90} />
        <div>
          <p className="font-body text-white/40 text-[11px] uppercase tracking-widest mb-1">Today</p>
          <p className="font-display font-extrabold text-cream text-3xl">
            {todayEarned}
            <span className="text-white/40 font-body font-normal text-lg ml-1">min earned</span>
          </p>
          <p className="font-body text-white/40 text-sm mt-0.5">of {dailyLimit}min daily limit</p>
        </div>
      </div>

      {/* 14-day bar chart */}
      <div
        className="rounded-xl p-5 mb-6"
        style={{ background: "#1C1917", border: "1px solid rgba(255,255,255,.07)" }}
      >
        <p className="font-body font-semibold text-cream text-sm mb-4">Last 14 days</p>
        <div className="flex items-end gap-1.5 h-20">
          {days.map((day, i) => {
            const earnedH = (day.earned / maxDayEarned) * 72;
            const limitH = (dailyLimit / maxDayEarned) * 72;
            const isToday = i === 13;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5" title={`${day.label}: ${day.earned}m earned`}>
                <div className="w-full flex items-end gap-0.5" style={{ height: 72 }}>
                  {/* Earned bar */}
                  <div className="flex-1 rounded-sm transition-all" style={{
                    height: Math.max(earnedH, 2),
                    background: isToday ? "#2B7FFF" : "rgba(43,127,255,.5)",
                  }} />
                  {/* Limit bar */}
                  <div className="flex-1 rounded-sm" style={{
                    height: Math.max(limitH, 2),
                    background: "rgba(255,255,255,.08)",
                  }} />
                </div>
                {i % 4 === 0 && (
                  <span className="font-body text-[8px] text-white/25 text-center truncate w-full">
                    {day.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-sky" />
            <span className="font-body text-[10px] text-white/35">Earned</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: "rgba(255,255,255,.12)" }} />
            <span className="font-body text-[10px] text-white/35">Daily limit</span>
          </div>
        </div>
      </div>

      {/* Ratio editor */}
      <div
        className="rounded-xl p-5 mb-6"
        style={{ background: "#1C1917", border: "1px solid rgba(255,255,255,.07)" }}
      >
        <p className="font-body font-semibold text-cream text-sm mb-1">Screen time ratio</p>
        <p className="font-body text-white/40 text-[12px] mb-4">
          For every study session, earn this many minutes of play time (per question correct).
        </p>
        <div className="flex items-center gap-4 mb-4">
          <input
            type="range" min={1} max={5} step={1}
            value={pendingRatio}
            onChange={(e) => setPendingRatio(Number(e.target.value))}
            className="flex-1 accent-coral"
          />
          <span className="font-display font-bold text-coral text-xl w-8 text-center">{pendingRatio}×</span>
        </div>
        {/* Live preview */}
        <div className="flex gap-3 mb-4">
          <div
            className="flex-1 rounded-lg p-3 text-center"
            style={{ background: "rgba(255,77,46,.12)", border: "1px solid rgba(255,77,46,.2)" }}
          >
            <p className="font-body text-[10px] text-coral/70 uppercase tracking-widest mb-0.5">Study</p>
            <p className="font-display font-bold text-coral text-lg">1 session</p>
          </div>
          <div className="flex items-center text-white/30 text-xl">→</div>
          <div
            className="flex-1 rounded-lg p-3 text-center"
            style={{ background: "rgba(43,127,255,.12)", border: "1px solid rgba(43,127,255,.2)" }}
          >
            <p className="font-body text-[10px] text-sky/70 uppercase tracking-widest mb-0.5">Play</p>
            <p className="font-display font-bold text-sky text-lg">{previewLimit}m</p>
          </div>
        </div>
        <button
          onClick={() => void saveRatio()}
          disabled={saving || pendingRatio === ratio}
          className="w-full py-2.5 rounded-xl font-body font-semibold text-sm transition-all disabled:opacity-40"
          style={{ background: "linear-gradient(90deg, #FF4D2E, #FFBE00)", color: "white" }}
        >
          {saving ? "Saving…" : saved ? "✓ Saved!" : "Save new ratio"}
        </button>
      </div>

      {/* Today session breakdown */}
      {todaySessions.length > 0 && (
        <div
          className="rounded-xl p-5"
          style={{ background: "#1C1917", border: "1px solid rgba(255,255,255,.07)" }}
        >
          <p className="font-body font-semibold text-cream text-sm mb-3">Today&apos;s sessions</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="font-body text-[10px] uppercase tracking-widest text-white/30">
                  <th className="pb-2 pr-4">Subject</th>
                  <th className="pb-2 pr-4">Screen time</th>
                  <th className="pb-2 pr-4">Accuracy</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[.04]">
                {todaySessions.map((s) => {
                  const subj = s.subject_id;
                  const acc = s.total_questions > 0
                    ? Math.round((s.correct_answers / s.total_questions) * 100)
                    : 0;
                  return (
                    <tr key={s.id} className="font-body text-[12px]">
                      <td className="py-2.5 pr-4 text-cream capitalize">{subj.replace("-", " ")}</td>
                      <td className="py-2.5 pr-4 text-sky font-semibold">{s.screen_minutes_earned}m</td>
                      <td className="py-2.5 pr-4 text-white/60">{acc}%</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          s.completed_at ? "bg-mint/15 text-mint" : "bg-coral/15 text-coral"
                        }`}>
                          {s.completed_at ? "Done" : "In progress"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
