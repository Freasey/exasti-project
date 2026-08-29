import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getBikeLanes } from "@/lib/queries";
import { parseBBox } from "@/lib/bike-lanes";

export const runtime = "nodejs";

/** Viewport selebar ini sudah mencakup seluruh Jabodetabek - lebih dari itu
 *  hampir pasti salah pakai, dan hasilnya terlalu berat untuk digambar. */
const MAX_SPAN_DEG = 1.5;

/** Jalur ramah sepeda di dalam viewport peta. */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const box = parseBBox(searchParams.get("bbox"));

  if (!box) {
    return NextResponse.json(
      { error: "Parameter bbox harus berupa south,west,north,east." },
      { status: 400 }
    );
  }

  if (box.north - box.south > MAX_SPAN_DEG || box.east - box.west > MAX_SPAN_DEG) {
    return NextResponse.json(
      { error: "Area terlalu luas - perbesar peta dulu.", lanes: [] },
      { status: 422 }
    );
  }

  const lanes = await getBikeLanes(box);

  return NextResponse.json(
    { lanes },
    {
      // Data OSM disinkronkan manual, jadi aman di-cache agak lama di browser.
      headers: { "Cache-Control": "private, max-age=300" },
    }
  );
}
