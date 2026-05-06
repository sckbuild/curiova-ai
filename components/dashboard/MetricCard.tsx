"use client";

import { motion } from "framer-motion";

interface MetricCardProps {
  icon: string;
  label: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  delta?: string;
  deltaDirection?: "up" | "down" | "neutral";
  loading?: boolean;
  children?: React.ReactNode;
}

export function MetricCard({
  icon, label, value, unit, subtext, delta, deltaDirection, children,
}: MetricCardProps) {
  return (
    <motion.div
      whileHover={{ borderColor: "rgba(255,255,255,.12)" }}
      className="bg-[#1C1917] rounded-lg p-5 flex flex-col gap-3 cursor-default"
      style={{ border: "1px solid rgba(255,255,255,.07)" }}
    >
      <div className="flex items-start justify-between">
        <span className="text-2xl">{icon}</span>
        {delta && (
          <span
            className={`font-body text-[11px] font-medium px-2 py-0.5 rounded-full ${
              deltaDirection === "up"
                ? "bg-green-500/15 text-green-400"
                : deltaDirection === "down"
                ? "bg-amber-500/15 text-amber-400"
                : "bg-white/5 text-white/40"
            }`}
          >
            {deltaDirection === "up" ? "↑" : deltaDirection === "down" ? "↓" : ""} {delta}
          </span>
        )}
      </div>
      <div>
        <p className="font-body text-[10px] uppercase tracking-widest text-white/40 mb-1">{label}</p>
        <div className="flex items-end gap-1.5">
          <span className="font-display font-extrabold text-white text-3xl leading-none">{value}</span>
          {unit && <span className="font-body text-white/50 text-sm mb-0.5">{unit}</span>}
        </div>
        {subtext && <p className="font-body text-white/40 text-[11px] mt-1">{subtext}</p>}
      </div>
      {children}
    </motion.div>
  );
}
