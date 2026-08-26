import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = { title: "Daftar" };

export default function RegisterPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Buat akun EcoCycle</h1>
      <p className="mt-1.5 text-sm text-mist-500">
        Gratis. Cukup satu menit, lalu langsung gowes.
      </p>

      <RegisterForm />

      <p className="mt-8 text-center text-sm text-mist-500">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-medium text-lime-400 hover:text-lime-300">
          Masuk di sini
        </Link>
      </p>
    </div>
  );
}
