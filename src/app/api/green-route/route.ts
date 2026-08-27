import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * Profil sepeda OpenRouteService. `cycling-regular` sudah memberi bobot lebih
 * pada jalur sepeda dan jalan tenang, jadi rutenya condong ke infrastruktur
 * yang sama dengan yang digambar layer Green Route.
 */
const ORS_URL =
  "https://api.openrouteservice.org/v2/directions/cycling-regular/geojson";

type Point = [number, number]; // [lat, lng]

function isPoint(value: unknown): value is Point {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    value.every((n) => typeof n === "number" && Number.isFinite(n)) &&
    Math.abs(value[0] as number) <= 90 &&
    Math.abs(value[1] as number) <= 180
  );
}

/** Menghitung rute sepeda dari dua titik yang dipilih di peta. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  }

  const apiKey = process.env.ORS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ORS_API_KEY belum di-set di .env.local." },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => null)) as {
    from?: unknown;
    to?: unknown;
  } | null;

  if (!body || !isPoint(body.from) || !isPoint(body.to)) {
    return NextResponse.json(
      { error: "Butuh titik `from` dan `to` berupa [lat, lng]." },
      { status: 400 }
    );
  }

  // ORS memakai urutan [lng, lat] — kebalikan dari Leaflet.
  const coordinates = [
    [body.from[1], body.from[0]],
    [body.to[1], body.to[0]],
  ];

  let response: Response;
  try {
    response = await fetch(ORS_URL, {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ coordinates, elevation: true }),
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    return NextResponse.json(
      { error: "Tidak bisa menghubungi layanan rute. Coba lagi." },
      { status: 502 }
    );
  }

  if (!response.ok) {
    // 404 dari ORS = tidak ada jalur sepeda yang menyambungkan kedua titik.
    const status = response.status === 404 ? 404 : 502;
    const message =
      response.status === 404
        ? "Tidak ketemu rute sepeda antara dua titik itu."
        : response.status === 403 || response.status === 401
          ? "ORS menolak API key — cek ORS_API_KEY di .env.local."
          : "Layanan rute sedang bermasalah. Coba lagi sebentar.";
    return NextResponse.json({ error: message }, { status });
  }

  const geojson = (await response.json()) as {
    features?: {
      geometry?: { coordinates?: [number, number, number?][] };
      properties?: {
        summary?: { distance?: number; duration?: number };
        ascent?: number;
      };
    }[];
  };

  const feature = geojson.features?.[0];
  const coords = feature?.geometry?.coordinates;

  if (!coords || coords.length < 2) {
    return NextResponse.json(
      { error: "Tidak ketemu rute sepeda antara dua titik itu." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    // Balik lagi ke [lat, lng] supaya Leaflet bisa langsung memakainya.
    polyline: coords.map(([lng, lat]) => [lat, lng] as Point),
    distance_m: feature?.properties?.summary?.distance ?? 0,
    duration_s: feature?.properties?.summary?.duration ?? 0,
    ascent_m: feature?.properties?.ascent ?? null,
  });
}
