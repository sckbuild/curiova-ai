"use client";

import { useEffect, useRef } from "react";

interface Props {
  seconds: number;
  onExpire: () => void;
  active?: boolean;
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function TimerBadge({ seconds, onExpire, active = true }: Props) {
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (!active || seconds > 0) return;
    onExpireRef.current();
  }, [seconds, active]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const isWarning = seconds <= 15 && seconds > 0;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-body font-bold text-sm select-none transition-colors duration-300 ${
        isWarning
          ? "bg-rose text-white animate-pulse"
          : "bg-coral text-white"
      }`}
    >
      <span className="text-xs" aria-hidden>⏱</span>
      <span>
        {mins}:{pad(secs)}
      </span>
    </div>
  );
}
