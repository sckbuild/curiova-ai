import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function generateInsights(childId: string, childName: string, grade: number) {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [respRes, masteryRes, streakRes] = await Promise.allSettled([
    supabase.from("question_responses").select("is_correct").eq("child_id", childId).gte("answered_at", since),
    supabase.from("topic_mastery").select("is_mastered, mastery_score").eq("child_id", childId),
    supabase.from("streaks").select("current_streak, longest_streak").eq("child_id", childId).single(),
  ]);

  const responses = respRes.status === "fulfilled" ? (respRes.value.data ?? []) : [];
  const mastery = masteryRes.status === "fulfilled" ? (masteryRes.value.data ?? []) : [];
  const streak = streakRes.status === "fulfilled" ? streakRes.value.data : null;

  const total = responses.length;
  const correct = responses.filter((r: { is_correct: boolean }) => r.is_correct).length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const mastered = mastery.filter((m: { is_mastered: boolean }) => m.is_mastered).length;

  const prompt = `Child: ${childName}, Grade ${grade}
Accuracy last 30 days: ${accuracy}% (${total} questions)
Topics mastered: ${mastered}/${mastery.length}
Streak: ${streak?.current_streak ?? 0} days current, ${streak?.longest_streak ?? 0} longest

Return exactly 3 insight objects as a JSON array:
[{"type":"win"|"warn"|"info","title":"max 8 words","body":"max 30 words","action":"one verb sentence","data_point":"specific number"}]`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system: "Return ONLY raw JSON array. No markdown, no backticks.",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const json = await res.json();
  const text = json.content?.[0]?.text ?? "[]";
  return JSON.parse(text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim());
}

serve(async () => {
  try {
    const { data: children, error } = await supabase
      .from("children")
      .select("id, full_name, grade, parent_id");

    if (error || !children?.length) {
      return new Response(JSON.stringify({ processed: 0 }), { status: 200 });
    }

    let processed = 0;
    for (const child of children) {
      try {
        const insights = await generateInsights(child.id, child.full_name, child.grade);
        if (!Array.isArray(insights) || !insights.length) continue;

        await supabase.from("ai_insights").delete().eq("child_id", child.id);
        await supabase.from("ai_insights").insert(
          insights.slice(0, 3).map((ins: { type: string; title: string; body: string }) => ({
            child_id: child.id,
            parent_id: child.parent_id,
            insight_type: ins.type ?? "info",
            title: ins.title,
            body: ins.body,
            is_read: false,
            created_at: new Date().toISOString(),
          }))
        );
        processed++;
      } catch {
        // Skip this child if generation fails
      }
    }

    return new Response(JSON.stringify({ processed }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
