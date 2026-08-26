import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { startRide } from "@/lib/rides";

export const runtime = "nodejs";

/** Membuka sesi ride baru saat rider menekan "Start Cycling". */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  }

  let title = "Ride";
  try {
    const body = (await request.json()) as { title?: string };
    if (body.title && body.title.trim()) title = body.title.trim().slice(0, 80);
  } catch {
    // body opsional
  }

  const ride = await startRide(user.id, title);
  return NextResponse.json({ ride });
}
