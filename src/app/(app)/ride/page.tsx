import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getActiveRide } from "@/lib/queries";
import { RideTracker } from "./RideTracker";

export const metadata: Metadata = { title: "Live Tracking" };

export default async function RidePage() {
  const user = await requireUser();
  const active = await getActiveRide(user.id);

  return <RideTracker activeRideId={active?.id ?? null} />;
}
