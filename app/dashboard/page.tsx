import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SUBJECTS } from "@/lib/constants";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { DashboardRealtime } from "@/components/dashboard/DashboardRealtime";
import { InsightsSection } from "./InsightsSection";
import type { AiInsight, StudySession, TopicMastery } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function greeting(name: string) {
  const h = new Date().getHours();
  if (h < 12) return `Good morning, ${name} ☀️`;
  if (h < 17) return `Good afternoon, ${name} 👋`;
  return `Good evening, ${name} 🌙`;
}

function streakMessage(streak: number) {
  if (streak < 3) return "Keep building that habit!";
  if (streak < 7) return "Great consistency this week!";
  return "Incredible — personal best territory!";
}

function todayLabel() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

// ─── Progress ring (small inline SVG) ────────────────────────────────────────

function ProgressRing({ pct }: { pct: number }) {
  const r = 14;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(pct, 100) / 100);
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" className="mt-1">
      <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="4" />
      <circle
        cx="18" cy="18" r={r}
        fill="none"
        stroke="#2B7FFF"
        strokeWidth="4"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 18 18)"
      />
    </svg>
  );
}

// ─── Bar chart ────────────────────────────────────────────────────────────────

function WeeklyBarChart({ sessionsByDay }: { sessionsByDay: number[] }) {
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const todayDow = (new Date().getDay() + 6) % 7; // 0=Mon
  const maxSessions = Math.max(...sessionsByDay, 1);

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: "#1C1917", border: "1px solid rgba(255,255,255,.07)" }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="font-body font-semibold text-cream text-sm">Weekly study activity</p>
          <p className="font-body text-white/40 text-[11px] mt-0.5">Sessions completed · Mon–Sun</p>
        </div>
        <span
          className="font-body text-[11px] text-white/40 px-2.5 py-1 rounded-full"
          style={{ background: "rgba(255,255,255,.06)" }}
        >
          This week
        </span>
      </div>

      {/* Bars */}
      <div className="flex items-end gap-2 h-24">
        {DAYS.map((day, i) => {
          const count = sessionsByDay[i] ?? 0;
          const heightPct = maxSessions > 0 ? (count / maxSessions) * 88 : 0;
          const isToday = i === todayDow;
          const isFuture = i > todayDow;

          return (
            <div key={day} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full flex items-end" style={{ height: 88 }}>
                {isFuture ? (
                  <div
                    className="w-full rounded-md"
                    style={{
                      height: 20,
                      background: "rgba(255,255,255,.04)",
                      border: "1px dashed rgba(255,255,255,.1)",
                    }}
                  />
                ) : (
                  <div
                    className="w-full rounded-md transition-all duration-500"
                    style={{
                      height: Math.max(heightPct, count > 0 ? 8 : 4),
                      background: isToday
                        ? "linear-gradient(to top, #FF4D2E, #FFBE00)"
                        : "linear-gradient(to top, #16A34A, #4ADE80)",
                      opacity: count === 0 ? 0.3 : 1,
                    }}
                  />
                )}
              </div>
              <p
                className="font-body text-[10px] text-center"
                style={{
                  color: isToday ? "#FF4D2E" : "rgba(255,255,255,.35)",
                  fontWeight: isToday ? 700 : 400,
                }}
              >
                {day}
                {isToday && (
                  <span className="block text-[9px] text-coral">← today</span>
                )}
              </p>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3">
        {[
          { color: "linear-gradient(90deg, #16A34A, #4ADE80)", label: "Completed" },
          { color: "linear-gradient(90deg, #FF4D2E, #FFBE00)", label: "Today" },
          { color: "rgba(255,255,255,.1)", label: "Upcoming", dashed: true },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-sm"
              style={{
                background: l.color,
                border: l.dashed ? "1px dashed rgba(255,255,255,.2)" : "none",
              }}
            />
            <span className="font-body text-[10px] text-white/35">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Subject mastery card ─────────────────────────────────────────────────────

const SUBJECT_GRADIENTS: Record<string, string> = {
  english:        "linear-gradient(90deg, #16A34A, #4ADE80)",
  maths:          "linear-gradient(90deg, #2B7FFF, #60A5FA)",
  science:        "linear-gradient(90deg, #7C3AED, #A78BFA)",
  "social-studies": "linear-gradient(90deg, #D97706, #FBBF24)",
};

function SubjectMasteryCard({
  masteryMap,
}: {
  masteryMap: Map<string, { score: number; count: number }>;
}) {
  const lowSubject = SUBJECTS.find(
    (s) => (masteryMap.get(s.id)?.score ?? 0) < 50 && (masteryMap.get(s.id)?.count ?? 0) > 0
  );

  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-4"
      style={{ background: "#1C1917", border: "1px solid rgba(255,255,255,.07)" }}
    >
      <div>
        <p className="font-body font-semibold text-cream text-sm">Subject mastery</p>
        <p className="font-body text-white/40 text-[11px] mt-0.5">Current proficiency by topic</p>
      </div>

      <div className="space-y-3">
        {SUBJECTS.map((subj) => {
          const data = masteryMap.get(subj.id) ?? { score: 0, count: 0 };
          const grad = SUBJECT_GRADIENTS[subj.id] ?? "linear-gradient(90deg, #FF4D2E, #FFBE00)";
          return (
            <div key={subj.id} className="flex items-center gap-3">
              <span className="text-base w-5 text-center">{subj.emoji}</span>
              <span className="font-body text-[12px] text-white/60 w-[72px] truncate">
                {subj.name}
              </span>
              <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,.08)" }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${data.score}%`, background: grad }}
                />
              </div>
              <span className="font-body text-[11px] text-white/50 w-8 text-right">
                {data.score}%
              </span>
            </div>
          );
        })}
      </div>

      {lowSubject && (
        <div
          className="rounded-xl p-3 mt-1"
          style={{ background: "rgba(245,158,11,.08)", border: "1px solid rgba(245,158,11,.2)" }}
        >
          <p className="font-body text-amber-400 text-[12px] leading-snug">
            💡 <strong>{lowSubject.name}</strong> needs attention. One extra session this week could
            make a real difference.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/dashboard");

  const parentName = (user.user_metadata?.full_name as string | null) ?? "there";

  // Child profile
  const { data: child } = await supabase
    .from("children")
    .select("id, full_name, grade, curriculum, screen_time_ratio")
    .eq("parent_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (!child) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-8">
        <p className="font-display font-bold text-cream text-2xl text-center">
          Welcome to Curiova! 👋
        </p>
        <p className="font-body text-white/50 text-center max-w-sm">
          You haven&apos;t set up a child profile yet. Let&apos;s do that now.
        </p>
        <a
          href="/onboarding"
          className="px-6 py-3 rounded-xl font-child font-bold text-white"
          style={{ background: "linear-gradient(90deg, #FF4D2E, #FFBE00)" }}
        >
          Set up child profile →
        </a>
      </div>
    );
  }

  // Date ranges
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  // Parallel fetches
  const [
    { data: thisSessions },
    { data: prevSessions },
    { data: thisResponses },
    { data: prevResponses },
    { data: todaySessions },
    { data: masteryRows },
    { data: streakRow },
    { data: insights },
  ] = await Promise.all([
    supabase
      .from("study_sessions")
      .select("id, subject_id, topic_id, started_at, completed_at, correct_answers, total_questions, xp_earned, screen_minutes_earned")
      .eq("child_id", child.id)
      .gte("started_at", weekStart.toISOString()),
    supabase
      .from("study_sessions")
      .select("id")
      .eq("child_id", child.id)
      .gte("started_at", prevWeekStart.toISOString())
      .lt("started_at", weekStart.toISOString()),
    supabase
      .from("question_responses")
      .select("is_correct, answered_at")
      .eq("child_id", child.id)
      .gte("answered_at", weekStart.toISOString()),
    supabase
      .from("question_responses")
      .select("is_correct")
      .eq("child_id", child.id)
      .gte("answered_at", prevWeekStart.toISOString())
      .lt("answered_at", weekStart.toISOString()),
    supabase
      .from("study_sessions")
      .select("screen_minutes_earned, completed_at")
      .eq("child_id", child.id)
      .gte("started_at", todayStart.toISOString()),
    supabase
      .from("topic_mastery")
      .select("subject_id, topic_id, mastery_score")
      .eq("child_id", child.id),
    supabase
      .from("streaks")
      .select("current_streak, longest_streak")
      .eq("child_id", child.id)
      .maybeSingle(),
    supabase
      .from("ai_insights")
      .select("*")
      .eq("child_id", child.id)
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  // ── Metrics ────────────────────────────────────────────────────────────────

  const sessCount = thisSessions?.length ?? 0;
  const prevSessCount = prevSessions?.length ?? 0;
  const sessDelta = sessCount - prevSessCount;

  const totalResp = thisResponses?.length ?? 0;
  const correctResp = thisResponses?.filter((r: { is_correct: boolean }) => r.is_correct).length ?? 0;
  const accuracy = totalResp > 0 ? Math.round((correctResp / totalResp) * 100) : 0;
  const prevTotal = prevResponses?.length ?? 0;
  const prevCorrect = prevResponses?.filter((r: { is_correct: boolean }) => r.is_correct).length ?? 0;
  const prevAccuracy = prevTotal > 0 ? Math.round((prevCorrect / prevTotal) * 100) : 0;
  const accDelta = accuracy - prevAccuracy;

  const todayScreenMins = (todaySessions ?? [])
    .filter((s: { completed_at: string | null }) => s.completed_at)
    .reduce((sum: number, s: { screen_minutes_earned: number }) => sum + (s.screen_minutes_earned ?? 0), 0);
  const dailyLimit = child.screen_time_ratio * 15;

  const currentStreak = streakRow?.current_streak ?? 0;
  const longestStreak = streakRow?.longest_streak ?? 0;

  // ── Subject mastery map ───────────────────────────────────────────────────

  const masteryBySubject = new Map<string, { score: number; count: number }>();
  for (const subj of SUBJECTS) {
    const rows = (masteryRows ?? []).filter(
      (m: { subject_id: string }) => m.subject_id === subj.id
    );
    const avg =
      rows.length > 0
        ? Math.round(
            rows.reduce((s: number, m: { mastery_score: number }) => s + (m.mastery_score ?? 0), 0) /
              rows.length
          )
        : 0;
    masteryBySubject.set(subj.id, { score: avg, count: rows.length });
  }

  // ── Weekly bar chart data (Mon–Sun of current week) ───────────────────────

  const mondayThisWeek = new Date(now);
  const dow = (now.getDay() + 6) % 7; // 0=Mon
  mondayThisWeek.setDate(now.getDate() - dow);
  mondayThisWeek.setHours(0, 0, 0, 0);

  const sessionsByDay: number[] = Array(7).fill(0);
  for (const s of thisSessions ?? []) {
    const sDate = new Date((s as StudySession).started_at);
    const dayIdx = Math.floor(
      (sDate.getTime() - mondayThisWeek.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (dayIdx >= 0 && dayIdx < 7) sessionsByDay[dayIdx]++;
  }

  const masteryRows2 = masteryRows as TopicMastery[] | null;
  void masteryRows2; // used via masteryBySubject

  return (
    <div className="p-6 max-w-6xl">
      <DashboardRealtime childId={child.id} childName={child.full_name} />

      {/* Top bar */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display font-extrabold text-cream text-2xl leading-tight">
            {greeting(parentName)}
          </h1>
          <p className="font-body text-white/50 text-sm mt-1">
            {child.full_name} is on a {currentStreak}-day streak —{" "}
            {streakMessage(currentStreak)}
          </p>
        </div>
        <span
          className="font-body text-[12px] text-cream px-3 py-1.5 rounded-full flex-shrink-0"
          style={{ background: "rgba(245,241,234,.1)", border: "1px solid rgba(245,241,234,.12)" }}
        >
          {todayLabel()}
        </span>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <MetricCard
          icon="📚"
          label="Sessions this week"
          value={sessCount}
          subtext="/ 7 target"
          delta={sessDelta !== 0 ? `${Math.abs(sessDelta)} from last week` : undefined}
          deltaDirection={sessDelta > 0 ? "up" : sessDelta < 0 ? "down" : "neutral"}
        />
        <MetricCard
          icon="🎯"
          label="Accuracy"
          value={totalResp > 0 ? `${accuracy}%` : "—"}
          subtext={totalResp > 0 ? `${correctResp}/${totalResp} correct` : "No sessions yet"}
          delta={accDelta !== 0 && prevTotal > 0 ? `${Math.abs(accDelta)}% vs last week` : undefined}
          deltaDirection={accDelta > 0 ? "up" : accDelta < 0 ? "down" : "neutral"}
        />
        <MetricCard
          icon="🎮"
          label="Screen time earned today"
          value={`${todayScreenMins}m`}
          subtext={`of ${dailyLimit}m daily limit`}
        >
          <ProgressRing pct={dailyLimit > 0 ? (todayScreenMins / dailyLimit) * 100 : 0} />
        </MetricCard>
        <MetricCard
          icon="🔥"
          label="Learning streak"
          value={currentStreak}
          unit="days"
          delta={
            currentStreak === longestStreak && currentStreak > 0
              ? "Personal best!"
              : longestStreak > 0
              ? `Best: ${longestStreak} days`
              : undefined
          }
          deltaDirection={currentStreak === longestStreak && currentStreak > 0 ? "up" : "neutral"}
        />
      </div>

      {/* Chart + mastery row */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4 mb-6">
        <WeeklyBarChart sessionsByDay={sessionsByDay} />
        <SubjectMasteryCard masteryMap={masteryBySubject} />
      </div>

      {/* Insights */}
      <InsightsSection
        initialInsights={(insights as AiInsight[]) ?? []}
        childId={child.id}
        childName={child.full_name}
      />
    </div>
  );
}
