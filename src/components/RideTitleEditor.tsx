"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, X } from "lucide-react";
import { Button, Spinner } from "@/components/ui/Button";

/** Judul + catatan ride, bisa diubah langsung oleh pemiliknya. */
export function RideTitleEditor({
  rideId,
  title,
  note,
}: {
  rideId: string;
  title: string;
  note: string | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);
  const [draftNote, setDraftNote] = useState(note ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!draftTitle.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/rides/${rideId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: draftTitle, note: draftNote }),
      });
      if (res.ok) {
        setEditing(false);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div>
        <div className="flex items-start gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Ubah judul ride"
            className="mt-1 rounded-lg p-1.5 text-mist-600 transition-colors hover:bg-ink-800 hover:text-mist-100"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
        {note && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-mist-300">
            {note}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-3">
      <input
        value={draftTitle}
        onChange={(e) => setDraftTitle(e.target.value)}
        maxLength={80}
        autoFocus
        className="h-11 w-full rounded-xl border border-ink-700 bg-ink-800 px-4 text-lg font-medium focus:border-lime-400/70 focus:outline-none"
      />
      <textarea
        value={draftNote}
        onChange={(e) => setDraftNote(e.target.value)}
        rows={3}
        maxLength={500}
        placeholder="Catatan perjalanan (opsional)"
        className="w-full resize-none rounded-xl border border-ink-700 bg-ink-800 px-4 py-3 text-sm placeholder:text-mist-600 focus:border-lime-400/70 focus:outline-none"
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => void save()} disabled={saving}>
          {saving ? <Spinner className="h-3.5 w-3.5" /> : <Check className="h-4 w-4" />}
          Simpan
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setDraftTitle(title);
            setDraftNote(note ?? "");
            setEditing(false);
          }}
          disabled={saving}
        >
          <X className="h-4 w-4" />
          Batal
        </Button>
      </div>
    </div>
  );
}
