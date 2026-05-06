// ─── Subjects ─────────────────────────────────────────────────────────────────

export const SUBJECTS = [
  {
    id: "maths",
    name: "Maths",
    emoji: "🔢",
    topics: [
      { id: "fractions", name: "Fractions & Decimals" },
      { id: "algebra", name: "Algebra & Expressions" },
      { id: "geometry", name: "Geometry & Mensuration" },
      { id: "statistics", name: "Statistics & Probability" },
      { id: "number-theory", name: "Number Theory" },
      { id: "ratios", name: "Ratios & Proportions" },
    ],
  },
  {
    id: "science",
    name: "Science",
    emoji: "🔬",
    topics: [
      { id: "cells", name: "Cells & Life Processes" },
      { id: "matter", name: "Matter & Its States" },
      { id: "forces", name: "Forces & Motion" },
      { id: "electricity", name: "Electricity & Magnetism" },
      { id: "ecosystems", name: "Ecosystems & Environment" },
      { id: "human-body", name: "Human Body Systems" },
    ],
  },
  {
    id: "english",
    name: "English",
    emoji: "📚",
    topics: [
      { id: "grammar", name: "Grammar & Usage" },
      { id: "comprehension", name: "Reading Comprehension" },
      { id: "writing", name: "Creative Writing" },
      { id: "vocabulary", name: "Vocabulary Building" },
      { id: "literature", name: "Literature & Poetry" },
      { id: "punctuation", name: "Punctuation & Editing" },
    ],
  },
  {
    id: "social-studies",
    name: "Social Studies",
    emoji: "🌍",
    topics: [
      { id: "history-ancient", name: "Ancient Civilisations" },
      { id: "history-modern", name: "Modern History" },
      { id: "geography-physical", name: "Physical Geography" },
      { id: "geography-human", name: "Human Geography" },
      { id: "civics", name: "Civics & Governance" },
      { id: "economics-basics", name: "Economics Basics" },
    ],
  },
] as const;

// ─── Screen-time ───────────────────────────────────────────────────────────────

export const SCREEN_TIME_RATIO_OPTIONS = [1, 2, 3, 4, 5] as const;

// ─── XP & Scoring ─────────────────────────────────────────────────────────────

export const XP_PER_CORRECT = 10;
export const XP_BONUS_THRESHOLD = 8;
export const XP_BONUS_AMOUNT = 20;

// ─── Session config ────────────────────────────────────────────────────────────

export const SESSION_QUESTION_COUNT = 10;
export const TIMER_SECONDS = 45;
export const TIMER_WARNING_SECONDS = 15;
export const PUZZLE_EVERY_N_QUESTIONS = 10;

// ─── Adaptive difficulty ───────────────────────────────────────────────────────

export const ADAPTIVE_WINDOW = 5;
export const ADAPTIVE_UP_THRESHOLD = 4;
export const ADAPTIVE_DOWN_THRESHOLD = 2;

// ─── Mastery ───────────────────────────────────────────────────────────────────

export const MASTERY_THRESHOLD = 80;
export const MASTERY_RECENT_WEIGHT = 0.6;
export const MASTERY_HISTORY_WEIGHT = 0.4;
