"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface RawResponse {
  id: string;
  question_type: string;
  is_correct: boolean;
  answered_at: string;
  time_taken_seconds: number;
}

export default function PrivacyPage() {
  const router = useRouter();
  const [childId, setChildId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRawModal, setShowRawModal] = useState(false);
  const [rawData, setRawData] = useState<RawResponse[]>([]);
  const [rawLoading, setRawLoading] = useState(false);
  const [deleteDataConfirm, setDeleteDataConfirm] = useState(false);
  const [deleteAccountStep, setDeleteAccountStep] = useState(0); // 0=idle, 1=confirm, 2=type
  const [deleteInput, setDeleteInput] = useState("");
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: child } = await supabase
      .from("children")
      .select("id")
      .eq("parent_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .single();
    setChildId((child as { id?: string } | null)?.id ?? null);
    setLoading(false);
  }

  async function downloadData() {
    if (!childId) return;
    const supabase = createClient();
    const [{ data: responses }, { data: sessions }] = await Promise.all([
      supabase.from("question_responses").select("*").eq("child_id", childId),
      supabase.from("study_sessions").select("*").eq("child_id", childId),
    ]);
    const json = JSON.stringify({ question_responses: responses, study_sessions: sessions }, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "curiova_data.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function loadRawData() {
    if (!childId) return;
    setRawLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("question_responses")
      .select("id, question_type, is_correct, answered_at, time_taken_seconds")
      .eq("child_id", childId)
      .order("answered_at", { ascending: false })
      .limit(50);
    setRawData((data as RawResponse[]) ?? []);
    setRawLoading(false);
    setShowRawModal(true);
  }

  async function deleteData() {
    if (!childId) return;
    setProcessing(true);
    const res = await fetch("/api/account/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deleteType: "data_only" }),
    });
    const json = await res.json() as { success?: boolean };
    setProcessing(false);
    if (json.success) {
      setDeleteDataConfirm(false);
      setDone("Learning data deleted successfully.");
    }
  }

  async function deleteAccount() {
    if (deleteInput !== "DELETE") return;
    setProcessing(true);
    const res = await fetch("/api/account/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deleteType: "full_account" }),
    });
    const json = await res.json() as { success?: boolean };
    setProcessing(false);
    if (json.success) {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
    }
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
      <div className="mb-8">
        <h1 className="font-display font-extrabold text-cream text-3xl">Privacy Center 🔒</h1>
        <p className="font-body text-white/50 text-sm mt-1">
          Control how Curiova uses your family&apos;s data
        </p>
      </div>

      {done && (
        <div className="mb-6 rounded-xl p-4" style={{ background: "rgba(0,191,128,.1)", border: "1px solid rgba(0,191,128,.2)" }}>
          <p className="font-body text-mint text-sm">{done}</p>
        </div>
      )}

      {/* What we collect */}
      <section className="mb-8">
        <h2 className="font-display font-bold text-cream text-lg mb-3">What we collect</h2>
        <div className="grid gap-3">
          {[
            { icon: "📊", title: "Learning responses", desc: "Quiz answers, scores, time taken", purpose: "Used to personalise your child's learning" },
            { icon: "👤", title: "Profile info", desc: "Name, age, grade, curriculum", purpose: "Used to select appropriate content" },
            { icon: "⏱", title: "Session data", desc: "When sessions happen, duration", purpose: "Used to identify optimal study times" },
          ].map((item) => (
            <div key={item.title} className="rounded-xl p-4 flex gap-3" style={{ background: "#1C1917", border: "1px solid rgba(255,255,255,.07)" }}>
              <span className="text-2xl mt-0.5">{item.icon}</span>
              <div>
                <p className="font-body font-semibold text-cream text-sm">{item.title}</p>
                <p className="font-body text-white/40 text-[12px]">{item.desc}</p>
                <p className="font-body text-white/25 text-[11px] mt-0.5 italic">{item.purpose}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Your rights */}
      <section className="mb-8">
        <h2 className="font-display font-bold text-cream text-lg mb-3">Your rights</h2>
        <div className="grid gap-3">
          {/* Download */}
          <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: "#1C1917", border: "1px solid rgba(255,255,255,.07)" }}>
            <span className="text-xl mt-0.5">📥</span>
            <div className="flex-1">
              <p className="font-body font-semibold text-cream text-sm">Download all data</p>
              <p className="font-body text-white/40 text-[12px]">Get a JSON file with all responses and sessions</p>
            </div>
            <button
              onClick={() => void downloadData()}
              className="px-3 py-1.5 rounded-lg font-body text-[12px] font-semibold text-sky transition-colors hover:bg-sky/10"
              style={{ border: "1px solid rgba(43,127,255,.3)" }}
            >
              Export
            </button>
          </div>

          {/* View raw */}
          <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: "#1C1917", border: "1px solid rgba(255,255,255,.07)" }}>
            <span className="text-xl mt-0.5">🔍</span>
            <div className="flex-1">
              <p className="font-body font-semibold text-cream text-sm">View raw data</p>
              <p className="font-body text-white/40 text-[12px]">See the last 50 question responses</p>
            </div>
            <button
              onClick={() => void loadRawData()}
              className="px-3 py-1.5 rounded-lg font-body text-[12px] font-semibold text-grape transition-colors hover:bg-grape/10"
              style={{ border: "1px solid rgba(124,58,237,.3)" }}
            >
              View
            </button>
          </div>

          {/* Delete data */}
          <div className="rounded-xl p-4" style={{ background: "#1C1917", border: "1px solid rgba(255,255,255,.07)" }}>
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">🗑</span>
              <div className="flex-1">
                <p className="font-body font-semibold text-cream text-sm">Delete all learning data</p>
                <p className="font-body text-white/40 text-[12px]">Removes responses, sessions, mastery, and insights. Keeps your account.</p>
              </div>
              <button
                onClick={() => setDeleteDataConfirm((p) => !p)}
                className="px-3 py-1.5 rounded-lg font-body text-[12px] font-semibold text-amber-400 transition-colors hover:bg-amber-500/10"
                style={{ border: "1px solid rgba(245,158,11,.3)" }}
              >
                Delete data
              </button>
            </div>
            {deleteDataConfirm && (
              <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,.06)" }}>
                <p className="font-body text-amber-400 text-[12px] mb-2">
                  This cannot be undone. All learning progress will be permanently deleted.
                </p>
                <button
                  onClick={() => void deleteData()}
                  disabled={processing}
                  className="px-4 py-2 rounded-lg font-body text-[12px] font-bold text-white bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-50 transition-colors"
                >
                  {processing ? "Deleting…" : "Yes, delete my learning data"}
                </button>
              </div>
            )}
          </div>

          {/* Delete account */}
          <div className="rounded-xl p-4" style={{ background: "rgba(240,19,61,.04)", border: "1px solid rgba(240,19,61,.2)" }}>
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">❌</span>
              <div className="flex-1">
                <p className="font-body font-semibold text-rose text-sm">Delete account</p>
                <p className="font-body text-white/40 text-[12px]">Permanently deletes everything including your account. Cannot be undone.</p>
              </div>
              <button
                onClick={() => setDeleteAccountStep(1)}
                className="px-3 py-1.5 rounded-lg font-body text-[12px] font-semibold text-rose transition-colors hover:bg-rose/10"
                style={{ border: "1px solid rgba(240,19,61,.3)" }}
              >
                Delete
              </button>
            </div>
            {deleteAccountStep >= 1 && (
              <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(240,19,61,.15)" }}>
                <p className="font-body text-rose text-[12px] mb-2">
                  Type <strong>DELETE</strong> to confirm permanent account deletion:
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={deleteInput}
                    onChange={(e) => setDeleteInput(e.target.value)}
                    placeholder="Type DELETE"
                    className="flex-1 bg-white/[.06] rounded-lg px-3 py-2 font-body text-[13px] text-cream placeholder:text-white/25 outline-none focus:ring-1 focus:ring-rose"
                  />
                  <button
                    onClick={() => void deleteAccount()}
                    disabled={deleteInput !== "DELETE" || processing}
                    className="px-4 py-2 rounded-lg font-body text-[12px] font-bold text-white bg-rose/20 hover:bg-rose/30 disabled:opacity-40 transition-colors"
                  >
                    {processing ? "…" : "Confirm"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Compliance badges */}
      <section className="mb-8">
        <div className="flex flex-wrap gap-3">
          {["✅ COPPA compliant", "✅ India DPDP compliant", "🚫 No third-party advertising"].map((badge) => (
            <span
              key={badge}
              className="font-body text-[11px] text-white/50 px-3 py-1.5 rounded-full"
              style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)" }}
            >
              {badge}
            </span>
          ))}
        </div>
        <p className="font-body text-white/25 text-[11px] mt-3">
          Last updated: January 2025 · <a href="#" className="text-sky hover:underline">View full privacy policy</a>
        </p>
      </section>

      {/* Raw data modal */}
      {showRawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.7)" }}>
          <div className="w-full max-w-2xl rounded-2xl overflow-hidden" style={{ background: "#141210", border: "1px solid rgba(255,255,255,.1)" }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,.07)" }}>
              <h3 className="font-display font-bold text-cream text-base">Last 50 question responses</h3>
              <button onClick={() => setShowRawModal(false)} className="text-white/40 hover:text-cream text-lg">✕</button>
            </div>
            <div className="overflow-auto max-h-[60vh] p-4">
              {rawLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 rounded-full border-4 border-coral border-t-transparent animate-spin" />
                </div>
              ) : (
                <table className="w-full font-body text-[12px]">
                  <thead className="text-white/30 text-[10px] uppercase tracking-widest">
                    <tr>
                      <th className="text-left pb-2 pr-3">Type</th>
                      <th className="text-left pb-2 pr-3">Correct</th>
                      <th className="text-left pb-2 pr-3">Time</th>
                      <th className="text-left pb-2">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[.04]">
                    {rawData.map((r) => (
                      <tr key={r.id}>
                        <td className="py-2 pr-3 text-cream capitalize">{r.question_type}</td>
                        <td className="py-2 pr-3">
                          <span className={r.is_correct ? "text-mint" : "text-rose"}>
                            {r.is_correct ? "✓ Yes" : "✗ No"}
                          </span>
                        </td>
                        <td className="py-2 pr-3 text-white/50">{r.time_taken_seconds}s</td>
                        <td className="py-2 text-white/30">
                          {new Date(r.answered_at).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
