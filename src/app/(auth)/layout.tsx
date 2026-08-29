import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Leaf, MapPin, Trophy } from "lucide-react";
import { Logo } from "@/components/Logo";
import { CyclistScene } from "@/components/CyclistScene";
import { getCurrentUser } from "@/lib/auth";

const HIGHLIGHTS = [
  {
    icon: MapPin,
    title: "Live tracking GPS",
    body: "Rute, jarak, dan kecepatan terekam real-time selama kamu gowes.",
  },
  {
    icon: Leaf,
    title: "Hitung karbon otomatis",
    body: "Tiap kilometer diubah jadi CO₂ yang berhasil kamu hindari.",
  },
  {
    icon: Trophy,
    title: "Poin & reward nyata",
    body: "Kumpulkan poin, naik level, tukar dengan voucher partner.",
  },
];

export default async function AuthLayout({ children }: { children: ReactNode }) {
  // Dicek ke database, bukan sekadar cookie: kalau user-nya sudah tidak ada
  // (mis. database di-reset), jangan lempar balik ke dashboard.
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Panel brand - desktop saja */}
      <section className="eco-glow relative hidden overflow-hidden border-r border-ink-700 bg-ink-880 lg:flex lg:flex-col">
        <div className="relative z-10 px-12 pt-12">
          <Logo />
        </div>

        <div className="relative z-10 flex flex-1 flex-col justify-center px-12">
          <h1 className="max-w-md text-4xl font-semibold leading-tight tracking-tight">
            Setiap kayuhan menghemat{" "}
            <span className="text-lime-400">karbon kota</span>.
          </h1>
          <p className="mt-4 max-w-md text-mist-500">
            EcoCycle mencatat perjalanan sepedamu, menghitung dampaknya bagi
            lingkungan, dan mengubahnya jadi poin yang bisa ditukar.
          </p>

          <ul className="mt-10 space-y-5">
            {HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-lime-400/10 text-lime-400 ring-1 ring-lime-400/20">
                  <Icon className="h-5 w-5" strokeWidth={1.9} />
                </span>
                <div>
                  <p className="font-medium">{title}</p>
                  <p className="text-sm text-mist-500">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <CyclistScene className="pointer-events-none absolute inset-x-0 bottom-0 h-56 w-full opacity-90" />
      </section>

      {/* Form */}
      <section className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          {children}
        </div>
      </section>
    </div>
  );
}
