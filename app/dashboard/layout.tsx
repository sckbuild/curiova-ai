import { createClient } from "@/lib/supabase/server";
import { Sidebar, MobileTabBar } from "@/components/dashboard/Sidebar";
import { redirect } from "next/navigation";

export const metadata = { title: "Dashboard — Curiova.ai" };

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/dashboard");

  // Fetch all children for this parent
  const { data: childrenList } = await supabase
    .from("children")
    .select("id, full_name, grade, curriculum, screen_time_ratio")
    .eq("parent_id", user.id)
    .order("created_at", { ascending: true });

  // Unread insights count
  const { count: unreadCount } = await supabase
    .from("ai_insights")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", user.id)
    .eq("is_read", false);

  return (
    <div className="min-h-screen bg-ink">
      <Sidebar
        childrenList={childrenList ?? []}
        unreadCount={unreadCount ?? 0}
      />
      <MobileTabBar />
      {/* Main: offset for desktop sidebar, bottom padding for mobile tab bar */}
      <main className="md:ml-[220px] min-h-screen pb-16 md:pb-0">
        {children}
      </main>
    </div>
  );
}
