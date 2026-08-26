import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { pingRide } from "@/lib/rides";

export const runtime = "nodejs";

type Body = {
  lat?: number;
  lng?: number;
  distanceM?: number;
  durationS?: number;
  movingS?: number;
  avgSpeed?: number;
  polyline?: [number, number][];
};

/** Denyut posisi tiap ~15 detik agar rider muncul di peta Live Riders. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as Body;

  if (typeof body.lat !== "number" || typeof body.lng !== "number") {
    return NextResponse.json({ error: "Koordinat tidak valid." }, { status: 400 });
  }

  await pingRide(id, user.id, {
    lat: body.lat,
    lng: body.lng,
    distanceM: Number(body.distanceM ?? 0),
    durationS: Number(body.durationS ?? 0),
    movingS: Number(body.movingS ?? 0),
    avgSpeed: Number(body.avgSpeed ?? 0),
    // Simpan maksimal 200 titik terakhir untuk pratinjau di peta live.
    polyline: (body.polyline ?? []).slice(-200),
  });

  return NextResponse.json({ ok: true });
}
