import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Masuk" };

export default function LoginPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Masuk ke EcoCycle</h1>
      <p className="mt-1.5 text-sm text-mist-500">
        Lanjutkan perjalananmu dan kumpulkan poin hijau.
      </p>

      <LoginForm />

      <p className="mt-8 text-center text-sm text-mist-500">
        Belum punya akun?{" "}
        <Link
          href="/register"
          className="font-medium text-lime-400 hover:text-lime-300"
        >
          Daftar gratis
        </Link>
      </p>
    </div>
  );
}
