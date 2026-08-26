import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Gift,
  Leaf,
  MapPin,
  Radio,
  Trophy,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { CyclistScene } from "@/components/CyclistScene";
import { buttonClass } from "@/components/ui/Button";
import { getCurrentUser } from "@/lib/auth";
import { CO2_KG_PER_KM } from "@/lib/metrics";

const FEATURES = [
  {
    icon: Radio,
    title: "Live tracking",
    body: "Rekam rute lewat GPS browser. Jarak, kecepatan, dan waktu berjalan terus di layar.",
  },
  {
    icon: Leaf,
    title: "Karbon terhitung",
    body: `Tiap km sepeda = ${CO2_KG_PER_KM} kg CO₂ yang tidak jadi keluar dari knalpot mobil.`,
  },
  {
    icon: BarChart3,
    title: "Analytics & peta",
    body: "Tren mingguan, heatmap rute favorit, dan rekap performa dalam satu halaman.",
  },
  {
    icon: Gift,
    title: "Tukar reward",
    body: "Poin dari gowes bisa ditukar voucher Gojek, Tokopedia, Decathlon, dan lainnya.",
  },
  {
    icon: Trophy,
    title: "Leaderboard",
    body: "Bersaing sehat mingguan dan bulanan dengan rider lain di kotamu.",
  },
  {
    icon: MapPin,
    title: "Peta rider live",
    body: "Lihat siapa saja yang sedang gowes saat ini dan seberapa jauh mereka.",
  },
];

const STEPS = [
  { n: "01", t: "Daftar atau pakai akun demo", d: "Tidak perlu instal aplikasi, cukup buka di browser." },
  { n: "02", t: "Tekan Start Cycling", d: "Izinkan akses lokasi, lalu gowes seperti biasa." },
  { n: "03", t: "Simpan & kumpulkan poin", d: "Ride tersimpan lengkap dengan peta dan dampak karbonnya." },
];

export default async function LandingPage() {
  // Dicek ke database, bukan sekadar cookie: kalau user-nya sudah tidak ada
  // (mis. database di-reset), jangan lempar balik ke dashboard.
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <Logo />
        <nav className="flex items-center gap-2">
          <Link href="/login" className={buttonClass("ghost", "md")}>
            Masuk
          </Link>
          <Link href="/register" className={buttonClass("primary", "md")}>
            Daftar
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="eco-glow relative overflow-hidden border-y border-ink-700">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-[1.1fr_1fr] lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-lime-400/25 bg-lime-400/10 px-3.5 py-1.5 text-xs font-medium text-lime-300">
              <Leaf className="h-3.5 w-3.5" />
              Ride Green, Live Clean
            </span>

            <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Catat gowesmu.
              <br />
              <span className="text-lime-400">Hitung dampaknya.</span>
            </h1>

            <p className="mt-5 max-w-lg text-lg text-mist-500">
              EcoCycle adalah pelacak bersepeda real-time untuk kota. Rekam rute,
              lihat berapa kilogram CO₂ yang kamu hemat, dan ubah kebiasaan
              gowes jadi poin yang bisa ditukar.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className={buttonClass("flame", "lg")}>
                Mulai Gratis
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="/login" className={buttonClass("outline", "lg")}>
                Coba Akun Demo
              </Link>
            </div>

            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-4 border-t border-ink-700 pt-6">
              {[
                ["0.192 kg", "CO₂ hemat / km"],
                ["10 poin", "per kilometer"],
                ["Realtime", "tracking GPS"],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="text-xl font-semibold text-lime-400">{value}</dt>
                  <dd className="mt-0.5 text-xs text-mist-500">{label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative h-64 overflow-hidden rounded-2xl border border-ink-700 bg-ink-880 lg:h-80">
            <CyclistScene className="absolute inset-0 h-full w-full" />
          </div>
        </div>
      </section>

      {/* Fitur */}
      <section className="mx-auto max-w-6xl px-5 py-16 lg:py-24">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Semua yang dibutuhkan pesepeda kota
        </h2>
        <p className="mt-2 max-w-xl text-mist-500">
          Dibuat untuk perjalanan harian maupun long ride akhir pekan.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <article
              key={title}
              className="card p-6 transition-colors hover:border-lime-400/30"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-lime-400/10 text-lime-400 ring-1 ring-lime-400/20">
                <Icon className="h-5 w-5" strokeWidth={1.9} />
              </span>
              <h3 className="mt-4 font-medium">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-mist-500">{body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Cara kerja */}
      <section className="border-y border-ink-700 bg-ink-880">
        <div className="mx-auto max-w-6xl px-5 py-16 lg:py-20">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Tiga langkah saja
          </h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((step) => (
              <li key={step.n} className="relative pl-14">
                <span className="absolute left-0 top-0 grid h-10 w-10 place-items-center rounded-xl border border-lime-400/25 bg-lime-400/10 font-mono text-sm text-lime-400">
                  {step.n}
                </span>
                <p className="font-medium">{step.t}</p>
                <p className="mt-1 text-sm text-mist-500">{step.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="eco-glow card relative overflow-hidden px-8 py-14 text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Siap menghemat karbon pertamamu?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-mist-500">
            Buat akun dalam satu menit, atau lihat dulu isinya lewat akun demo.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/register" className={buttonClass("primary", "lg")}>
              Daftar Sekarang
            </Link>
            <Link href="/login" className={buttonClass("outline", "lg")}>
              Masuk
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-ink-700 px-5 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-mist-600 sm:flex-row">
          <Logo compact />
          <p>© {new Date().getFullYear()} EcoCycle. Ride Green, Live Clean.</p>
        </div>
      </footer>
    </div>
  );
}
