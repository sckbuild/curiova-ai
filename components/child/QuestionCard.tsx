"use client";

import type { Question, ObjectiveOption } from "@/types/learning";

interface Props {
  question: Question;
  selectedAnswer: string | null;
  submitted: boolean;
  onSelect: (answer: string) => void;
}

// ─── Objective option tile ────────────────────────────────────────────────────

interface TileProps {
  opt: ObjectiveOption;
  selected: boolean;
  submitted: boolean;
  correctKey: string;
  onSelect: () => void;
}

function OptionTile({ opt, selected, submitted, correctKey, onSelect }: TileProps) {
  const isCorrect = opt.key === correctKey;
  const isSelectedWrong = submitted && selected && !isCorrect;
  const isCorrectReveal = submitted && isCorrect;

  let cls =
    "flex items-center gap-3 px-4 py-3.5 rounded-xl border-[1.5px] cursor-pointer transition-all duration-150 ";

  if (submitted) {
    if (isCorrectReveal) {
      cls += "border-mint bg-mint/12 translate-x-0";
    } else if (isSelectedWrong) {
      cls += "border-rose bg-rose/10";
    } else {
      cls += "border-ink/10 bg-cream/40 opacity-50";
    }
  } else if (selected) {
    cls += "border-coral bg-coral/8 translate-x-1";
  } else {
    cls += "border-ink/12 bg-white hover:border-coral hover:translate-x-1";
  }

  let letterCls =
    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-display font-bold shrink-0 transition-colors ";
  if (submitted && isCorrectReveal) {
    letterCls += "bg-mint text-white";
  } else if (submitted && isSelectedWrong) {
    letterCls += "bg-rose text-white";
  } else if (selected) {
    letterCls += "bg-coral text-white";
  } else {
    letterCls += "bg-ink/8 text-ink/60";
  }

  return (
    <div
      role="button"
      aria-pressed={selected}
      tabIndex={submitted ? -1 : 0}
      onClick={submitted ? undefined : onSelect}
      onKeyDown={(e) => !submitted && e.key === "Enter" && onSelect()}
      className={cls}
      style={{ pointerEvents: submitted ? "none" : "auto" }}
    >
      <span className={letterCls}>{opt.key}</span>
      <span className="font-child text-[16px] font-medium text-ink leading-snug">
        {opt.text}
      </span>
    </div>
  );
}

// ─── FillBlank input ──────────────────────────────────────────────────────────

interface FillBlankProps {
  questionText: string;
  value: string;
  submitted: boolean;
  onChange: (v: string) => void;
}

function FillBlankInput({ questionText, value, submitted, onChange }: FillBlankProps) {
  const parts = questionText.split("[BLANK]");
  return (
    <div className="flex flex-col gap-5">
      <p className="font-child text-xl text-ink leading-relaxed text-center">
        {parts[0]}
        <span className="inline-block min-w-[120px] border-b-[3px] border-coral mx-2 pb-1 align-bottom">
          {value && (
            <span className="font-child text-coral font-semibold">{value}</span>
          )}
        </span>
        {parts[1]}
      </p>
      {!submitted && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your answer here…"
          className="w-full text-center font-child text-2xl text-ink bg-transparent border-b-[3px] border-coral/40 focus:border-coral outline-none py-2 placeholder:text-muted/60 transition-colors"
          autoFocus
        />
      )}
    </div>
  );
}

// ─── Main QuestionCard ─────────────────────────────────────────────────────────

export function QuestionCard({ question, selectedAnswer, submitted, onSelect }: Props) {
  if (question.type === "micro_puzzle") return null; // handled separately

  return (
    <div className="bg-white rounded-xl shadow-md p-6 flex flex-col gap-5">
      <div>
        <p className="font-body text-[11px] uppercase tracking-widest text-muted mb-2">
          {question.type === "objective" ? "Choose the best answer" : "Fill in the blank"}
        </p>
        {question.type === "objective" && (
          <p className="font-child font-semibold text-[22px] text-ink leading-snug">
            {question.question_text}
          </p>
        )}
      </div>

      {question.type === "objective" && (
        <div className="flex flex-col gap-2.5">
          {question.options.map((opt) => (
            <OptionTile
              key={opt.key}
              opt={opt}
              selected={selectedAnswer === opt.key}
              submitted={submitted}
              correctKey={question.correct_key}
              onSelect={() => onSelect(opt.key)}
            />
          ))}
        </div>
      )}

      {question.type === "fill_blank" && (
        <FillBlankInput
          questionText={question.question_text}
          value={selectedAnswer ?? ""}
          submitted={submitted}
          onChange={onSelect}
        />
      )}
    </div>
  );
}
