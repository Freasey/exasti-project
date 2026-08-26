"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button, Spinner } from "@/components/ui/Button";
import { Field, FormError } from "@/components/ui/Field";

export function ProfileForm({
  name,
  username,
  email,
  city,
  bio,
  avatarUrl,
}: {
  name: string;
  username: string;
  email: string;
  city: string | null;
  bio: string | null;
  avatarUrl: string | null;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState(avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function uploadAvatar(file: File) {
    setUploading(true);
    setError(null);
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/profile/avatar", { method: "POST", body: form });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Gagal mengunggah foto.");
        setPreview(avatarUrl);
        return;
      }
      setPreview(data.url);
      router.refresh();
    } catch {
      setError("Tidak bisa terhubung ke server.");
      setPreview(avatarUrl);
    } finally {
      URL.revokeObjectURL(localPreview);
      setUploading(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          city: form.get("city"),
          bio: form.get("bio"),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Gagal menyimpan profil.");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Tidak bisa terhubung ke server.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && <FormError>{error}</FormError>}

      <div className="flex items-center gap-5">
        <div className="relative">
          <Avatar name={name} src={preview} size={84} ring />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            aria-label="Ganti foto profil"
            className="absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full border border-ink-700 bg-ink-850 text-mist-300 transition-colors hover:border-lime-400/50 hover:text-lime-400 disabled:opacity-60"
          >
            {uploading ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadAvatar(file);
              e.target.value = "";
            }}
          />
        </div>

        <div>
          <p className="font-medium">@{username}</p>
          <p className="text-sm text-mist-500">{email}</p>
          <p className="mt-1 text-xs text-mist-600">
            JPG, PNG, WEBP, atau AVIF — maksimal 4 MB.
          </p>
        </div>
      </div>

      <Field label="Nama" name="name" defaultValue={name} required minLength={2} />
      <Field label="Kota" name="city" defaultValue={city ?? ""} placeholder="Jakarta" />

      <div>
        <label htmlFor="bio" className="mb-1.5 block text-sm text-mist-300">
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          maxLength={300}
          defaultValue={bio ?? ""}
          placeholder="Ceritakan sedikit tentang kebiasaan gowesmu."
          className="w-full resize-none rounded-xl border border-ink-700 bg-ink-850 px-4 py-3 text-[15px] placeholder:text-mist-600 focus:border-lime-400/70 focus:outline-none focus:ring-2 focus:ring-lime-400/15"
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? <Spinner /> : <Check className="h-4 w-4" />}
          Simpan perubahan
        </Button>
        {saved && !saving && (
          <span className="text-sm text-lime-400">Tersimpan.</span>
        )}
      </div>
    </form>
  );
}
