import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { finishRide } from "@/lib/rides";
import type { TrackPoint } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

type Body = {
  track?: TrackPoint[];
  title?: string;
  note?: string;
};

const MAX_POINTS = 50_000;

function sanitize(track: TrackPoint[]): TrackPoint[] {
  return track
    .filter(
      (p) =>
        typeof p?.lat === "number" &&
        typeof p?.lng === "number" &&
        typeof p?.t === "number" &&
        Math.abs(p.lat) <= 90 &&
        Math.abs(p.lng) <= 180
    )
    .sort((a, b) => a.t - b.t)
    .slice(0, MAX_POINTS);
}

/** Menutup ride: statistik final dihitung ulang di server dari track mentah. */
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
  const track = sanitize(body.track ?? []);

  if (track.length < 2) {
    return NextResponse.json(
      { error: "Rute terlalu pendek untuk disimpan." },
      { status: 400 }
    );
  }

  try {
    const result = await finishRide(id, user.id, track, {
      title: body.title?.trim().slice(0, 80) || undefined,
      note: body.note?.trim().slice(0, 500) || null,
    });

    return NextResponse.json({
      ok: true,
      rideId: result.ride.id,
      pointsEarned: result.pointsEarned,
      distanceM: result.ride.distance_m,
      co2Kg: result.ride.co2_kg,
      unlocked: result.unlocked,
      redirect: `/activities/${result.ride.id}`,
    });
  } catch (error) {
    console.error("[rides] gagal menyelesaikan ride", error);
    return NextResponse.json(
      { error: "Gagal menyimpan ride. Coba lagi." },
      { status: 400 }
    );
  }
}
