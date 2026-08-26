"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AtSign, Lock, Sparkles } from "lucide-react";
import { Button, Spinner } from "@/components/ui/Button";
import { Field, FormError } from "@/components/ui/Field";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/constants";

type Pending = "none" | "login" | "demo";

export function LoginForm() {
  const router = useRouter();
  const [pending, setPending] = useState<Pending>("none");
  const [error, setError] = useState<string | null>(null);

  async function submit(url: string, body: unknown, mode: Pending) {
    setPending(mode);
    setError(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { error?: string; redirect?: string };
      if (!res.ok) {
        setError(data.error ?? "Terjadi kesalahan. Coba lagi.");
        setPending("none");
        return;
      }
      router.replace(data.redirect ?? "/dashboard");
      router.refresh();
    } catch {
      setError("Tidak bisa terhubung ke server.");
      setPending("none");
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void submit(
      "/api/auth/login",
      { email: form.get("email"), password: form.get("password") },
      "login"
    );
  }

  const busy = pending !== "none";

  return (
    <>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        {error && <FormError>{error}</FormError>}

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
          autoComplete="current-password"
          placeholder="••••••••"
          required
          icon={<Lock className="h-4 w-4" />}
        />

        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {pending === "login" ? <Spinner /> : null}
          {pending === "login" ? "Memproses..." : "Masuk"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-mist-600">
        <span className="h-px flex-1 bg-ink-700" />
        atau
        <span className="h-px flex-1 bg-ink-700" />
      </div>

      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        disabled={busy}
        onClick={() => void submit("/api/auth/demo", {}, "demo")}
      >
        {pending === "demo" ? (
          <Spinner />
        ) : (
          <Sparkles className="h-4 w-4 text-lime-400" />
        )}
        {pending === "demo" ? "Menyiapkan data demo..." : "Coba Akun Demo"}
      </Button>

      <p className="mt-3 text-center text-xs text-mist-600">
        Masuk langsung dengan data contoh — {DEMO_EMAIL} / {DEMO_PASSWORD}
      </p>
    </>
  );
}
