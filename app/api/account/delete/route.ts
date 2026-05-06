import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
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

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as { deleteType?: string };
    const admin = createAdminClient();

    if (body.deleteType === "data_only") {
      // Delete only learning data, keep account
      const { data: children } = await admin
        .from("children")
        .select("id")
        .eq("parent_id", user.id);

      for (const child of children ?? []) {
        await Promise.allSettled([
          admin.from("question_responses").delete().eq("child_id", child.id),
          admin.from("study_sessions").delete().eq("child_id", child.id),
          admin.from("topic_mastery").delete().eq("child_id", child.id),
          admin.from("ai_insights").delete().eq("child_id", child.id),
          admin.from("streaks").delete().eq("child_id", child.id),
        ]);
      }
      return NextResponse.json({ success: true, type: "data_deleted" });
    }

    // Full account deletion
    const { data: children } = await admin
      .from("children")
      .select("id")
      .eq("parent_id", user.id);

    for (const child of children ?? []) {
      await Promise.allSettled([
        admin.from("question_responses").delete().eq("child_id", child.id),
        admin.from("study_sessions").delete().eq("child_id", child.id),
        admin.from("topic_mastery").delete().eq("child_id", child.id),
        admin.from("ai_insights").delete().eq("child_id", child.id),
        admin.from("streaks").delete().eq("child_id", child.id),
        admin.from("children").delete().eq("id", child.id),
      ]);
    }

    // Delete user from auth
    const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, type: "account_deleted" });
  } catch (err) {
    console.error("[account/delete]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
