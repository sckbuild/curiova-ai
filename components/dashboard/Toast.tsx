"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface ToastProps {
  message: string;
  type?: "success" | "info" | "celebration";
  onDismiss: () => void;
  duration?: number;
}

export function Toast({ message, type = "info", onDismiss, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [onDismiss, duration]);

  const cls = {
    success: "border-green-500/30 bg-green-500/10",
    info: "border-white/10 bg-[#1C1917]",
    celebration: "border-coral/30 bg-coral/10",
  }[type];

  return (
    <motion.div
      initial={{ x: 120, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 120, opacity: 0 }}
      transition={{ duration: 0.3, ease: EASE }}
      className={`fixed bottom-6 right-6 z-50 max-w-sm rounded-xl border px-4 py-3 shadow-xl backdrop-blur-sm cursor-pointer ${cls}`}
      onClick={onDismiss}
    >
      <p className="font-body text-sm text-cream leading-snug">{message}</p>
    </motion.div>
  );
}
