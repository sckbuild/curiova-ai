"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface ChildRow {
  id: string;
  full_name: string;
  grade: number;
  curriculum: string;
  screen_time_ratio: number;
}

interface SidebarProps {
  childrenList: ChildRow[];
  unreadCount: number;
}

const NAV_GROUPS = [
  {
    label: "OVERVIEW",
    items: [
      { href: "/dashboard",             icon: "◎", label: "Dashboard" },
      { href: "/dashboard/mastery",     icon: "🗺", label: "Mastery Map" },
      { href: "/dashboard/growth",      icon: "📈", label: "Growth Over Time" },
    ],
  },
  {
    label: "FAMILY",
    items: [
      { href: "/dashboard/screen-time", icon: "⏱", label: "Screen Time" },
      { href: "/dashboard/insights",    icon: "💡", label: "Weekly Wins", badge: true },
    ],
  },
  {
    label: "SETTINGS",
    items: [
      { href: "/dashboard/notifications", icon: "🔔", label: "Notifications" },
      { href: "/dashboard/privacy",       icon: "🔒", label: "Privacy Center" },
      { href: "/dashboard/settings",      icon: "⚙", label: "Settings" },
    ],
  },
] as const;

export function Sidebar({ childrenList, unreadCount }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [updatedNow, setUpdatedNow] = useState(false);
  const [showChildDropdown, setShowChildDropdown] = useState(false);
  const [activeChild, setActiveChild] = useState<ChildRow | null>(
    childrenList[0] ?? null
  );

  // Fetch streak for active child
  const [streak, setStreak] = useState(0);
  useEffect(() => {
    if (!activeChild) return;
    const supabase = createClient();
    supabase
      .from("streaks")
      .select("current_streak")
      .eq("child_id", activeChild.id)
      .single()
      .then(({ data }) => setStreak(data?.current_streak ?? 0));
  }, [activeChild]);

  // Realtime: watch study_sessions for active child
  useEffect(() => {
    if (!activeChild) return;
    const supabase = createClient();
    const channel = supabase
      .channel("sidebar_sessions")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "study_sessions",
          filter: `child_id=eq.${activeChild.id}`,
        },
        () => {
          setUpdatedNow(true);
          setTimeout(() => setUpdatedNow(false), 6000);
        }
      )
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [activeChild]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  const initial = activeChild?.full_name?.[0]?.toUpperCase() ?? "?";

  return (
    <aside
      className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-[220px] z-30"
      style={{
        background: "#141210",
        borderRight: "1px solid rgba(255,255,255,.07)",
      }}
    >
      {/* Wordmark */}
      <div className="px-4 pt-8 pb-6">
        <Link href="/dashboard" className="flex items-center gap-1">
          <span className="font-display font-extrabold text-cream text-xl tracking-tight">
            Curiova
          </span>
          <span className="text-coral font-display font-extrabold text-xl">.</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 space-y-6">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="font-body text-[10px] uppercase tracking-widest text-white/25 px-2 mb-1">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-[13px] transition-all duration-150 relative"
                    style={{
                      color: active ? "#F5F1EA" : "rgba(255,255,255,.4)",
                      fontWeight: active ? 500 : 400,
                      background: active ? "rgba(255,255,255,.08)" : "transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!active) (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,.06)";
                    }}
                    onMouseLeave={(e) => {
                      if (!active) (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                    }}
                  >
                    <span className="text-base leading-none">{item.icon}</span>
                    <span className="font-body">{item.label}</span>
                    {"badge" in item && item.badge && unreadCount > 0 && (
                      <span className="ml-auto w-5 h-5 rounded-full bg-rose text-white text-[10px] font-bold flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Sign out */}
        <div>
          <button
            onClick={() => void handleSignOut()}
            className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-[13px] w-full transition-all duration-150"
            style={{ color: "rgba(255,255,255,.4)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,.06)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
          >
            <span className="text-base leading-none">🚪</span>
            <span className="font-body">Sign out</span>
          </button>
        </div>
      </nav>

      {/* Child selector card */}
      <div className="p-3">
        {activeChild ? (
          <div
            className="rounded-xl p-3 relative"
            style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.06)" }}
          >
            {/* Avatar + info */}
            <div className="flex items-center gap-2.5 mb-2">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-display font-bold text-white text-sm"
                style={{ background: "linear-gradient(135deg, #FF4D2E, #FFBE00)" }}
              >
                {initial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body font-semibold text-cream text-[13px] truncate">
                  {activeChild.full_name}
                </p>
                <p className="font-body text-white/40 text-[10px]">
                  Grade {activeChild.grade} · {activeChild.curriculum}
                </p>
              </div>
              {childrenList.length > 1 && (
                <button
                  onClick={() => setShowChildDropdown((p) => !p)}
                  className="text-white/30 hover:text-white/60 transition-colors text-xs"
                  aria-label="Switch child"
                >
                  ⌄
                </button>
              )}
            </div>

            {/* Streak */}
            <div
              className="rounded-lg px-2.5 py-1.5 flex items-center gap-1.5"
              style={{ background: "rgba(255,190,0,.08)" }}
            >
              <span className="text-xs">🔥</span>
              <span className="font-body text-[11px] font-semibold text-sun">
                {streak}-day streak
              </span>
            </div>

            {/* Child switcher dropdown */}
            {showChildDropdown && childrenList.length > 1 && (
              <div
                className="absolute bottom-full left-0 right-0 mb-2 rounded-xl overflow-hidden shadow-xl"
                style={{ background: "#1C1917", border: "1px solid rgba(255,255,255,.1)" }}
              >
                {childrenList.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => { setActiveChild(c); setShowChildDropdown(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-white/[.06]"
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center font-display font-bold text-white text-xs flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #FF4D2E, #FFBE00)" }}
                    >
                      {c.full_name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-body text-cream text-[12px] font-medium">{c.full_name}</p>
                      <p className="font-body text-white/40 text-[10px]">Grade {c.grade}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/onboarding"
            className="block rounded-xl p-3 text-center font-body text-[12px] text-white/40 hover:text-cream transition-colors"
            style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.06)" }}
          >
            + Add child profile
          </Link>
        )}

        {/* Updated indicator */}
        {updatedNow && (
          <p className="font-body text-[10px] text-white/30 text-center mt-2">
            Updated just now ✨
          </p>
        )}
      </div>
    </aside>
  );
}

// ─── Mobile bottom tab bar ────────────────────────────────────────────────────

export function MobileTabBar() {
  const pathname = usePathname();

  const TABS = [
    { href: "/dashboard",             icon: "◎", label: "Home" },
    { href: "/dashboard/growth",      icon: "📈", label: "Progress" },
    { href: "/dashboard/screen-time", icon: "⏱", label: "Screen" },
    { href: "/dashboard/settings",    icon: "⚙", label: "Settings" },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex"
      style={{ background: "#0A0908", borderTop: "1px solid rgba(255,255,255,.07)" }}
    >
      {TABS.map((tab) => {
        const active = tab.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors"
            style={{ color: active ? "#FF4D2E" : "rgba(255,255,255,.35)" }}
          >
            <span className="text-lg leading-none">{tab.icon}</span>
            <span className="font-body text-[10px]">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
