"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

export function QuoteCountdown({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState<string>("");

  useEffect(() => {
    const target = new Date(expiresAt).getTime();
    const update = () => {
      const diff = target - Date.now();
      if (diff <= 0) return setRemaining("Expired");
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setRemaining(`${mins}m ${secs.toString().padStart(2, "0")}s`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return (
    <p className="text-xs text-[var(--ink-2)] flex items-center justify-center gap-1.5">
      <Clock className="h-3.5 w-3.5" /> Price locked for {remaining}
    </p>
  );
}
