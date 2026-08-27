/**
 * Green Route — jalur mana yang ramah sepeda.
 *
 * Datanya dari OpenStreetMap (lisensi ODbL) lewat Overpass API, disinkronkan
 * ke Neon oleh `npm run bike-lanes:sync`. Modul ini sengaja bebas dependensi
 * server agar bisa dipakai komponen peta di browser sekaligus script sync.
 */

/** Cakupan sinkronisasi default: Jabodetabek. */
export const SYNC_BBOX = {
  south: -6.95,
  west: 106.35,
  north: -6.05,
  east: 107.1,
} as const;

export type BBox = {
  south: number;
  west: number;
  north: number;
  east: number;
};

/**
 * Tiga tingkat keramahan, dari yang paling aman:
 * - `protected` — jalur terpisah dari lalu lintas motor
 * - `lane`      — marka khusus sepeda di badan jalan
 * - `shared`    — berbagi lajur, tapi sepeda diakui secara resmi
 */
export type BikeLaneKind = "protected" | "lane" | "shared";

export type BikeLane = {
  osm_id: number;
  name: string | null;
  kind: BikeLaneKind;
  surface: string | null;
  geom: [number, number][];
};

/**
 * Satu warna teal untuk semua jalur — supaya tidak tertukar dengan jejak
 * rider yang lime — dan ketebalan garis yang menyiratkan tingkat proteksi.
 */
export const LANE_STYLE: Record<
  BikeLaneKind,
  { label: string; hint: string; color: string; weight: number; opacity: number; dash?: string }
> = {
  protected: {
    label: "Jalur terpisah",
    hint: "Terpisah dari lalu lintas motor",
    color: "#2dd4bf",
    weight: 4,
    opacity: 0.95,
  },
  lane: {
    label: "Marka sepeda",
    hint: "Lajur bermarka di badan jalan",
    color: "#2dd4bf",
    weight: 2.5,
    opacity: 0.8,
    dash: "7 5",
  },
  shared: {
    label: "Berbagi lajur",
    hint: "Bercampur kendaraan, sepeda diakui",
    color: "#5eead4",
    weight: 2,
    opacity: 0.5,
    dash: "2 6",
  },
};

/** Urutan tampil & prioritas saat hasil query dipotong limit. */
export const KIND_ORDER: BikeLaneKind[] = ["protected", "lane", "shared"];

/**
 * Menerjemahkan tag OSM menjadi satu tingkat keramahan.
 * Mengembalikan null kalau ruas ini sebenarnya bukan jalur sepeda —
 * Overpass ikut mengirim `cycleway=no`/`separate` karena filter regex.
 */
export function classifyLane(tags: Record<string, string>): BikeLaneKind | null {
  const cycleway = [
    tags.cycleway,
    tags["cycleway:both"],
    tags["cycleway:left"],
    tags["cycleway:right"],
  ].filter(Boolean);

  const has = (...values: string[]) =>
    cycleway.some((value) => values.includes(value));

  // Sepeda dilarang — apa pun tag lainnya, ruas ini tidak masuk hitungan.
  if (tags.bicycle === "no" || tags.bicycle === "dismount") return null;

  if (tags.highway === "cycleway") return "protected";
  if (has("track", "opposite_track")) return "protected";
  if (tags.highway === "path" && tags.bicycle === "designated") return "protected";

  if (has("lane", "opposite_lane")) return "lane";

  if (has("shared_lane", "share_busway", "opposite_share_busway")) return "shared";
  if (tags.bicycle === "designated") return "shared";

  return null;
}

/** Membaca `?bbox=south,west,north,east` menjadi objek, null kalau tak sah. */
export function parseBBox(raw: string | null): BBox | null {
  if (!raw) return null;

  const parts = raw.split(",").map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return null;

  const [south, west, north, east] = parts;
  if (south >= north || west >= east) return null;
  if (Math.abs(south) > 90 || Math.abs(north) > 90) return null;
  if (Math.abs(west) > 180 || Math.abs(east) > 180) return null;

  return { south, west, north, east };
}

/** Melebarkan bbox agar hasil fetch masih terpakai setelah peta digeser sedikit. */
export function padBBox(box: BBox, ratio = 0.35): BBox {
  const dLat = (box.north - box.south) * ratio;
  const dLng = (box.east - box.west) * ratio;
  return {
    south: box.south - dLat,
    west: box.west - dLng,
    north: box.north + dLat,
    east: box.east + dLng,
  };
}

/** Apakah `inner` sepenuhnya berada di dalam `outer`. */
export function containsBBox(outer: BBox, inner: BBox): boolean {
  return (
    outer.south <= inner.south &&
    outer.west <= inner.west &&
    outer.north >= inner.north &&
    outer.east >= inner.east
  );
}

export function bboxToParam(box: BBox): string {
  const round = (n: number) => n.toFixed(5);
  return [box.south, box.west, box.north, box.east].map(round).join(",");
}
