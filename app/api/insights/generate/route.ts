import { NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/admin";
import { callClaude, safeParseJSON } from "@/lib/anthropic";

const Schema = z.object({ child_id: z.string() });

interface InsightRaw {
  type: "win" | "warn" | "info";
  title: string;
  body: string;
  action: string;
  data_point: string;
}

export async function POST(request: Request) {
  try {
    // ─── Auth verification ──────────────────────────────────────────────────
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      }
    );

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ─── Validate body ───────────────────────────────────────────────────────
    const body = await request.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { child_id } = parsed.data;
    const admin = createAdminClient();

    // ─── Verify child belongs to parent ────────────────────────────────────
    const { data: child, error: childErr } = await admin
      .from("children")
      .select("id, full_name, grade")
      .eq("id", child_id)
      .eq("parent_id", user.id)
      .single();

    if (childErr || !child) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }

    // ─── Fetch learning data ────────────────────────────────────────────────
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [respRes, masteryRes, streakRes] = await Promise.allSettled([
      admin
        .from("question_responses")
        .select("is_correct, answered_at")
        .eq("child_id", child_id)
        .gte("answered_at", since),
      admin
        .from("topic_mastery")
        .select("subject_id, topic_id, mastery_score, is_mastered")
        .eq("child_id", child_id),
      admin.from("streaks").select("current_streak, longest_streak").eq("child_id", child_id).single(),
    ]);

    const responses = respRes.status === "fulfilled" ? (respRes.value.data ?? []) : [];
    const mastery   = masteryRes.status === "fulfilled" ? (masteryRes.value.data ?? []) : [];
    const streak    = streakRes.status === "fulfilled" ? streakRes.value.data : null;

    // ─── Calculate stats ─────────────────────────────────────────────────────
    const total   = responses.length;
    const correct = responses.filter((r: { is_correct: boolean }) => r.is_correct).length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    const mastered = mastery.filter((m: { is_mastered: boolean }) => m.is_mastered).length;
    const avgMastery =
      mastery.length > 0
        ? Math.round(mastery.reduce((s: number, m: { mastery_score: number }) => s + (m.mastery_score ?? 0), 0) / mastery.length)
        : 0;

    const dataSummary = `
Child: ${child.full_name}, Grade ${child.grade}
Overall accuracy last 30 days: ${accuracy}% (${correct}/${total})
Topics mastered: ${mastered}/${mastery.length}
Average mastery score: ${avgMastery}%
Current streak: ${streak?.current_streak ?? 0} days
Longest streak: ${streak?.longest_streak ?? 0} days
`.trim();

    // ─── Generate insights via Claude ────────────────────────────────────────
    const system = `You are an encouraging, data-driven educational coach writing insight cards for a parent.
Analyse the learning data and return ONLY a JSON array of exactly 3 insight objects.
Be specific, positive, actionable. Never use shame language. Raw JSON only.`;

    const user_prompt = `${dataSummary}

Return exactly this JSON array (3 objects, no other text):
[{"type":"win","title":"Max 8 words","body":"Max 30 words with specific data point","action":"One sentence starting with a verb","data_point":"specific number or %"}]`;

    let insights: InsightRaw[];
    try {
      const text = await callClaude(user_prompt, system, 1024);
      insights = safeParseJSON<InsightRaw[]>(text);
      if (!Array.isArray(insights)) throw new Error("Not array");
      insights = insights.slice(0, 3);
    } catch {
      insights = [
        {
          type: "win",
          title: `${child.full_name} is making great progress`,
          body: `${child.full_name} has answered ${total} questions this month with ${accuracy}% accuracy. Keep the momentum going!`,
          action: "Set aside 20 minutes each evening for a Curiova session.",
          data_point: `${accuracy}% accuracy`,
        },
        {
          type: "info",
          title: "Consistency is building a strong habit",
          body: `With a ${streak?.current_streak ?? 0}-day learning streak, ${child.full_name} is developing a powerful study routine.`,
          action: "Celebrate their streak tonight to reinforce the habit.",
          data_point: `${streak?.current_streak ?? 0}-day streak`,
        },
        {
          type: "info",
          title: "Topics mastered and growing",
          body: `${mastered} out of ${mastery.length} topics are mastered. Each session adds more to ${child.full_name}'s knowledge base.`,
          action: "Ask them what they learned today — it reinforces memory.",
          data_point: `${mastered}/${mastery.length} topics`,
        },
      ];
    }

    // ─── Persist insights ────────────────────────────────────────────────────
    await admin.from("ai_insights").delete().eq("child_id", child_id);
    await admin.from("ai_insights").insert(
      insights.map((ins) => ({
        child_id,
        parent_id: user.id,
        insight_type: ins.type,
        title: ins.title,
        body: ins.body,
        is_read: false,
        created_at: new Date().toISOString(),
      }))
    );

    return NextResponse.json({ insights });
  } catch (err) {
    console.error("[insights/generate]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
