// ─── Question Types ────────────────────────────────────────────────────────────

export interface ObjectiveOption {
  key: "A" | "B" | "C" | "D";
  text: string;
}

export interface ObjectiveQuestion {
  type: "objective";
  question_text: string;
  options: ObjectiveOption[];
  correct_key: "A" | "B" | "C" | "D";
  correct_answer: string;
  explanation: string;
  difficulty_label: string;
  curriculum_topic: string;
}

export interface FillBlankQuestion {
  type: "fill_blank";
  question_text: string;
  correct_answer: string;
  acceptable_answers: string[];
  explanation: string;
  difficulty_label: string;
  curriculum_topic: string;
}

export interface MicroPuzzleData {
  // number puzzle
  numbers?: number[];
  target?: number;
  // word puzzle
  scrambled?: string;
  word_hint?: string;
  // pattern puzzle
  pattern?: string[];
}

export interface MicroPuzzleQuestion {
  type: "micro_puzzle";
  puzzle_type: "number" | "word" | "pattern";
  title: string;
  instruction: string;
  puzzle_data: MicroPuzzleData;
  correct_answer: string;
  hint: string;
  explanation: string;
}

export type Question = ObjectiveQuestion | FillBlankQuestion | MicroPuzzleQuestion;

// ─── Grade Answer Response ─────────────────────────────────────────────────────

export interface GradeResult {
  score: 0 | 1 | 2 | 3;
  is_correct: boolean;
  explanation: string;
  hint: string | null;
}

// ─── Adaptive Difficulty Response ─────────────────────────────────────────────

export interface AdaptiveResult {
  new_difficulty: number;
  direction: "up" | "down" | "hold";
  message: string | null;
  level_label: string;
  level_emoji: string;
}

// ─── Session State (for useReducer) ──────────────────────────────────────────

export type SessionPhase =
  | "loading"
  | "question"
  | "submitted"
  | "explanation"
  | "level_change"
  | "puzzle"
  | "complete";

export interface SessionState {
  phase: SessionPhase;
  currentQuestionNum: number;
  difficulty: number;
  recentAnswers: boolean[];
  sessionId: string;
  xpEarned: number;
  screenTimeEarned: number;
  currentQuestion: Question | null;
  selectedAnswer: string | null;
  isCorrect: boolean | null;
  score: number | null;
  explanation: string | null;
  hint: string | null;
  levelChangeMessage: string | null;
  levelChangeDirection: "up" | "down" | null;
  newDifficulty: number | null;
  timeLeft: number;
  timerActive: boolean;
  recentQuestionTexts: string[];
  error: string | null;
}

export type SessionAction =
  | { type: "INIT"; sessionId: string; difficulty: number }
  | { type: "SET_QUESTION"; question: Question }
  | { type: "SELECT_ANSWER"; answer: string }
  | { type: "SUBMIT_RESULT"; isCorrect: boolean; score: number; explanation: string; hint: string | null; xpDelta: number }
  | { type: "SHOW_LEVEL_CHANGE"; message: string; direction: "up" | "down"; newDifficulty: number }
  | { type: "NEXT_QUESTION" }
  | { type: "COMPLETE" }
  | { type: "TICK" }
  | { type: "TIMEOUT" }
  | { type: "SET_ERROR"; error: string };

// ─── Child Profile (subset used in learning flow) ─────────────────────────────

export interface ChildProfile {
  id: string;
  full_name: string;
  grade: number;
  curriculum: string;
  screen_time_ratio: number;
  total_xp: number;
  current_difficulty: number;
  screen_minutes_earned: number;
  screen_minutes_used: number;
}

// ─── Quest (for Mission Home) ─────────────────────────────────────────────────

export type QuestStatus = "done" | "active" | "available" | "locked";

export interface Quest {
  subject: string;
  subjectEmoji: string;
  topic: string;
  topicId: string;
  status: QuestStatus;
  questionsCompleted: number;
  masteryScore: number;
  lockReason?: string;
}
