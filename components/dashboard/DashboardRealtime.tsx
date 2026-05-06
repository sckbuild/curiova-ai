"use client";

import { useEffect, useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Toast } from "@/components/dashboard/Toast";

interface ToastItem {
  id: string;
  message: string;
  type: "success" | "info" | "celebration";
}

interface DashboardRealtimeProps {
  childId: string;
  childName: string;
}

export function DashboardRealtime({ childId, childName }: DashboardRealtimeProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string, type: ToastItem["type"] = "info") => {
    const id = `${Date.now()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    if (!childId) return;
    const supabase = createClient();

    // Subscribe to study_sessions
    const sessChannel = supabase
      .channel("dash_sessions")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "study_sessions",
          filter: `child_id=eq.${childId}`,
        },
        (payload) => {
          if (
            payload.eventType === "UPDATE" &&
            (payload.new as { completed_at?: string | null }).completed_at
          ) {
            addToast(
              `✨ Updated just now — ${childName} just completed a session!`,
              "success"
            );
          }
        }
      )
      .subscribe();

    // Subscribe to streaks
    const streakChannel = supabase
      .channel("dash_streaks")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "streaks",
          filter: `child_id=eq.${childId}`,
        },
        (payload) => {
          const newStreak = (payload.new as { current_streak?: number }).current_streak ?? 0;
          const oldStreak = (payload.old as { current_streak?: number }).current_streak ?? 0;
          if (newStreak > oldStreak) {
            addToast(
              `🔥 ${childName} is on a ${newStreak}-day streak!`,
              "celebration"
            );
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(sessChannel);
      void supabase.removeChannel(streakChannel);
    };
  }, [childId, childName, addToast]);

  return (
    <AnimatePresence>
      {toasts.map((t) => (
        <Toast
          key={t.id}
          message={t.message}
          type={t.type}
          onDismiss={() => dismissToast(t.id)}
        />
      ))}
    </AnimatePresence>
  );
}
