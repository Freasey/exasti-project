import Link from "next/link";
import { Compass } from "lucide-react";
import { Logo } from "@/components/Logo";
import { buttonClass } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="eco-glow grid min-h-screen place-items-center px-5">
      <div className="text-center">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-lime-400/10 text-lime-400 ring-1 ring-lime-400/20">
          <Compass className="h-8 w-8" />
        </span>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">
          Rute ini tidak ditemukan
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-mist-500">
          Halaman yang kamu cari sudah dipindah atau memang belum pernah ada.
        </p>
        <div className="mt-7 flex justify-center gap-3">
          <Link href="/dashboard" className={buttonClass("primary", "md")}>
            Ke Dashboard
          </Link>
          <Link href="/" className={buttonClass("outline", "md")}>
            Halaman utama
          </Link>
        </div>
      </div>
    </div>
  );
}
