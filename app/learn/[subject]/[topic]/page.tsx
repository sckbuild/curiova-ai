"use client";

import { useReducer, useEffect, useRef, useCallback, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { SUBJECTS, SESSION_QUESTION_COUNT, TIMER_SECONDS, XP_PER_CORRECT, XP_BONUS_THRESHOLD, XP_BONUS_AMOUNT } from "@/lib/constants";
import { DifficultyBadge } from "@/components/child/DifficultyBadge";
import { TimerBadge } from "@/components/child/TimerBadge";
import { QuestionCard } from "@/components/child/QuestionCard";
import { ExplanationPanel } from "@/components/child/ExplanationPanel";
import { MicroPuzzle } from "@/components/child/MicroPuzzle";
import type {
  SessionState, SessionAction, Question,
  ChildProfile, ObjectiveQuestion, FillBlankQuestion, MicroPuzzleQuestion,
} from "@/types/learning";

// ─── Constants ────────────────────────────────────────────────────────────────

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// ─── Reducer ──────────────────────────────────────────────────────────────────

const INIT_STATE: SessionState = {
  phase: "loading",
  currentQuestionNum: 1,
  difficulty: 2,
  recentAnswers: [],
  sessionId: "",
  xpEarned: 0,
  screenTimeEarned: 0,
  currentQuestion: null,
  selectedAnswer: null,
  isCorrect: null,
  score: null,
  explanation: null,
  hint: null,
  hintVisible: false,
  levelChangeMessage: null,
  levelChangeDirection: null,
  newDifficulty: null,
  timeLeft: TIMER_SECONDS,
  timerActive: false,
  recentQuestionTexts: [],
  error: null,
};

function reducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case "INIT":
      return {
        ...state,
        sessionId: action.sessionId,
        difficulty: action.difficulty,
        phase: "loading",
      };

    case "SET_QUESTION": {
      const phase = action.question.type === "micro_puzzle" ? "puzzle" : "question";
      return {
        ...state,
        phase,
        currentQuestion: action.question,
        selectedAnswer: null,
        isCorrect: null,
        score: null,
        explanation: null,
        hint: null,
        hintVisible: false,
        timeLeft: TIMER_SECONDS,
        timerActive: phase === "question",
        error: null,
        recentQuestionTexts: action.question.type !== "micro_puzzle"
          ? [...state.recentQuestionTexts.slice(-5), action.question.question_text]
          : state.recentQuestionTexts,
      };
    }

    case "SHOW_HINT":
      return { ...state, hintVisible: true };

    case "SELECT_ANSWER":
      if (state.phase !== "question") return state;
      return { ...state, selectedAnswer: action.answer };

    case "SUBMIT_RESULT":
      return {
        ...state,
        phase: "explanation",
        isCorrect: action.isCorrect,
        score: action.score,
        explanation: action.explanation,
        hint: action.hint,
        timerActive: false,
        recentAnswers: [...state.recentAnswers, action.isCorrect],
        xpEarned: state.xpEarned + action.xpDelta,
      };

    case "SHOW_LEVEL_CHANGE":
      return {
        ...state,
        phase: "level_change",
        levelChangeMessage: action.message,
        levelChangeDirection: action.direction,
        newDifficulty: action.newDifficulty,
        difficulty: action.newDifficulty,
      };

    case "NEXT_QUESTION": {
      const next = state.currentQuestionNum + 1;
      if (next > SESSION_QUESTION_COUNT) {
        return { ...state, phase: "complete" };
      }
      return {
        ...state,
        phase: "loading",
        currentQuestionNum: next,
        selectedAnswer: null,
        isCorrect: null,
        score: null,
        explanation: null,
        hint: null,
        hintVisible: false,
        levelChangeMessage: null,
        levelChangeDirection: null,
        newDifficulty: null,
        currentQuestion: null,
        timerActive: false,
      };
    }

    case "COMPLETE":
      return { ...state, phase: "complete" };

    case "TICK":
      if (!state.timerActive || state.timeLeft <= 0) return state;
      return { ...state, timeLeft: state.timeLeft - 1 };

    case "TIMEOUT":
      return {
        ...state,
        phase: "explanation",
        isCorrect: false,
        score: 0,
        explanation: "Time's up — don't worry, you'll get it next time! 🌟",
        hint: null,
        timerActive: false,
        recentAnswers: [...state.recentAnswers, false],
      };

    case "SET_ERROR":
      return { ...state, phase: "question", error: action.error };

    default:
      return state;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSubjectInfo(subjectId: string) {
  return SUBJECTS.find((s) => s.id === subjectId) ?? SUBJECTS[0];
}

function getTopicName(subjectId: string, topicId: string): string {
  const subj = getSubjectInfo(subjectId);
  const topic = subj.topics.find((t) => t.id === topicId);
  return topic?.name ?? topicId;
}

// ─── Top bar ──────────────────────────────────────────────────────────────────

function TopBar({
  state, subjectId, topicId, child, onBack,
}: {
  state: SessionState;
  subjectId: string;
  topicId: string;
  child: ChildProfile | null;
  onBack: () => void;
}) {
  const subj = getSubjectInfo(subjectId);
  const done = state.currentQuestionNum - 1;
  const pct = Math.round((done / SESSION_QUESTION_COUNT) * 100);

  return (
    <div className="bg-white border-b border-ink/8 px-4 py-3 flex flex-col gap-2 sticky top-0 z-20">
      {/* Row 1: back + progress + difficulty + timer */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-muted hover:text-ink transition-colors p-1 -ml-1"
          aria-label="Leave quest"
        >
          ←
        </button>

        <div className="flex-1 relative">
          <div className="h-2.5 bg-ink/8 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #FF4D2E, #FFBE00)" }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.4, ease: EASE }}
            />
          </div>
          <span className="absolute right-0 -top-5 font-body text-[11px] text-muted">
            {done}/{SESSION_QUESTION_COUNT}
          </span>
        </div>

        <DifficultyBadge
          level={state.difficulty as 1 | 2 | 3 | 4 | 5}
          animate={!!state.levelChangeDirection}
          size="sm"
        />

        {state.phase === "question" && (
          <TimerBadge
            seconds={state.timeLeft}
            onExpire={() => {}}
            active={state.timerActive}
          />
        )}
      </div>

      {/* Row 2: subject pill */}
      <div className="flex items-center gap-2">
        <span className="font-body text-[11px] text-muted uppercase tracking-widest">
          {subj.emoji} {subj.name} · Grade {child?.grade ?? "?"} · {child?.curriculum ?? "CBSE"}
          {" · "}{getTopicName(subjectId, topicId)}
        </span>
      </div>
    </div>
  );
}

// ─── Rubric strip ─────────────────────────────────────────────────────────────

function RubricStrip() {
  return (
    <div className="rounded-xl bg-grape/6 border border-grape/25 p-4">
      <p className="font-body text-xs text-grape font-semibold mb-3">📋 How Curiova scores this</p>
      <div className="grid grid-cols-3 gap-2">
        {[
          { score: 3, color: "bg-mint/15 text-mint", label: "✓ Perfect — full stars!" },
          { score: 2, color: "bg-sun/15 text-[#b38600]", label: "Good thinking, tiny slip" },
          { score: 1, color: "bg-coral/15 text-coral", label: "Keep going — you're close!" },
        ].map((r) => (
          <div key={r.score} className={`rounded-lg p-2.5 text-center ${r.color}`}>
            <p className="font-display font-bold text-xl mb-0.5">{r.score}</p>
            <p className="font-body text-[10px] leading-tight">{r.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Level change toast ───────────────────────────────────────────────────────

function LevelChangeToast({ state, onDone }: { state: SessionState; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [onDone]);

  const isUp = state.levelChangeDirection === "up";
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: EASE }}
      className="fixed inset-0 z-40 flex items-center justify-center p-6"
      style={{ background: "rgba(10,9,8,0.8)" }}
    >
      <div className="bg-[#1C1917] rounded-2xl p-8 max-w-sm w-full text-center shadow-xl border border-white/10">
        <div className="text-5xl mb-3">{isUp ? "🚀" : "🌱"}</div>
        <p
          className={`font-display font-bold text-2xl mb-2 ${isUp ? "text-coral" : "text-mint"}`}
        >
          {state.levelChangeMessage}
        </p>
        {state.newDifficulty && (
          <div className="flex justify-center mt-3">
            <DifficultyBadge level={state.newDifficulty as 1 | 2 | 3 | 4 | 5} animate />
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Session complete redirect ────────────────────────────────────────────────

function CompletingScreen() {
  return (
    <div className="min-h-screen bg-ink flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 rounded-full border-4 border-coral border-t-transparent animate-spin" />
      <p className="font-body text-white/60 text-sm">Calculating your results…</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function QuestionSessionPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params.subject as string;
  const topicId = params.topic as string;

  const [state, dispatch] = useReducer(reducer, INIT_STATE);
  const [child, setChild] = useState<ChildProfile | null>(null);
  const childRef = useRef<ChildProfile | null>(null);
  const questionCacheRef = useRef<Map<number, Question>>(new Map());

  // ─── Timer tick ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!state.timerActive) return;
    const t = setInterval(() => dispatch({ type: "TICK" }), 1000);
    return () => clearInterval(t);
  }, [state.timerActive]);

  // ─── Auto-submit on timeout ──────────────────────────────────────────────
  useEffect(() => {
    if (state.phase === "question" && state.timeLeft <= 0 && state.timerActive) {
      dispatch({ type: "TIMEOUT" });
    }
  }, [state.timeLeft, state.phase, state.timerActive]);

  // ─── Clear prefetch cache when difficulty changes ─────────────────────────
  useEffect(() => {
    questionCacheRef.current.clear();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.difficulty]);

  // ─── Load question when phase=loading ────────────────────────────────────
  useEffect(() => {
    if (state.phase === "loading" && state.sessionId) {
      void loadQuestion();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.sessionId, state.currentQuestionNum]);

  // ─── Complete session when phase=complete ─────────────────────────────────
  useEffect(() => {
    if (state.phase === "complete" && state.sessionId) {
      void completeSession();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  // ─── Initialise on mount ─────────────────────────────────────────────────
  useEffect(() => {
    void initSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function initSession() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth/login"); return; }

    // Get child profile
    const { data: childRow } = await supabase
      .from("children")
      .select("*")
      .or(`id.eq.${user.id},parent_id.eq.${user.id}`)
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (!childRow) { router.push("/onboarding"); return; }

    const cp = childRow as ChildProfile;
    setChild(cp);
    childRef.current = cp;

    // Get topic difficulty from mastery
    const { data: mastery } = await supabase
      .from("topic_mastery")
      .select("current_difficulty")
      .eq("child_id", cp.id)
      .eq("topic_id", topicId)
      .single();

    const difficulty = (mastery as { current_difficulty?: number } | null)?.current_difficulty ?? cp.current_difficulty ?? 2;

    // Create study session — retry up to 3× with backoff so temp IDs are a last resort
    const sessionStartedAt = new Date().toISOString();
    let sessionId = `temp-${Date.now()}`;
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data: sess } = await supabase.from("study_sessions").insert({
        child_id: cp.id,
        subject_id: subjectId,
        topic_id: topicId,
        started_at: sessionStartedAt,
        difficulty_start: difficulty,
      }).select("id").single();
      if (sess?.id) { sessionId = sess.id; break; }
      if (attempt < 2) await new Promise<void>((r) => setTimeout(r, 400 * (attempt + 1)));
    }

    dispatch({ type: "INIT", sessionId, difficulty });
  }

  async function fetchQuestion(
    questionNum: number,
    cp: ChildProfile,
    difficulty: number,
    sessionId: string,
    recentTexts: string[]
  ): Promise<Question> {
    const res = await fetch("/api/generate-question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: subjectId,
        topic: topicId,
        grade: cp.grade,
        curriculum: cp.curriculum,
        difficulty_level: difficulty,
        age: cp.age ?? 12,
        language: "English",
        question_number: questionNum,
        session_id: sessionId,
        recent_question_texts: recentTexts,
      }),
    });
    return (await res.json()) as Question;
  }

  async function prefetch(questionNum: number, cp: ChildProfile, difficulty: number, sessionId: string, recentTexts: string[]) {
    if (questionNum > SESSION_QUESTION_COUNT) return;
    if (questionCacheRef.current.has(questionNum)) return;
    try {
      const q = await fetchQuestion(questionNum, cp, difficulty, sessionId, recentTexts);
      // Only cache if difficulty hasn't changed while we were fetching
      if (!questionCacheRef.current.has(questionNum)) {
        questionCacheRef.current.set(questionNum, q);
      }
    } catch { /* silently fail — main loadQuestion will fetch if cache misses */ }
  }

  async function loadQuestion() {
    const cp = childRef.current ?? child;
    if (!cp) return;

    // Serve from prefetch cache if available (eliminates spinner for pre-fetched questions)
    const cached = questionCacheRef.current.get(state.currentQuestionNum);
    if (cached) {
      questionCacheRef.current.delete(state.currentQuestionNum);
      dispatch({ type: "SET_QUESTION", question: cached });
      void prefetch(state.currentQuestionNum + 1, cp, state.difficulty, state.sessionId, state.recentQuestionTexts);
      return;
    }

    try {
      const q = await fetchQuestion(state.currentQuestionNum, cp, state.difficulty, state.sessionId, state.recentQuestionTexts);
      dispatch({ type: "SET_QUESTION", question: q });
      // Pre-fetch next question while child reads the current one
      void prefetch(state.currentQuestionNum + 1, cp, state.difficulty, state.sessionId, state.recentQuestionTexts);
    } catch {
      dispatch({ type: "SET_ERROR", error: "Failed to load question. Please try again." });
    }
  }

  const handleSubmitAnswer = useCallback(
    async (autoAnswer?: string | null) => {
      const q = state.currentQuestion;
      if (!q || q.type === "micro_puzzle") return;
      const answer = autoAnswer !== undefined ? autoAnswer : state.selectedAnswer;
      if (answer === null) return;

      const cp = childRef.current ?? child;

      let isCorrect = false;
      let score = 0;
      let explanation = "";
      let hint: string | null = null;

      if (q.type === "objective") {
        const oq = q as ObjectiveQuestion;
        isCorrect = answer === oq.correct_key;
        score = isCorrect ? 3 : 0;
        explanation = oq.explanation;
      } else if (q.type === "fill_blank") {
        const fq = q as FillBlankQuestion;
        try {
          const res = await fetch("/api/grade-answer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              question_text: fq.question_text,
              correct_answer: fq.correct_answer,
              acceptable_answers: fq.acceptable_answers,
              child_answer: answer ?? "",
              age: cp?.age ?? 12,
              difficulty_level: state.difficulty,
            }),
          });
          const g = await res.json();
          isCorrect = g.is_correct ?? false;
          score = g.score ?? 0;
          explanation = g.explanation ?? fq.explanation;
          hint = g.hint ?? null;
        } catch {
          isCorrect = false;
          score = 0;
          explanation = fq.explanation;
        }
      }

      const xpDelta = isCorrect ? XP_PER_CORRECT : 0;
      dispatch({ type: "SUBMIT_RESULT", isCorrect, score, explanation, hint, xpDelta });

      // Save response to DB (fire and forget)
      if (cp && state.sessionId) {
        const supabase = createClient();
        void supabase.from("question_responses").insert({
          session_id: state.sessionId,
          child_id: cp.id,
          question_id: `${state.sessionId}-q${state.currentQuestionNum}`,
          question_type: q.type,
          selected_option: q.type === "objective" ? answer : null,
          fill_answer: q.type === "fill_blank" ? answer : null,
          is_correct: isCorrect,
          time_taken_seconds: TIMER_SECONDS - state.timeLeft,
          difficulty_level: state.difficulty,
          answered_at: new Date().toISOString(),
        });
      }
    },
    [state, child]
  );

  const handlePuzzleComplete = useCallback(
    (isCorrect: boolean) => {
      const xpDelta = isCorrect ? 30 : 10;
      // Add XP and correct answer to state, then advance directly — no explanation phase for puzzles
      dispatch({
        type: "SUBMIT_RESULT",
        isCorrect,
        score: isCorrect ? 3 : 1,
        explanation: "",
        hint: null,
        xpDelta,
      });
      setTimeout(() => dispatch({ type: "NEXT_QUESTION" }), 400);
    },
    []
  );

  const handleNext = useCallback(async () => {
    // Check adaptive difficulty after submitting
    const recentWithCurrent = [...state.recentAnswers];
    try {
      const cp = childRef.current ?? child;
      const res = await fetch("/api/adaptive-difficulty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recent_answers: recentWithCurrent,
          current_difficulty: state.difficulty,
          child_id: cp?.id ?? "",
          subject: subjectId,
          topic: topicId,
        }),
      });
      const ar = await res.json();
      if (ar.direction !== "hold" && ar.message) {
        dispatch({
          type: "SHOW_LEVEL_CHANGE",
          message: ar.message,
          direction: ar.direction,
          newDifficulty: ar.new_difficulty,
        });
        return; // Toast will call dispatch NEXT_QUESTION after 2.5s
      }
    } catch {
      // ignore
    }
    dispatch({ type: "NEXT_QUESTION" });
  }, [state.recentAnswers, state.difficulty, child, subjectId, topicId]);

  async function completeSession() {
    const cp = childRef.current ?? child;
    if (!cp || !state.sessionId) return;

    const correctCount = state.recentAnswers.filter(Boolean).length;
    const bonus = correctCount >= XP_BONUS_THRESHOLD ? XP_BONUS_AMOUNT : 0;
    const totalXp = state.xpEarned + bonus;
    const screenMins = Math.floor((correctCount / SESSION_QUESTION_COUNT) * 15 * cp.screen_time_ratio);
    const completedAt = new Date().toISOString();

    const supabase = createClient();

    let finalSessionId = state.sessionId;

    // If session never made it to DB (all 3 inserts failed at init), try one last retroactive save
    if (state.sessionId.startsWith("temp-")) {
      const startedAt = new Date(parseInt(state.sessionId.replace("temp-", ""), 10)).toISOString();
      const { data: retried } = await supabase.from("study_sessions").insert({
        child_id: cp.id,
        subject_id: subjectId,
        topic_id: topicId,
        started_at: startedAt,
        difficulty_start: state.difficulty,
        completed_at: completedAt,
        total_questions: SESSION_QUESTION_COUNT,
        correct_answers: correctCount,
        xp_earned: totalXp,
        difficulty_end: state.difficulty,
        screen_minutes_earned: screenMins,
      }).select("id").single();

      if (retried?.id) {
        finalSessionId = retried.id;
      } else {
        // Truly offline — still update mastery and redirect home without complete page
        try {
          const recentScore = (correctCount / SESSION_QUESTION_COUNT) * 100;
          const { data: existing } = await supabase
            .from("topic_mastery")
            .select("mastery_score, sessions_count")
            .eq("child_id", cp.id).eq("topic_id", topicId).single();
          const existingRecord = existing as { mastery_score?: number; sessions_count?: number } | null;
          const newScore = existingRecord?.mastery_score
            ? recentScore * 0.6 + existingRecord.mastery_score * 0.4
            : recentScore;
          await supabase.from("topic_mastery").upsert({
            child_id: cp.id, subject_id: subjectId, topic_id: topicId,
            mastery_score: Math.round(newScore),
            sessions_count: (existingRecord?.sessions_count ?? 0) + 1,
            is_mastered: newScore >= 80,
            last_studied_at: completedAt, updated_at: completedAt,
          }, { onConflict: "child_id,subject_id,topic_id" });
        } catch { /* non-fatal */ }
        router.push("/learn");
        return;
      }
    }

    // Update study session record (normal path — session already exists)
    if (!state.sessionId.startsWith("temp-")) {
      try {
        await supabase.from("study_sessions").update({
          completed_at: completedAt,
          total_questions: SESSION_QUESTION_COUNT,
          correct_answers: correctCount,
          xp_earned: totalXp,
          difficulty_end: state.difficulty,
          screen_minutes_earned: screenMins,
        }).eq("id", finalSessionId);
      } catch {
        // Non-fatal
      }
    }

    // Update topic mastery
    try {
      const recentScore = (correctCount / SESSION_QUESTION_COUNT) * 100;
      const { data: existing } = await supabase
        .from("topic_mastery")
        .select("mastery_score, sessions_count")
        .eq("child_id", cp.id)
        .eq("topic_id", topicId)
        .single();

      const existingRecord = existing as { mastery_score?: number; sessions_count?: number } | null;
      const existingScore = existingRecord?.mastery_score ?? 0;
      const existingSessions = existingRecord?.sessions_count ?? 0;
      const newScore = existingScore
        ? recentScore * 0.6 + existingScore * 0.4
        : recentScore;

      await supabase.from("topic_mastery").upsert({
        child_id: cp.id,
        subject_id: subjectId,
        topic_id: topicId,
        mastery_score: Math.round(newScore),
        sessions_count: existingSessions + 1,
        is_mastered: newScore >= 80,
        last_studied_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "child_id,subject_id,topic_id" });
    } catch {
      // Non-fatal
    }

    router.push(`/learn/complete/${finalSessionId}`);
  }

  function handleLeave() {
    if (confirm("Leave this quest? Your progress so far will be saved.")) {
      router.push("/learn");
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  if (state.phase === "complete") return <CompletingScreen />;

  const q = state.currentQuestion;

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <TopBar state={state} subjectId={subjectId} topicId={topicId} child={child} onBack={handleLeave} />

      {/* Puzzle overlay */}
      {state.phase === "puzzle" && q?.type === "micro_puzzle" && (
        <MicroPuzzle
          puzzle={q as MicroPuzzleQuestion}
          onComplete={handlePuzzleComplete}
        />
      )}

      {/* Level change toast */}
      <AnimatePresence>
        {state.phase === "level_change" && (
          <LevelChangeToast
            state={state}
            onDone={() => dispatch({ type: "NEXT_QUESTION" })}
          />
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-6 flex flex-col gap-4">
        {/* Loading */}
        {state.phase === "loading" && (
          <div className="flex flex-col items-center gap-4 py-20">
            <div className="w-10 h-10 rounded-full border-4 border-coral border-t-transparent animate-spin" />
            <p className="font-body text-muted text-sm">Getting your next question…</p>
          </div>
        )}

        {/* Error */}
        {state.error && (
          <div className="bg-rose/10 border border-rose/30 rounded-xl p-4 text-center">
            <p className="font-body text-rose text-sm mb-3">{state.error}</p>
            <button
              onClick={() => void loadQuestion()}
              className="font-body text-sm font-semibold text-coral hover:underline"
            >
              Try again →
            </button>
          </div>
        )}

        {/* Question */}
        {(state.phase === "question" || state.phase === "submitted" || state.phase === "explanation") && q && q.type !== "micro_puzzle" && (
          <>
            <AnimatePresence mode="wait">
              <motion.div
                key={state.currentQuestionNum}
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -30, opacity: 0 }}
                transition={{ duration: 0.28, ease: EASE }}
              >
                {/* Question number */}
                <p className="font-body text-[11px] uppercase tracking-widest text-muted mb-2 text-center">
                  Question {state.currentQuestionNum} of {SESSION_QUESTION_COUNT}
                </p>

                <QuestionCard
                  question={q}
                  selectedAnswer={state.selectedAnswer}
                  submitted={state.phase !== "question"}
                  onSelect={(ans) => dispatch({ type: "SELECT_ANSWER", answer: ans })}
                />
              </motion.div>
            </AnimatePresence>

            <RubricStrip />

            {/* Hint button + hint callout */}
            {state.phase === "question" && q.hint && !state.hintVisible && (
              <button
                onClick={() => dispatch({ type: "SHOW_HINT" })}
                className="w-full py-2.5 rounded-xl font-body text-sm font-semibold transition-colors"
                style={{ background: "rgba(255,190,0,0.12)", color: "#b38600", border: "1px solid rgba(255,190,0,0.3)" }}
              >
                💡 Need a hint?
              </button>
            )}
            {state.hintVisible && q.hint && (
              <div
                className="rounded-xl p-4"
                style={{ background: "rgba(255,190,0,0.08)", border: "1px solid rgba(255,190,0,0.25)" }}
              >
                <p className="font-body text-[11px] uppercase tracking-widest mb-1" style={{ color: "#b38600" }}>Hint 💡</p>
                <p className="font-body text-sm text-ink/80">{q.hint}</p>
              </div>
            )}

            {/* Submit button */}
            {state.phase === "question" && (
              <button
                onClick={() => void handleSubmitAnswer()}
                disabled={!state.selectedAnswer}
                className="w-full py-4 rounded-xl font-child font-bold text-xl text-white transition-all duration-150 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: state.selectedAnswer
                    ? "linear-gradient(90deg, #FF4D2E, #FFBE00)"
                    : "#9ca3af",
                }}
              >
                Lock in my answer! 🔒
              </button>
            )}

            {/* Explanation */}
            {state.phase === "explanation" && state.explanation && (
              <ExplanationPanel
                isCorrect={state.isCorrect ?? false}
                score={state.score ?? 0}
                explanation={state.explanation}
                hint={state.hint}
                onNext={() => void handleNext()}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
