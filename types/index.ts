// ─── Enums ────────────────────────────────────────────────────────────────────

export enum Curriculum {
  CBSE = "CBSE",
  ICSE = "ICSE",
  STATE = "STATE",
  US_K12 = "US_K12",
  IB = "IB",
}

export enum QuestionType {
  Objective = "objective",
  FillBlank = "fill_blank",
}

export enum InsightType {
  Win = "win",
  Warn = "warn",
  Info = "info",
}

export const DifficultyLevel = {
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
} as const;

export type DifficultyLevelValue = (typeof DifficultyLevel)[keyof typeof DifficultyLevel];

// ─── Difficulty config ────────────────────────────────────────────────────────

export type DifficultyConfig = {
  level: DifficultyLevelValue;
  label: string;
  emoji: string;
  description: string;
};

export const DIFFICULTY_LEVELS: DifficultyConfig[] = [
  {
    level: 1,
    label: "Starter",
    emoji: "🌱",
    description: "Building foundational understanding",
  },
  {
    level: 2,
    label: "Building",
    emoji: "🌿",
    description: "Strengthening core concepts",
  },
  {
    level: 3,
    label: "Confident",
    emoji: "⚡",
    description: "Applying knowledge fluently",
  },
  {
    level: 4,
    label: "Advanced",
    emoji: "🚀",
    description: "Tackling challenging problems",
  },
  {
    level: 5,
    label: "Mastery",
    emoji: "🏆",
    description: "Expert-level understanding",
  },
];

// ─── Core entities ────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: "parent" | "child";
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Child {
  id: string;
  parent_id: string;
  full_name: string;
  avatar_url: string | null;
  grade: number;
  curriculum: Curriculum;
  screen_time_ratio: number;
  total_xp: number;
  current_difficulty: DifficultyLevelValue;
  screen_minutes_earned: number;
  screen_minutes_used: number;
  created_at: string;
  updated_at: string;
}

export interface StudySession {
  id: string;
  child_id: string;
  subject_id: string;
  topic_id: string;
  started_at: string;
  completed_at: string | null;
  total_questions: number;
  correct_answers: number;
  xp_earned: number;
  difficulty_start: DifficultyLevelValue;
  difficulty_end: DifficultyLevelValue;
  screen_minutes_earned: number;
}

export interface QuestionResponse {
  id: string;
  session_id: string;
  child_id: string;
  question_id: string;
  question_type: QuestionType;
  selected_option: string | null;
  fill_answer: string | null;
  is_correct: boolean;
  time_taken_seconds: number;
  difficulty_level: DifficultyLevelValue;
  answered_at: string;
}

export interface TopicMastery {
  id: string;
  child_id: string;
  subject_id: string;
  topic_id: string;
  mastery_score: number;
  sessions_count: number;
  last_studied_at: string | null;
  is_mastered: boolean;
  created_at: string;
  updated_at: string;
}

export interface AiInsight {
  id: string;
  child_id: string;
  parent_id: string;
  insight_type: InsightType;
  title: string;
  body: string;
  subject_id: string | null;
  topic_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Streak {
  id: string;
  child_id: string;
  current_streak: number;
  longest_streak: number;
  last_study_date: string | null;
  created_at: string;
  updated_at: string;
}
