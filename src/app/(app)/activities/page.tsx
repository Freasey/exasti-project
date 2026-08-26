import type { Metadata } from "next";
import Link from "next/link";
import { Bike, Clock, Leaf, Mountain, Route } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { RideRow } from "@/components/RideRow";
import { buttonClass } from "@/components/ui/Button";
import { requireUser } from "@/lib/auth";
import { getRidesPage, getUserTotals } from "@/lib/queries";
import { formatDurationShort, formatKm, formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Aktivitas" };

const PAGE_SIZE = 12;

export default async function ActivitiesPage({
  searchParams,
}: PageProps<"/activities">) {
  const params = await searchParams;
  const rawPage = Array.isArray(params.page) ? params.page[0] : params.page;
  const page = Math.max(1, Number(rawPage ?? 1) || 1);

  const user = await requireUser();
  const [{ items, total }, totals] = await Promise.all([
    getRidesPage(user.id, PAGE_SIZE, (page - 1) * PAGE_SIZE),
    getUserTotals(user.id),
  ]);

  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-5xl space-y-5 py-4">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Aktivitas</h1>
          <p className="mt-1 text-sm text-mist-500">
            {formatNumber(total)} ride tersimpan
          </p>
        </div>
        <Link href="/ride" className={buttonClass("flame", "md")}>
          <Bike className="h-4 w-4" />
          Gowes sekarang
        </Link>
      </header>

      <Card className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
        <Summary
          icon={<Route className="h-4 w-4" />}
          label="Total jarak"
          value={formatKm(totals.distance_m, 0)}
          unit="km"
        />
        <Summary
          icon={<Clock className="h-4 w-4" />}
          label="Waktu gowes"
          value={formatDurationShort(totals.moving_s)}
        />
        <Summary
          icon={<Mountain className="h-4 w-4" />}
          label="Total elevasi"
          value={formatNumber(totals.elev_gain)}
          unit="m"
        />
        <Summary
          icon={<Leaf className="h-4 w-4" />}
          label="CO₂ dihemat"
          value={totals.co2_kg.toFixed(1)}
          unit="kg"
          accent
        />
      </Card>

      <Card>
        {items.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="text-mist-300">Belum ada aktivitas di halaman ini.</p>
            <Link
              href="/ride"
              className={buttonClass("primary", "md", "mt-4 inline-flex")}
            >
              Mulai ride pertama
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-ink-700">
            {items.map((ride) => (
              <RideRow key={ride.id} ride={ride} />
            ))}
          </ul>
        )}
      </Card>

      {lastPage > 1 && (
        <nav className="flex items-center justify-between">
          <PageLink page={page - 1} disabled={page <= 1}>
            Sebelumnya
          </PageLink>
          <span className="text-sm text-mist-500">
            Halaman {page} dari {lastPage}
          </span>
          <PageLink page={page + 1} disabled={page >= lastPage}>
            Berikutnya
          </PageLink>
        </nav>
      )}
    </div>
  );
}

function Summary({
  icon,
  label,
  value,
  unit,
  accent = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  accent?: boolean;
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs text-mist-500">
        <span className={accent ? "text-lime-400" : "text-mist-600"}>{icon}</span>
        {label}
      </p>
      <p
        className={`mt-1 text-xl font-semibold tracking-tight ${
          accent ? "text-lime-400" : ""
        }`}
      >
        {value}
        {unit && (
          <span className="ml-1 text-xs font-normal text-mist-500">{unit}</span>
        )}
      </p>
    </div>
  );
}

function PageLink({
  page,
  disabled,
  children,
}: {
  page: number;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span className={buttonClass("outline", "sm", "pointer-events-none opacity-40")}>
        {children}
      </span>
    );
  }
  return (
    <Link href={`/activities?page=${page}`} className={buttonClass("outline", "sm")}>
      {children}
    </Link>
  );
}
