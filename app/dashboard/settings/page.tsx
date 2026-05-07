"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { LANGUAGES_OPTIONS } from "@/lib/constants";

const TABS = ["Profile", "Child Profile", "Guardrails", "Notifications", "Security"] as const;
type Tab = typeof TABS[number];

const CURRICULA = ["CBSE", "ICSE", "STATE", "US_K12", "IB"] as const;
const LANGUAGES = LANGUAGES_OPTIONS;

interface ChildRow {
  id: string;
  full_name: string;
  grade: number;
  curriculum: string;
  screen_time_ratio: number;
  language?: string;
  notifications_preferences?: Record<string, boolean>;
}

const DEFAULT_NOTIF = {
  daily_reminder: true,
  weekly_insights: true,
  streak_at_risk: true,
  achievements: true,
};

function Chip({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-lg font-body text-[12px] transition-all"
      style={{
        background: active ? "rgba(255,77,46,.15)" : "rgba(255,255,255,.05)",
        border: active ? "1px solid rgba(255,77,46,.4)" : "1px solid rgba(255,255,255,.08)",
        color: active ? "#FF4D2E" : "rgba(255,255,255,.45)",
      }}
    >
      {label}
    </button>
  );
}

function Toggle({
  checked, onChange, label, sub,
}: { checked: boolean; onChange: (v: boolean) => void; label: string; sub: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,.05)" }}>
      <div>
        <p className="font-body text-cream text-[13px] font-medium">{label}</p>
        <p className="font-body text-white/40 text-[11px]">{sub}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className="relative flex-shrink-0 w-10 h-6 rounded-full transition-colors"
        style={{ background: checked ? "#FF4D2E" : "rgba(255,255,255,.12)" }}
        role="switch"
        aria-checked={checked}
      >
        <span
          className="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform"
          style={{ left: checked ? "calc(100% - 20px)" : "4px" }}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("Profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");

  // Profile tab
  const [parentName, setParentName] = useState("");

  // Child profile tab
  const [child, setChild] = useState<ChildRow | null>(null);
  const [childName, setChildName] = useState("");
  const [childGrade, setChildGrade] = useState(5);
  const [childCurriculum, setChildCurriculum] = useState("CBSE");
  const [childLanguage, setChildLanguage] = useState("English");

  // Guardrails tab
  const [ratio, setRatio] = useState(2);

  // Notifications tab
  const [notif, setNotif] = useState<Record<string, boolean>>(DEFAULT_NOTIF);

  // Security tab
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    setUserEmail(user.email ?? "");
    setParentName((user.user_metadata?.full_name as string) ?? "");

    const { data: childRow } = await supabase
      .from("children")
      .select("id, full_name, grade, curriculum, screen_time_ratio, language, notifications_preferences")
      .eq("parent_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (childRow) {
      const c = childRow as ChildRow;
      setChild(c);
      setChildName(c.full_name ?? "");
      setChildGrade(c.grade ?? 5);
      setChildCurriculum(c.curriculum ?? "CBSE");
      setChildLanguage(c.language ?? "English");
      setRatio(c.screen_time_ratio ?? 2);
      setNotif({ ...DEFAULT_NOTIF, ...(c.notifications_preferences ?? {}) });
    }
    setLoading(false);
  }

  function flash() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function saveProfile() {
    if (!userId) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.auth.updateUser({ data: { full_name: parentName } });
    setSaving(false);
    flash();
  }

  async function saveChild() {
    if (!child) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("children").update({
      full_name: childName,
      grade: childGrade,
      curriculum: childCurriculum,
      language: childLanguage,
      updated_at: new Date().toISOString(),
    }).eq("id", child.id);
    setSaving(false);
    flash();
  }

  async function saveGuardrails() {
    if (!child) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("children").update({
      screen_time_ratio: ratio,
      updated_at: new Date().toISOString(),
    }).eq("id", child.id);
    setSaving(false);
    flash();
  }

  async function saveNotifications() {
    if (!child) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("children").update({
      notifications_preferences: notif,
      updated_at: new Date().toISOString(),
    }).eq("id", child.id);
    setSaving(false);
    flash();
  }

  async function changePassword() {
    setPwError("");
    if (newPw !== confirmPw) { setPwError("Passwords do not match."); return; }
    if (newPw.length < 8) { setPwError("Password must be at least 8 characters."); return; }
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setSaving(false);
    if (error) { setPwError(error.message); return; }
    setPwSuccess(true);
    setNewPw(""); setConfirmPw("");
    setTimeout(() => setPwSuccess(false), 3000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 rounded-full border-4 border-coral border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="font-display font-extrabold text-cream text-3xl">Settings ⚙</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1" style={{ borderBottom: "1px solid rgba(255,255,255,.07)" }}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="font-body text-[13px] px-4 py-2 rounded-t-lg whitespace-nowrap transition-colors"
            style={{
              color: tab === t ? "#FF4D2E" : "rgba(255,255,255,.4)",
              borderBottom: tab === t ? "2px solid #FF4D2E" : "2px solid transparent",
              marginBottom: "-1px",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {saved && (
        <div className="mb-4 rounded-xl p-3 text-center" style={{ background: "rgba(0,191,128,.1)", border: "1px solid rgba(0,191,128,.2)" }}>
          <p className="font-body text-mint text-sm">✓ Changes saved</p>
        </div>
      )}

      {/* Profile tab */}
      {tab === "Profile" && (
        <div className="space-y-4">
          <div>
            <label className="font-body text-[11px] uppercase tracking-widest text-white/40 block mb-1.5">
              Full name
            </label>
            <input
              type="text"
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              className="w-full bg-white/[.06] rounded-xl px-4 py-3 font-body text-cream text-sm outline-none focus:ring-2 focus:ring-coral/30"
              style={{ border: "1px solid rgba(255,255,255,.08)" }}
            />
          </div>
          <div>
            <label className="font-body text-[11px] uppercase tracking-widest text-white/40 block mb-1.5">
              Email address
            </label>
            <div
              className="w-full rounded-xl px-4 py-3 font-body text-white/40 text-sm"
              style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)" }}
            >
              {userEmail}
            </div>
            <p className="font-body text-[11px] text-white/25 mt-1">Contact support to change your email address.</p>
          </div>
          <button
            onClick={() => void saveProfile()}
            disabled={saving}
            className="w-full py-3 rounded-xl font-body font-semibold text-sm text-white disabled:opacity-50"
            style={{ background: "linear-gradient(90deg, #FF4D2E, #FFBE00)" }}
          >
            {saving ? "Saving…" : "Save profile"}
          </button>
        </div>
      )}

      {/* Child Profile tab */}
      {tab === "Child Profile" && (
        <div className="space-y-5">
          <div>
            <label className="font-body text-[11px] uppercase tracking-widest text-white/40 block mb-1.5">Child name</label>
            <input
              type="text"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              className="w-full bg-white/[.06] rounded-xl px-4 py-3 font-body text-cream text-sm outline-none focus:ring-2 focus:ring-coral/30"
              style={{ border: "1px solid rgba(255,255,255,.08)" }}
            />
          </div>
          <div>
            <label className="font-body text-[11px] uppercase tracking-widest text-white/40 block mb-2">Grade</label>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                <Chip key={g} label={`Grade ${g}`} active={childGrade === g} onClick={() => setChildGrade(g)} />
              ))}
            </div>
          </div>
          <div>
            <label className="font-body text-[11px] uppercase tracking-widest text-white/40 block mb-2">Curriculum</label>
            <div className="flex flex-wrap gap-2">
              {CURRICULA.map((c) => (
                <Chip key={c} label={c} active={childCurriculum === c} onClick={() => setChildCurriculum(c)} />
              ))}
            </div>
          </div>
          <div>
            <label className="font-body text-[11px] uppercase tracking-widest text-white/40 block mb-2">Language</label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((l) => (
                <Chip key={l} label={l} active={childLanguage === l} onClick={() => setChildLanguage(l)} />
              ))}
            </div>
          </div>
          <button
            onClick={() => void saveChild()}
            disabled={saving}
            className="w-full py-3 rounded-xl font-body font-semibold text-sm text-white disabled:opacity-50"
            style={{ background: "linear-gradient(90deg, #FF4D2E, #FFBE00)" }}
          >
            {saving ? "Saving…" : "Save child profile"}
          </button>
        </div>
      )}

      {/* Guardrails tab */}
      {tab === "Guardrails" && (
        <div className="space-y-5">
          <div>
            <p className="font-body text-cream text-sm font-medium mb-1">Screen time ratio</p>
            <p className="font-body text-white/40 text-[12px] mb-4">
              For every completed session, earn this many minutes × 15 of play time.
            </p>
            <div className="flex items-center gap-4 mb-4">
              <input
                type="range" min={1} max={5} step={1}
                value={ratio}
                onChange={(e) => setRatio(Number(e.target.value))}
                className="flex-1 accent-coral"
              />
              <span className="font-display font-bold text-coral text-xl w-8 text-center">{ratio}×</span>
            </div>
            {/* Visualiser */}
            <div className="flex gap-3 mb-5">
              <div className="flex-1 rounded-xl p-3 text-center" style={{ background: "rgba(255,77,46,.1)", border: "1px solid rgba(255,77,46,.2)" }}>
                <p className="font-body text-[10px] text-coral/70 uppercase tracking-widest mb-1">Study session</p>
                <p className="font-display font-bold text-coral text-xl">10 questions</p>
              </div>
              <div className="flex items-center text-white/25 text-xl">→</div>
              <div className="flex-1 rounded-xl p-3 text-center" style={{ background: "rgba(43,127,255,.1)", border: "1px solid rgba(43,127,255,.2)" }}>
                <p className="font-body text-[10px] text-sky/70 uppercase tracking-widest mb-1">Play time</p>
                <p className="font-display font-bold text-sky text-xl">{ratio * 15}m</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => void saveGuardrails()}
            disabled={saving}
            className="w-full py-3 rounded-xl font-body font-semibold text-sm text-white disabled:opacity-50"
            style={{ background: "linear-gradient(90deg, #FF4D2E, #FFBE00)" }}
          >
            {saving ? "Saving…" : "Save guardrails"}
          </button>
        </div>
      )}

      {/* Notifications tab */}
      {tab === "Notifications" && (
        <div>
          <Toggle
            checked={notif.daily_reminder ?? true}
            onChange={(v) => setNotif((p) => ({ ...p, daily_reminder: v }))}
            label="Daily session reminder"
            sub="Push notification when child hasn't studied by 5pm"
          />
          <Toggle
            checked={notif.weekly_insights ?? true}
            onChange={(v) => setNotif((p) => ({ ...p, weekly_insights: v }))}
            label="Weekly insights ready"
            sub="Notify when new AI insights are generated"
          />
          <Toggle
            checked={notif.streak_at_risk ?? true}
            onChange={(v) => setNotif((p) => ({ ...p, streak_at_risk: v }))}
            label="Streak at risk"
            sub="Alert if child hasn't studied by 8pm"
          />
          <Toggle
            checked={notif.achievements ?? true}
            onChange={(v) => setNotif((p) => ({ ...p, achievements: v }))}
            label="Achievements unlocked"
            sub="Notify when child earns a badge or masters a topic"
          />
          <button
            onClick={() => void saveNotifications()}
            disabled={saving}
            className="w-full py-3 mt-5 rounded-xl font-body font-semibold text-sm text-white disabled:opacity-50"
            style={{ background: "linear-gradient(90deg, #FF4D2E, #FFBE00)" }}
          >
            {saving ? "Saving…" : "Save notification preferences"}
          </button>
        </div>
      )}

      {/* Security tab */}
      {tab === "Security" && (
        <div className="space-y-4">
          <p className="font-body text-white/40 text-[12px]">
            Change your account password. You&apos;ll need to sign in again after changing it.
          </p>
          {pwError && (
            <div className="rounded-xl p-3" style={{ background: "rgba(240,19,61,.1)", border: "1px solid rgba(240,19,61,.2)" }}>
              <p className="font-body text-rose text-sm">{pwError}</p>
            </div>
          )}
          {pwSuccess && (
            <div className="rounded-xl p-3" style={{ background: "rgba(0,191,128,.1)", border: "1px solid rgba(0,191,128,.2)" }}>
              <p className="font-body text-mint text-sm">✓ Password updated successfully</p>
            </div>
          )}
          {[
            { label: "New password", value: newPw, setter: setNewPw },
            { label: "Confirm new password", value: confirmPw, setter: setConfirmPw },
          ].map(({ label, value, setter }) => (
            <div key={label}>
              <label className="font-body text-[11px] uppercase tracking-widest text-white/40 block mb-1.5">
                {label}
              </label>
              <input
                type="password"
                value={value}
                onChange={(e) => setter(e.target.value)}
                className="w-full bg-white/[.06] rounded-xl px-4 py-3 font-body text-cream text-sm outline-none focus:ring-2 focus:ring-coral/30"
                style={{ border: "1px solid rgba(255,255,255,.08)" }}
              />
            </div>
          ))}
          <button
            onClick={() => void changePassword()}
            disabled={saving || !newPw}
            className="w-full py-3 rounded-xl font-body font-semibold text-sm text-white disabled:opacity-50"
            style={{ background: "linear-gradient(90deg, #FF4D2E, #FFBE00)" }}
          >
            {saving ? "Updating…" : "Update password"}
          </button>
        </div>
      )}
    </div>
  );
}
