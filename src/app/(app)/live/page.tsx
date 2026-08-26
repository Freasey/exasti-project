import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getLiveRiders } from "@/lib/queries";
import { LiveRiders } from "./LiveRiders";

export const metadata: Metadata = { title: "Live Riders" };

export default async function LivePage() {
  await requireUser();
  const riders = await getLiveRiders();

  return (
    <div className="mx-auto max-w-[1400px] space-y-4 py-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Live Riders</h1>
        <p className="mt-1 text-sm text-mist-500">
          Peta rider EcoCycle yang sedang mengayuh saat ini.
        </p>
      </header>

      <LiveRiders initial={riders} />
    </div>
  );
}
