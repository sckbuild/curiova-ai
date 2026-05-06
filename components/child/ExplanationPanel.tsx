"use client";

import { motion } from "framer-motion";

interface Props {
  isCorrect: boolean;
  score: number;
  explanation: string;
  hint: string | null;
  onNext: () => void;
  nextLabel?: string;
}

export function ExplanationPanel({ isCorrect, score, explanation, hint, onNext, nextLabel }: Props) {
  const correct = isCorrect || score >= 2;

  return (
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className={`rounded-xl border p-5 ${
        correct
          ? "bg-mint/8 border-mint/40"
          : "bg-coral/8 border-coral/40"
      }`}
    >
      <div className="flex items-start gap-3 mb-3">
        <span className="text-2xl">{correct ? "🎉" : "🤝"}</span>
        <div>
          <p
            className={`font-display font-bold text-lg leading-tight ${
              correct ? "text-mint" : "text-coral"
            }`}
          >
            {correct ? "PERFECT! You nailed it!" : "So close! Let's crack it together"}
          </p>
          {score === 2 && !isCorrect && (
            <span className="font-body text-xs text-sun font-medium">
              Right idea, tiny slip — still great thinking!
            </span>
          )}
        </div>
      </div>

      <p className="font-body text-ink/80 text-[15px] leading-relaxed mb-1">
        {explanation}
      </p>

      {hint && !correct && (
        <div className="mt-3 px-3 py-2 bg-sun/10 border border-sun/30 rounded-lg">
          <p className="font-body text-sm text-ink/70">
            <span className="font-semibold">💡 Tip: </span>{hint}
          </p>
        </div>
      )}

      <button
        onClick={onNext}
        className={`mt-4 w-full py-3 rounded-xl font-child font-bold text-lg text-white transition-all duration-150 hover:-translate-y-0.5 ${
          correct
            ? "bg-mint hover:bg-[#00a870]"
            : "bg-coral hover:bg-[#e6441f]"
        }`}
      >
        {nextLabel ?? (correct ? "Onwards! Next question →" : "Got it — bring it on! →")}
      </button>
    </motion.div>
  );
}
