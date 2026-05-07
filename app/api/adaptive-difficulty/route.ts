// SERVER ONLY — never import this in client components
import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import type { AdaptiveResult } from "@/types/learning";

const Schema = z.object({
  recent_answers: z.array(z.boolean()),
  current_difficulty: z.number().int().min(1).max(5),
  child_id: z.string(),
  subject: z.string(),
  topic: z.string(),
});

const LEVEL_CFG = {
  1: { label: "Starter",   emoji: "🌱" },
  2: { label: "Building",  emoji: "🌿" },
  3: { label: "Confident", emoji: "⚡" },
  4: { label: "Advanced",  emoji: "🚀" },
  5: { label: "Mastery",   emoji: "🏆" },
} as const;

const UP_MSGS = [
  "You're on fire — let's turn it up! 🔥",
  "Crushing it! Time for a bigger challenge 🚀",
  "You've mastered this level — onwards! ⚡",
];

const DOWN_MSGS = [
  "Let's try a slightly easier one — you've got this 💪",
  "No worries — let's build that foundation stronger 🌱",
  "Every expert was once a beginner — keep going! 🌟",
];

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
    }

    const { recent_answers, current_difficulty, child_id, subject, topic } = parsed.data;

    const rl = rateLimit(child_id, 60, 60_000);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests", retryAfter: Math.ceil((rl.resetAt - Date.now()) / 1000) },
        { status: 429 }
      );
    }

    // Use last 5 answers only
    const window = recent_answers.slice(-5);
    const correct = window.filter(Boolean).length;

    let new_difficulty = current_difficulty;
    let direction: "up" | "down" | "hold" = "hold";
    let message: string | null = null;

    if (correct >= 4) {
      const next = Math.min(current_difficulty + 1, 5);
      if (next !== current_difficulty) {
        new_difficulty = next;
        direction = "up";
        message = rand(UP_MSGS);
      }
    } else if (correct <= 2) {
      const prev = Math.max(current_difficulty - 1, 1);
      if (prev !== current_difficulty) {
        new_difficulty = prev;
        direction = "down";
        message = rand(DOWN_MSGS);
      }
    }

    const cfg = LEVEL_CFG[new_difficulty as keyof typeof LEVEL_CFG];

    // Update topic_mastery with new difficulty (fire-and-forget)
    try {
      const admin = createAdminClient();
      await admin.from("topic_mastery").upsert(
        {
          child_id,
          subject_id: subject,
          topic_id: topic,
          current_difficulty: new_difficulty,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "child_id,subject_id,topic_id" }
      );
    } catch {
      // Non-fatal
    }

    return NextResponse.json({
      new_difficulty,
      direction,
      message,
      level_label: cfg.label,
      level_emoji: cfg.emoji,
    } satisfies AdaptiveResult);
  } catch (err) {
    console.error("[adaptive-difficulty]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
