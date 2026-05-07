"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import type { MicroPuzzleQuestion } from "@/types/learning";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface Props {
  puzzle: MicroPuzzleQuestion;
  onComplete: (isCorrect: boolean) => void;
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

// ─── Number Puzzle ──────────────────────────────────────────────────────────

function NumberPuzzle({
  data,
  onSubmit,
}: {
  data: { numbers?: number[]; target?: number };
  onSubmit: (answer: string) => void;
}) {
  const numbers = data.numbers ?? [2, 3, 5, 7, 4, 6];
  const target = data.target ?? 10;
  const [selected, setSelected] = useState<number[]>([]);

  const sum = selected.reduce((a, b) => a + b, 0);

  function toggle(i: number) {
    setSelected((s) =>
      s.includes(i) ? s.filter((x) => x !== i) : [...s, i]
    );
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <p className="font-body text-white/60 text-sm">
        Target: <span className="text-sun font-bold text-2xl">{target}</span>
      </p>
      <div className="grid grid-cols-3 gap-3">
        {numbers.map((n, i) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            className={`w-16 h-16 rounded-xl font-display font-bold text-xl transition-all ${
              selected.includes(i)
                ? "bg-sun text-ink scale-105"
                : "bg-white/15 text-white hover:bg-white/25"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <p className="font-body text-white/70">
        Sum: <span className={`font-bold text-xl ${sum === target ? "text-mint" : "text-white"}`}>{sum}</span>
      </p>
      <button
        onClick={() => onSubmit(sum.toString())}
        disabled={selected.length === 0}
        className="w-full py-3 rounded-xl bg-sun text-ink font-child font-bold text-lg hover:bg-[#e6ab00] transition-colors disabled:opacity-40"
      >
        Submit answer ✓
      </button>
    </div>
  );
}

// ─── Word Puzzle ────────────────────────────────────────────────────────────

function WordPuzzle({
  data,
  onSubmit,
}: {
  data: { scrambled?: string; word_hint?: string };
  onSubmit: (answer: string) => void;
}) {
  const letters = (data.scrambled ?? "WORD").split("");
  const [used, setUsed] = useState<number[]>([]);

  const built = used.map((i) => letters[i]).join("");

  function addLetter(i: number) {
    if (!used.includes(i)) setUsed((u) => [...u, i]);
  }

  function removeLast() {
    setUsed((u) => u.slice(0, -1));
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {data.word_hint && (
        <p className="font-body text-white/50 text-sm italic">{data.word_hint}</p>
      )}

      {/* Answer area */}
      <div className="flex gap-2 min-h-[52px] items-center flex-wrap justify-center">
        {built.split("").map((l, i) => (
          <span
            key={i}
            className="w-10 h-12 flex items-center justify-center bg-sun text-ink rounded-lg font-display font-bold text-xl"
          >
            {l}
          </span>
        ))}
        {built.length === 0 && (
          <span className="text-white/30 font-body text-sm">Tap letters below to build your answer</span>
        )}
      </div>

      {/* Source letters */}
      <div className="flex gap-2 flex-wrap justify-center">
        {letters.map((l, i) => (
          <button
            key={i}
            onClick={() => addLetter(i)}
            disabled={used.includes(i)}
            className={`w-10 h-12 rounded-lg font-display font-bold text-xl transition-all ${
              used.includes(i)
                ? "bg-white/10 text-white/20"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="flex gap-3 w-full">
        <button
          onClick={removeLast}
          disabled={used.length === 0}
          className="flex-1 py-3 rounded-xl bg-white/15 text-white font-child font-bold hover:bg-white/25 transition-colors disabled:opacity-30"
        >
          ← Undo
        </button>
        <button
          onClick={() => onSubmit(built)}
          disabled={built.length === 0}
          className="flex-1 py-3 rounded-xl bg-sun text-ink font-child font-bold hover:bg-[#e6ab00] transition-colors disabled:opacity-40"
        >
          Submit ✓
        </button>
      </div>
    </div>
  );
}

// ─── Pattern Puzzle ─────────────────────────────────────────────────────────

function PatternPuzzle({
  data,
  onSubmit,
}: {
  data: { pattern?: string[] };
  onSubmit: (answer: string) => void;
}) {
  const pattern = data.pattern ?? ["2", "4", "6", "?"];
  const [answer, setAnswer] = useState("");

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex gap-3 flex-wrap justify-center">
        {pattern.map((item, i) => (
          <span
            key={i}
            className={`w-14 h-14 rounded-xl flex items-center justify-center font-display font-bold text-xl ${
              item === "?"
                ? "bg-sun/30 text-sun border-2 border-sun animate-pulse"
                : "bg-white/20 text-white"
            }`}
          >
            {item}
          </span>
        ))}
      </div>
      <input
        type="text"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="What comes next?"
        className="w-full text-center bg-white/15 text-white placeholder:text-white/40 border border-white/20 rounded-xl py-3 px-4 font-child text-xl focus:outline-none focus:border-sun"
        autoFocus
      />
      <button
        onClick={() => onSubmit(answer)}
        disabled={!answer.trim()}
        className="w-full py-3 rounded-xl bg-sun text-ink font-child font-bold hover:bg-[#e6ab00] transition-colors disabled:opacity-40"
      >
        Submit answer ✓
      </button>
    </div>
  );
}

// ─── Main MicroPuzzle ────────────────────────────────────────────────────────

export function MicroPuzzle({ puzzle, onComplete }: Props) {
  const [timeLeft, setTimeLeft] = useState(30);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = useCallback(
    (userAnswer: string) => {
      if (submitted) return;
      setSubmitted(true);
      const isCorrect =
        userAnswer.trim().toLowerCase() ===
        puzzle.correct_answer.trim().toLowerCase();
      onComplete(isCorrect);
    },
    [submitted, puzzle, onComplete]
  );

  useEffect(() => {
    if (submitted) return;
    if (timeLeft <= 0) {
      handleSubmit("");
      return;
    }
    const t = setInterval(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft, submitted, handleSubmit]);

  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6"
      style={{ background: "linear-gradient(135deg, #4a1d96 0%, #7c3aed 50%, #f0134d 100%)" }}
    >
      {/* Timer */}
      <div className="absolute top-6 right-6">
        <span className={`font-body font-bold text-lg px-3 py-1 rounded-full ${timeLeft <= 10 ? "bg-rose text-white animate-pulse" : "bg-white/20 text-white"}`}>
          ⏱ {pad(timeLeft)}
        </span>
      </div>

      {/* Badge */}
      <div className="bg-white/20 border border-white/30 rounded-full px-4 py-1.5 mb-4">
        <span className="text-white font-body font-semibold text-sm">
          🧩 Brain Break · Bonus XP round!
        </span>
      </div>

      {/* Brain emoji */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: EASE }}
        className="text-5xl mb-3"
        aria-hidden
      >
        🧠
      </motion.div>

      <h2 className="font-display font-bold text-2xl text-white text-center mb-1">
        {puzzle.title}
      </h2>
      <p className="font-body text-white/70 text-center text-sm mb-6 max-w-sm">
        {puzzle.instruction}
      </p>

      <div className="w-full max-w-sm">
        {puzzle.puzzle_type === "number" && (
          <NumberPuzzle data={puzzle.puzzle_data} onSubmit={handleSubmit} />
        )}
        {puzzle.puzzle_type === "word" && (
          <WordPuzzle data={puzzle.puzzle_data} onSubmit={handleSubmit} />
        )}
        {puzzle.puzzle_type === "pattern" && (
          <PatternPuzzle data={puzzle.puzzle_data} onSubmit={handleSubmit} />
        )}
      </div>

      {/* Hint */}
      {puzzle.hint && (
        <p className="mt-5 font-body text-white/40 text-xs text-center">
          💡 Hint: {puzzle.hint}
        </p>
      )}
    </motion.div>
  );
}
