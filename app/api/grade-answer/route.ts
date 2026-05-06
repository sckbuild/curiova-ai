// SERVER ONLY — never import this in client components
import { NextResponse } from "next/server";
import { z } from "zod";
import { callClaude, safeParseJSON } from "@/lib/anthropic";
import { rateLimit } from "@/lib/rate-limit";
import type { GradeResult } from "@/types/learning";

const Schema = z.object({
  question_text: z.string(),
  correct_answer: z.string(),
  acceptable_answers: z.array(z.string()).default([]),
  child_answer: z.string(),
  age: z.number().int().min(7).max(17),
  difficulty_level: z.number().int().min(1).max(5),
  session_id: z.string().optional(),
});

function norm(s: string) {
  return s.toLowerCase().trim().replace(/[.,!?]/g, "");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
    }

    const { question_text, correct_answer, acceptable_answers, child_answer, age, session_id } = parsed.data;

    const rl = rateLimit(session_id ?? "global", 30, 60_000);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests", retryAfter: Math.ceil((rl.resetAt - Date.now()) / 1000) },
        { status: 429 }
      );
    }

    // Fast path: exact match
    const allAccepted = [correct_answer, ...acceptable_answers].map(norm);
    if (allAccepted.includes(norm(child_answer))) {
      return NextResponse.json({
        score: 3,
        is_correct: true,
        explanation: "Excellent — you nailed it! That's exactly right. 🌟",
        hint: null,
      } satisfies GradeResult);
    }

    const system = `You are a supportive, encouraging teacher grading a ${age}-year-old student's answer.
Return ONLY raw JSON. No markdown, no backtick wrappers.
Score rubric:
3 — Correct or acceptable variation
2 — Right concept, wrong format or minor error
1 — Partial understanding shown
0 — Incorrect — still acknowledge effort`;

    const user = `Question: ${question_text}
Correct answer: "${correct_answer}"
Also acceptable: ${acceptable_answers.map((a) => `"${a}"`).join(", ") || "none"}
Student's answer: "${child_answer}"

Return this JSON exactly:
{"score":0,"is_correct":false,"explanation":"string — 2 sentences max, always start positively","hint":"string or null"}`;

    try {
      const text = await callClaude(user, system, 256);
      const result = safeParseJSON<GradeResult>(text);
      return NextResponse.json(result);
    } catch {
      // Fallback: score 0
      return NextResponse.json({
        score: 0,
        is_correct: false,
        explanation: "Good try! That wasn't quite right, but every attempt makes you smarter. 💪",
        hint: "Review your notes on this topic and try again.",
      } satisfies GradeResult);
    }
  } catch (err) {
    console.error("[grade-answer]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
