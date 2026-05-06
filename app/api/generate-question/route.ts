// SERVER ONLY — never import this in client components
import { NextResponse } from "next/server";
import { z } from "zod";
import { callClaude, safeParseJSON } from "@/lib/anthropic";
import { rateLimit } from "@/lib/rate-limit";

// ─── Schema ───────────────────────────────────────────────────────────────────

const Schema = z.object({
  subject: z.string(),
  topic: z.string(),
  grade: z.number().int().min(1).max(12),
  curriculum: z.enum(["CBSE", "ICSE", "STATE", "US_K12", "IB"]),
  difficulty_level: z.number().int().min(1).max(5),
  age: z.number().int().min(7).max(17),
  language: z.string().default("English"),
  question_number: z.number().int().min(1),
  session_id: z.string(),
  recent_question_texts: z.array(z.string()).default([]),
});

// ─── Config ───────────────────────────────────────────────────────────────────

const DIFFICULTY: Record<number, string> = {
  1: "Level 1 Starter🌱: basic recall, single-step, simple vocabulary under 10 words per sentence",
  2: "Level 2 Building🌿: apply concepts, 2-step problems, straightforward inference",
  3: "Level 3 Confident⚡: multi-step reasoning, compare and contrast, explain why",
  4: "Level 4 Advanced🚀: complex application, real-world problems, abstract thinking",
  5: "Level 5 Mastery🏆: synthesis, evaluation, novel problem-solving, open-ended",
};

function ageRule(age: number) {
  if (age <= 10) return "Ages 7–10: sentences under 10 words, concrete examples (food/animals/toys)";
  if (age <= 14) return "Ages 11–14: clear prose, relatable contexts (school/sports/friends)";
  return "Ages 15–17: mature vocabulary, real-world contexts (economics/science/current events)";
}

// ─── Fallbacks ────────────────────────────────────────────────────────────────

const FALLBACKS: Record<string, object> = {
  maths: {
    type: "objective", question_text: "What is 12 × 7?",
    options: [{ key: "A", text: "74" }, { key: "B", text: "84" }, { key: "C", text: "82" }, { key: "D", text: "94" }],
    correct_key: "B", correct_answer: "84",
    explanation: "12 × 7 = 84. Think of it as 10 × 7 + 2 × 7 = 70 + 14 = 84. Great thinking! 🌟",
    difficulty_label: "Starter", curriculum_topic: "Multiplication",
  },
  science: {
    type: "objective", question_text: "What gas do plants need to make food through photosynthesis?",
    options: [{ key: "A", text: "Oxygen" }, { key: "B", text: "Nitrogen" }, { key: "C", text: "Carbon Dioxide" }, { key: "D", text: "Hydrogen" }],
    correct_key: "C", correct_answer: "Carbon Dioxide",
    explanation: "Plants absorb carbon dioxide and use sunlight to make glucose in photosynthesis. Amazing process! 🌿",
    difficulty_label: "Starter", curriculum_topic: "Photosynthesis",
  },
  english: {
    type: "objective", question_text: "Which of these is a noun?",
    options: [{ key: "A", text: "Quickly" }, { key: "B", text: "Beautiful" }, { key: "C", text: "Mountain" }, { key: "D", text: "Running" }],
    correct_key: "C", correct_answer: "Mountain",
    explanation: "A noun names a person, place, or thing. 'Mountain' is a place/thing — great eye! 🏔️",
    difficulty_label: "Starter", curriculum_topic: "Parts of Speech",
  },
  "social-studies": {
    type: "objective", question_text: "Which is the capital of India?",
    options: [{ key: "A", text: "Mumbai" }, { key: "B", text: "Kolkata" }, { key: "C", text: "Bengaluru" }, { key: "D", text: "New Delhi" }],
    correct_key: "D", correct_answer: "New Delhi",
    explanation: "New Delhi is India's capital, where the parliament and government are based. Keep it up! 🇮🇳",
    difficulty_label: "Starter", curriculum_topic: "Indian Geography",
  },
};

function getFallback(subject: string): object {
  const key = subject.toLowerCase().replace(/\s+/g, "-");
  return FALLBACKS[key] ?? FALLBACKS.maths;
}

// ─── Prompt builders ──────────────────────────────────────────────────────────

function buildSystem(data: z.infer<typeof Schema>): string {
  return `You are a curriculum expert generating exam questions for ${data.curriculum} Grade ${data.grade}.
DIFFICULTY: ${DIFFICULTY[data.difficulty_level]}
LANGUAGE/AGE RULE: ${ageRule(data.age)}
CRITICAL: Return ONLY raw JSON. No markdown, no backticks, no explanation text. Just the JSON object.
Do NOT repeat these recent questions: ${data.recent_question_texts.slice(-3).join(" | ")}
Explanation must be ≤2 sentences, encouraging, never use: wrong, incorrect, failed, bad.
Language: ${data.language}`;
}

function buildObjectivePrompt(data: z.infer<typeof Schema>): string {
  return `Generate one ${data.subject} multiple-choice question on topic: "${data.topic}" for Grade ${data.grade} ${data.curriculum}.

Return EXACTLY this JSON (no other text):
{"type":"objective","question_text":"string","options":[{"key":"A","text":"string"},{"key":"B","text":"string"},{"key":"C","text":"string"},{"key":"D","text":"string"}],"correct_key":"A","correct_answer":"string","explanation":"string","difficulty_label":"${DIFFICULTY[data.difficulty_level].split(":")[0].trim()}","curriculum_topic":"string"}`;
}

function buildFillBlankPrompt(data: z.infer<typeof Schema>): string {
  return `Generate one ${data.subject} fill-in-the-blank question on topic: "${data.topic}" for Grade ${data.grade} ${data.curriculum}. Use [BLANK] as the placeholder.

Return EXACTLY this JSON (no other text):
{"type":"fill_blank","question_text":"sentence with [BLANK]","correct_answer":"string","acceptable_answers":["string"],"explanation":"string","difficulty_label":"string","curriculum_topic":"string"}`;
}

function buildPuzzlePrompt(data: z.infer<typeof Schema>): string {
  return `Generate one educational micro-puzzle for Grade ${data.grade} on ${data.subject} topic "${data.topic}". Choose puzzle_type "number", "word", or "pattern".

Return EXACTLY this JSON (no other text):
{"type":"micro_puzzle","puzzle_type":"word","title":"fun puzzle name","instruction":"what to do","puzzle_data":{"scrambled":"NROCTFIA","word_hint":"A key concept"},"correct_answer":"FRACTION","hint":"Think about dividing things into parts","explanation":"Great brain workout!"}`;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    const rl = rateLimit(data.session_id, 30, 60_000);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests", retryAfter: Math.ceil((rl.resetAt - Date.now()) / 1000) },
        { status: 429 }
      );
    }

    const isLast = data.question_number % 10 === 0;
    const isFill = !isLast && data.question_number % 5 === 0;
    const systemPrompt = buildSystem(data);
    const userPrompt = isLast
      ? buildPuzzlePrompt(data)
      : isFill
      ? buildFillBlankPrompt(data)
      : buildObjectivePrompt(data);

    let result: object | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const text = await callClaude(userPrompt, systemPrompt, 1024);
        result = safeParseJSON<object>(text);
        break;
      } catch {
        if (attempt === 1) result = getFallback(data.subject);
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[generate-question]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
