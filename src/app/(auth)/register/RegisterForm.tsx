"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AtSign, Lock, MapPin, User } from "lucide-react";
import { Button, Spinner } from "@/components/ui/Button";
import { Field, FormError } from "@/components/ui/Field";

export function RegisterForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          password: form.get("password"),
          city: form.get("city"),
        }),
      });
      const data = (await res.json()) as { error?: string; redirect?: string };
      if (!res.ok) {
        setError(data.error ?? "Gagal mendaftar. Coba lagi.");
        setPending(false);
        return;
      }
      router.replace(data.redirect ?? "/dashboard");
      router.refresh();
    } catch {
      setError("Tidak bisa terhubung ke server.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      {error && <FormError>{error}</FormError>}

      <Field
        label="Nama lengkap"
        name="name"
        autoComplete="name"
        placeholder="Nama kamu"
        required
        minLength={2}
        icon={<User className="h-4 w-4" />}
      />
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="kamu@email.com"
        required
        icon={<AtSign className="h-4 w-4" />}
      />
      <Field
        label="Kata sandi"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="Minimal 8 karakter"
        required
        minLength={8}
        icon={<Lock className="h-4 w-4" />}
        hint="Gunakan minimal 8 karakter."
      />
      <Field
        label="Kota"
        name="city"
        placeholder="Jakarta"
        icon={<MapPin className="h-4 w-4" />}
      />

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending && <Spinner />}
        {pending ? "Membuat akun..." : "Daftar & Mulai Gowes"}
      </Button>

      <p className="text-center text-xs text-mist-600">
        Dengan mendaftar kamu setuju data perjalananmu disimpan untuk menghitung
        statistik dan poin.
      </p>
    </form>
  );
}
