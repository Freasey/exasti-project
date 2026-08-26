"use client";

import { useState } from "react";
import { ThumbsUp } from "lucide-react";

export function KudosButton({
  rideId,
  initialCount,
  initialGiven,
}: {
  rideId: string;
  initialCount: number;
  initialGiven: boolean;
}) {
  const [count, setCount] = useState(initialCount);
  const [given, setGiven] = useState(initialGiven);
  const [pending, setPending] = useState(false);

  async function toggle() {
    setPending(true);
    // Optimistic: UI berubah dulu, di-rollback kalau server menolak.
    const prev = { count, given };
    setGiven(!given);
    setCount(count + (given ? -1 : 1));

    try {
      const res = await fetch(`/api/rides/${rideId}/kudos`, { method: "POST" });
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { given: boolean; count: number };
      setGiven(data.given);
      setCount(data.count);
    } catch {
      setGiven(prev.given);
      setCount(prev.count);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      disabled={pending}
      aria-pressed={given}
      className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm transition-colors disabled:opacity-60 ${
        given
          ? "border-lime-400/40 bg-lime-400/10 text-lime-300"
          : "border-ink-700 bg-ink-800 text-mist-300 hover:border-ink-600 hover:text-mist-100"
      }`}
    >
      <ThumbsUp className={`h-4 w-4 ${given ? "fill-current" : ""}`} />
      {count}
    </button>
  );
}
