"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Leaf, Lock, PartyPopper } from "lucide-react";
import { Button, Spinner } from "@/components/ui/Button";
import { formatNumber } from "@/lib/format";
import type { Reward } from "@/lib/types";

type Result = {
  code: string;
  reward: { brand: string; title: string; value: string };
};

export function RedeemButton({
  reward,
  balance,
}: {
  reward: Reward;
  balance: number;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const affordable = balance >= reward.points_cost;
  const outOfStock = reward.stock <= 0;

  async function redeem() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/rewards/redeem", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rewardId: reward.id }),
      });
      const data = (await res.json()) as Result & { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Gagal menukar reward.");
        return;
      }
      setResult(data);
      router.refresh();
    } catch {
      setError("Tidak bisa terhubung ke server.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant={affordable && !outOfStock ? "primary" : "outline"}
        className="w-full"
        disabled={!affordable || outOfStock || pending}
        onClick={() => void redeem()}
      >
        {pending ? (
          <Spinner className="h-3.5 w-3.5" />
        ) : affordable && !outOfStock ? (
          <Leaf className="h-3.5 w-3.5" />
        ) : (
          <Lock className="h-3.5 w-3.5" />
        )}
        {outOfStock
          ? "Stok habis"
          : `${formatNumber(reward.points_cost)} PTS`}
      </Button>

      {error && <p className="mt-2 text-[11px] text-red-300">{error}</p>}

      {result && (
        <SuccessDialog result={result} onClose={() => setResult(null)} />
      )}
    </>
  );
}

function SuccessDialog({
  result,
  onClose,
}: {
  result: Result;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[1000] grid place-items-center bg-ink-950/70 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-sm rounded-2xl border border-ink-700 bg-ink-850 p-6 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-lime-400/10 text-lime-400 ring-1 ring-lime-400/20">
          <PartyPopper className="h-7 w-7" />
        </span>
        <h2 className="mt-4 text-lg font-semibold">Reward berhasil ditukar!</h2>
        <p className="mt-1 text-sm text-mist-500">
          {result.reward.brand} · {result.reward.value}
        </p>

        <button
          type="button"
          onClick={() => {
            void navigator.clipboard?.writeText(result.code);
            setCopied(true);
          }}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-lime-400/40 bg-lime-400/[0.07] px-4 py-4 font-mono text-lg tracking-widest text-lime-300 transition-colors hover:bg-lime-400/10"
        >
          {result.code}
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4 opacity-60" />
          )}
        </button>
        <p className="mt-2 text-[11px] text-mist-600">
          {copied ? "Kode disalin!" : "Klik untuk menyalin kode voucher"}
        </p>

        <Button className="mt-5 w-full" onClick={onClose}>
          Selesai
        </Button>
      </div>
    </div>
  );
}
