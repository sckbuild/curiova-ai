"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SUBJECTS } from "@/lib/constants";
import type { ChildProfile, Quest, QuestStatus } from "@/types/learning";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// ─── Quest Card ───────────────────────────────────────────────────────────────

function QuestCard({ quest, index }: { quest: Quest; index: number }) {
  const isDone = quest.status === "done";
  const isActive = quest.status === "active" || quest.status === "available";
  const isLocked = quest.status === "locked";
  const href = `/learn/${quest.subject}/${quest.topicId}`;

  const cardCls = [
    "rounded-xl p-5 border-2 transition-all duration-200 flex flex-col gap-4 relative",
    isDone ? "border-mint/40 bg-mint/8" : "",
    isActive ? "border-coral/40 bg-white hover:border-coral hover:-translate-y-1 hover:shadow-md cursor-pointer" : "",
    isLocked ? "border-ink/8 bg-white/60 opacity-50 cursor-not-allowed" : "",
  ].join(" ");

  const inner = (
    <div className={cardCls}>
      {isDone && (
        <span className="absolute top-3 right-3 w-7 h-7 rounded-full bg-mint flex items-center justify-center text-white text-xs font-bold">
          ✓
        </span>
      )}
      {isLocked && (
        <span className="absolute top-3 right-3 text-lg">🔒</span>
      )}

      <div className="flex items-center gap-3">
        <span className="text-3xl">{quest.subjectEmoji}</span>
        <div>
          <p className="font-body text-xs uppercase tracking-widest text-muted font-semibold">
            {quest.subject}
          </p>
          <p className="font-display font-bold text-ink text-lg leading-tight">
            {quest.topic}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="font-body text-xs text-muted">Progress</span>
          <span className="font-body text-xs font-medium text-ink">
            {quest.questionsCompleted}/10
          </span>
        </div>
        <div className="h-2 bg-ink/8 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isDone ? "bg-mint" : "bg-coral"
            }`}
            style={{ width: `${(quest.questionsCompleted / 10) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span
          className={`text-xs font-body font-semibold px-2.5 py-1 rounded-full ${
            isDone
              ? "bg-mint/20 text-mint"
              : isActive
              ? "bg-coral/15 text-coral"
              : "bg-ink/8 text-muted"
          }`}
        >
          {isDone ? `✦ Mastery ${Math.round(quest.masteryScore)}%` : isActive ? "⚡ Active quest" : quest.lockReason ?? "🔒 Locked"}
        </span>
        {isActive && (
          <span className="font-body text-xs text-muted">+100 XP →</span>
        )}
      </div>
    </div>
  );

  if (isActive) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE, delay: index * 0.08 }}
      >
        <Link href={href}>{inner}</Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE, delay: index * 0.08 }}
    >
      {inner}
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LearnPage() {
  const router = useRouter();
  const [child, setChild] = useState<ChildProfile | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [streak, setStreak] = useState(0);
  const [freezeAvailable, setFreezeAvailable] = useState(false);
  const [freezeUsing, setFreezeUsing] = useState(false);
  const [xpToday, setXpToday] = useState(0);
  const [screenEarned, setScreenEarned] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth/login"); return; }

    // Try to get child profile (this user IS the child, or fetch first child of parent)
    const { data: childRow } = await supabase
      .from("children")
      .select("*")
      .or(`id.eq.${user.id},parent_id.eq.${user.id}`)
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (!childRow) {
      // No child profile yet — redirect to onboarding
      router.push("/onboarding");
      return;
    }

    setChild(childRow as ChildProfile);

    // Fetch streak and freeze status
    const { data: streakRow } = await supabase
      .from("streaks")
      .select("current_streak, freeze_used_at")
      .eq("child_id", childRow.id)
      .maybeSingle();
    const currentStreak = (streakRow as { current_streak?: number } | null)?.current_streak ?? 0;
    setStreak(currentStreak);

    // Freeze is available if streak > 0, no session done today, and freeze not used in last 7 days
    const freezeUsedAt = (streakRow as { freeze_used_at?: string | null } | null)?.freeze_used_at;
    const freezeRecent = freezeUsedAt
      ? (Date.now() - new Date(freezeUsedAt).getTime()) < 7 * 24 * 60 * 60 * 1000
      : false;
    setFreezeAvailable(currentStreak > 0 && !freezeRecent);

    // Fetch today's sessions
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { data: sessions } = await supabase
      .from("study_sessions")
      .select("*")
      .eq("child_id", childRow.id)
      .gte("started_at", todayStart.toISOString());

    const todaySessions = sessions ?? [];
    const todayXp = todaySessions.reduce((s: number, sess: { xp_earned: number }) => s + (sess.xp_earned ?? 0), 0);
    const todayScreen = todaySessions.reduce((s: number, sess: { screen_minutes_earned: number }) => s + (sess.screen_minutes_earned ?? 0), 0);
    setXpToday(todayXp);
    setScreenEarned(todayScreen);

    // Fetch topic mastery
    const { data: mastery } = await supabase
      .from("topic_mastery")
      .select("*")
      .eq("child_id", childRow.id);
    const masteryMap = new Map((mastery ?? []).map((m: { topic_id: string; mastery_score: number }) => [m.topic_id, m.mastery_score ?? 0]));

    // Build quests from SUBJECTS — one topic per subject, the first incomplete one
    const built: Quest[] = SUBJECTS.map((subj, si) => {
      const topic = subj.topics[0]; // start with first topic
      const masteryScore = masteryMap.get(topic.id) ?? 0;
      const sessionForTopic = todaySessions.find((s: { topic_id: string; completed_at: string | null }) => s.topic_id === topic.id);

      let status: QuestStatus = "available";
      let questionsCompleted = 0;

      if (sessionForTopic?.completed_at) {
        status = "done";
        questionsCompleted = 10;
      } else if (sessionForTopic) {
        status = "active";
        questionsCompleted = 5;
      } else if (si > 0) {
        // Lock if previous subject not done today
        const prevTopic = SUBJECTS[si - 1].topics[0];
        const prevDone = todaySessions.some((s: { topic_id: string; completed_at: string | null }) => s.topic_id === prevTopic.id && s.completed_at);
        if (!prevDone) {
          status = "locked";
        }
      }

      return {
        subject: subj.name,
        subjectEmoji: subj.emoji,
        topic: topic.name,
        topicId: topic.id,
        status,
        questionsCompleted,
        masteryScore,
        lockReason: status === "locked" ? `🔒 Unlock after ${SUBJECTS[si - 1].name}` : undefined,
      };
    });

    setQuests(built);
    setLoading(false);
  }, [router]);

  const applyFreeze = useCallback(async () => {
    if (!child || freezeUsing || !freezeAvailable) return;
    setFreezeUsing(true);
    try {
      const supabase = createClient();
      await supabase
        .from("streaks")
        .update({ freeze_used_at: new Date().toISOString() })
        .eq("child_id", child.id);
      setFreezeAvailable(false);
    } finally {
      setFreezeUsing(false);
    }
  }, [child, freezeUsing, freezeAvailable]);

  useEffect(() => {
    void fetchData();
    const interval = setInterval(() => void fetchData(), 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-coral border-t-transparent animate-spin" />
          <p className="font-body text-muted text-sm">Loading your quests…</p>
        </div>
      </div>
    );
  }

  const doneCount = quests.filter((q) => q.status === "done").length;
  // Daily screen time target: sessions_per_day × 15 min base × ratio
  const screenTarget = Math.max((child?.sessions_per_day ?? quests.length) * 15 * (child?.screen_time_ratio ?? 1), 15);

  return (
    <div className="min-h-screen bg-cream pb-16">
      {/* Mission hero */}
      <div
        className="px-6 pt-16 pb-8"
        style={{ background: "linear-gradient(135deg, #FF4D2E 0%, #FFBE00 100%)" }}
      >
        <div className="max-w-lg mx-auto">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="font-body text-white/70 text-sm font-medium">Ready to level up? 👋</p>
              <h1 className="font-display font-bold text-white text-3xl mt-1 leading-tight">
                {child?.full_name ?? "Explorer"}
              </h1>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5">
              <span>🔥</span>
              <span className="font-display font-bold text-white text-sm">{streak}</span>
              <span className="font-body text-white/70 text-xs">day streak</span>
            </div>
          </div>

          {/* Quest progress bar */}
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="font-body text-white/70 text-xs">Quests today</span>
              <span className="font-body text-white font-semibold text-xs">{doneCount}/{quests.length}</span>
            </div>
            <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(doneCount / quests.length) * 100}%` }}
                transition={{ duration: 0.8, ease: EASE }}
              />
            </div>
          </div>

          {/* Streak freeze banner — only when no session done yet and freeze available */}
          {freezeAvailable && doneCount === 0 && streak > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-3 rounded-xl px-4 py-3 flex items-center justify-between gap-3"
              style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">🧊</span>
                <div>
                  <p className="font-body font-semibold text-white text-xs">Streak freeze available</p>
                  <p className="font-body text-white/70 text-[11px]">Protect your {streak}-day streak if you can&apos;t study today</p>
                </div>
              </div>
              <button
                onClick={() => void applyFreeze()}
                disabled={freezeUsing}
                className="font-body font-bold text-xs px-3 py-1.5 rounded-lg bg-white text-coral shrink-0 disabled:opacity-50"
              >
                {freezeUsing ? "Saving…" : "Use freeze"}
              </button>
            </motion.div>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 -mt-4">
        {/* Screen time card */}
        <div className="bg-sky rounded-xl p-4 mb-6 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span>🎮</span>
              <span className="font-body font-semibold text-white text-sm">Play time unlocked today</span>
            </div>
            <span className="font-display font-bold text-white text-lg">{screenEarned}m</span>
          </div>
          <div className="h-2 bg-white/25 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((screenEarned / screenTarget) * 100, 100)}%` }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.2 }}
            />
          </div>
        </div>

        {/* Quest grid */}
        <div className="flex flex-col gap-3">
          {quests.map((q, i) => (
            <QuestCard key={q.topicId} quest={q} index={i} />
          ))}
        </div>

        {/* XP today */}
        {xpToday > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 text-center"
          >
            <span className="font-body text-sm text-muted">
              ✨ {xpToday} XP earned today — you&apos;re on a roll!
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
