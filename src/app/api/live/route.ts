import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getLiveRiders } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Daftar rider yang sedang gowes — dipanggil berkala oleh peta live. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  }

  const riders = await getLiveRiders();
  return NextResponse.json({ riders, at: new Date().toISOString() });
}
