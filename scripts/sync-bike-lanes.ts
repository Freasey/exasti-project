/**
 * Menarik jalur ramah sepeda dari OpenStreetMap ke tabel `bike_lanes`.
 *
 *   npm run bike-lanes:sync            -> Jabodetabek (default)
 *   npm run bike-lanes:sync -- --bbox=-7.9,110.2,-7.6,110.6
 *
 * Idempoten: ruas yang sudah ada di-update, ruas yang hilang dari OSM
 * dibersihkan setelah sinkronisasi berhasil. Data OSM berlisensi ODbL -
 * atribusi wajib tetap tampil di peta.
 */
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

import {
  SYNC_BBOX,
  classifyLane,
  parseBBox,
  type BBox,
  type BikeLaneKind,
} from "../src/lib/bike-lanes";

/**
 * Mirror Overpass. overpass-api.de didahulukan karena dua lainnya kerap tidak
 * bisa dijangkau dari jaringan Indonesia; mirror yang gagal cuma diturunkan
 * prioritasnya, tidak dicoret, sebab 504 di sini nyaris selalu sesaat.
 */
const OVERPASS_MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

/** Sisi petak maksimum (derajat) - petak kecil jauh lebih jarang timeout. */
const TILE_DEG = 0.25;

/** Jeda antar permintaan supaya tidak dianggap membanjiri server publik. */
const TILE_DELAY_MS = 1_500;

/** Berapa ronde satu petak dicoba sebelum sinkronisasi dibatalkan. */
const TILE_ROUNDS = 4;

/** Jeda antar ronde - cukup panjang agar slot Overpass sempat dilepas. */
const ROUND_BACKOFF_MS = [15_000, 35_000, 60_000];

/**
 * Batas waktu yang kita deklarasikan ke Overpass. Sengaja pendek: query yang
 * telanjur nyangkut tetap memegang satu slot selama nilai ini, dan server
 * publik cuma memberi 2 slot per IP - nilai besar membuat run berikutnya
 * langsung ditolak 504 oleh sisa run kita sendiri.
 */
const QUERY_TIMEOUT_S = 60;

/** Ruas yang lebih pendek dari ini hampir selalu potongan simpang. */
const MIN_LENGTH_M = 15;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type OverpassWay = {
  type: string;
  id: number;
  tags?: Record<string, string>;
  geometry?: { lat: number; lon: number }[];
};

type LaneRow = {
  osm_id: number;
  name: string | null;
  kind: BikeLaneKind;
  surface: string | null;
  geom: [number, number][];
  min_lat: number;
  min_lng: number;
  max_lat: number;
  max_lng: number;
};

function overpassQuery(b: BBox): string {
  const box = `${b.south},${b.west},${b.north},${b.east}`;
  return `[out:json][timeout:${QUERY_TIMEOUT_S}];
(
  way["highway"="cycleway"](${box});
  way["cycleway"~"lane|track|shared_lane|share_busway"](${box});
  way["cycleway:both"~"lane|track"](${box});
  way["cycleway:left"~"lane|track"](${box});
  way["cycleway:right"~"lane|track"](${box});
  way["highway"="path"]["bicycle"="designated"](${box});
);
out geom;`;
}

/** Jarak haversine kasar - cukup untuk menyaring potongan pendek. */
function lengthMeters(points: [number, number][]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const [lat1, lng1] = points[i - 1];
    const [lat2, lng2] = points[i];
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const meanLat = ((lat1 + lat2) / 2) * (Math.PI / 180);
    total += Math.hypot(dLat, dLng * Math.cos(meanLat)) * 6_371_000;
  }
  return total;
}

/**
 * Membulatkan ke 5 desimal (~1 m) dan membuang titik kembar. Bentuk jalur
 * tetap utuh, tapi payload yang dikirim ke browser jauh lebih ringan.
 */
function simplify(geometry: { lat: number; lon: number }[]): [number, number][] {
  const out: [number, number][] = [];
  for (const point of geometry) {
    const lat = Math.round(point.lat * 1e5) / 1e5;
    const lng = Math.round(point.lon * 1e5) / 1e5;
    const last = out[out.length - 1];
    if (last && last[0] === lat && last[1] === lng) continue;
    out.push([lat, lng]);
  }
  return out;
}

function toRow(way: OverpassWay): LaneRow | null {
  const tags = way.tags ?? {};
  const kind = classifyLane(tags);
  if (!kind || !way.geometry || way.geometry.length < 2) return null;

  const geom = simplify(way.geometry);
  if (geom.length < 2) return null;
  if (lengthMeters(geom) < MIN_LENGTH_M) return null;

  const lats = geom.map((p) => p[0]);
  const lngs = geom.map((p) => p[1]);

  return {
    osm_id: way.id,
    name: tags.name ?? null,
    kind,
    surface: tags.surface ?? null,
    geom,
    min_lat: Math.min(...lats),
    min_lng: Math.min(...lngs),
    max_lat: Math.max(...lats),
    max_lng: Math.max(...lngs),
  };
}

/** Memecah bbox menjadi petak-petak kecil agar tiap query ringan. */
function tiles(box: BBox): BBox[] {
  const cols = Math.max(1, Math.ceil((box.east - box.west) / TILE_DEG));
  const rows = Math.max(1, Math.ceil((box.north - box.south) / TILE_DEG));
  const dLng = (box.east - box.west) / cols;
  const dLat = (box.north - box.south) / rows;

  const out: BBox[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      out.push({
        south: box.south + r * dLat,
        north: box.south + (r + 1) * dLat,
        west: box.west + c * dLng,
        east: box.west + (c + 1) * dLng,
      });
    }
  }
  return out;
}

/**
 * Berapa kali tiap mirror gagal sepanjang sinkronisasi. Dipakai untuk
 * mengurutkan pilihan, bukan untuk mencoret permanen - 504 dari Overpass
 * hampir selalu sesaat, jadi mirror yang sempat gagal tetap layak dicoba
 * lagi belakangan daripada memaksa semua trafik ke host yang lebih rusak.
 */
const failures = new Map<string, number>();

function preferredMirrors(): string[] {
  return [...OVERPASS_MIRRORS].sort(
    (a, b) => (failures.get(a) ?? 0) - (failures.get(b) ?? 0)
  );
}

/**
 * Overpass memberi 2 slot per IP dan langsung membalas 504 saat keduanya
 * terpakai - termasuk oleh query kita sendiri yang belum kedaluwarsa. Endpoint
 * /api/status memberi tahu kapan slot berikutnya bebas, jadi kita menunggu
 * alih-alih menembaki server dengan percobaan yang pasti ditolak.
 */
async function waitForSlot(url: string): Promise<void> {
  const statusUrl = url.replace(/\/interpreter$/, "/status");

  try {
    const response = await fetch(statusUrl, {
      headers: { "User-Agent": "EcoCycle/1.0 (green-route sync)" },
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) return;

    const text = await response.text();
    if (/[1-9]\d* slots? available now/.test(text)) return;

    // "Slot available after: 2026-08-27T14:02:11Z, in 34 seconds."
    const seconds = text.match(/in (\d+) seconds/)?.[1];
    if (!seconds) return;

    const wait = Math.min(Number(seconds) + 3, 90);
    process.stdout.write(`\r  menunggu slot Overpass ${wait}s...\n`);
    await sleep(wait * 1_000);
  } catch {
    // Status opsional - kalau tidak terbaca, lanjut saja dan biarkan retry bekerja.
  }
}

/** Satu permintaan ke satu mirror. Melempar dengan pesan yang bisa dibaca. */
async function askMirror(url: string, box: BBox): Promise<OverpassWay[]> {
  const host = new URL(url).host;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      // Overpass meminta User-Agent yang bisa dikenali kalau query bermasalah.
      "User-Agent": "EcoCycle/1.0 (green-route sync)",
    },
    body: new URLSearchParams({ data: overpassQuery(box) }),
    signal: AbortSignal.timeout(120_000),
  }).catch((error: Error) => {
    throw new Error(`${host} tak terjangkau (${error.message})`);
  });

  if (!response.ok) throw new Error(`HTTP ${response.status} dari ${host}`);

  const payload = (await response.json()) as { elements?: OverpassWay[] };
  return payload.elements ?? [];
}

/**
 * Satu petak, dicoba per ronde. Tiap ronde menyapu semua mirror sekali agar
 * host yang sehat selalu kebagian, lalu mundur cukup lama sebelum ronde
 * berikutnya: percobaan yang ditolak pun tetap memakan slot Overpass selama
 * QUERY_TIMEOUT_S, jadi retry beruntun justru saling menghabisi slot.
 */
async function fetchTile(box: BBox, label: string): Promise<OverpassWay[]> {
  let lastError = "";

  for (let round = 0; round < TILE_ROUNDS; round++) {
    for (const url of preferredMirrors()) {
      try {
        return await askMirror(url, box);
      } catch (error) {
        lastError = (error as Error).message;
        failures.set(url, (failures.get(url) ?? 0) + 1);
        process.stdout.write(`\r  ${label} ronde ${round + 1} - ${lastError}\n`);
      }
    }

    if (round < TILE_ROUNDS - 1) {
      const backoff = ROUND_BACKOFF_MS[round] ?? 60_000;
      process.stdout.write(`\r  ${label} mundur ${backoff / 1000}s sebelum ronde berikutnya...\n`);
      await sleep(backoff);
      await waitForSlot(OVERPASS_MIRRORS[0]);
    }
  }

  throw new Error(`Petak gagal setelah ${TILE_ROUNDS} ronde. ${lastError}`);
}

type Sql = Awaited<typeof import("../src/lib/db")>["sql"];

/** Menulis satu kumpulan ruas ke Neon, dipotong agar jumlah parameter aman. */
async function upsert(sql: Sql, laneRows: LaneRow[]): Promise<number> {
  const BATCH = 100;
  let written = 0;

  for (let i = 0; i < laneRows.length; i += BATCH) {
    const chunk = laneRows.slice(i, i + BATCH);
    const params: unknown[] = [];
    const tuples = chunk.map((row, index) => {
      const n = index * 9;
      params.push(
        row.osm_id,
        row.name,
        row.kind,
        row.surface,
        JSON.stringify(row.geom),
        row.min_lat,
        row.min_lng,
        row.max_lat,
        row.max_lng
      );
      return `($${n + 1},$${n + 2},$${n + 3},$${n + 4},$${n + 5}::jsonb,$${n + 6},$${n + 7},$${n + 8},$${n + 9},now())`;
    });

    await sql.query(
      `insert into bike_lanes
         (osm_id, name, kind, surface, geom, min_lat, min_lng, max_lat, max_lng, updated_at)
       values ${tuples.join(",")}
       on conflict (osm_id) do update set
         name = excluded.name,
         kind = excluded.kind,
         surface = excluded.surface,
         geom = excluded.geom,
         min_lat = excluded.min_lat,
         min_lng = excluded.min_lng,
         max_lat = excluded.max_lat,
         max_lng = excluded.max_lng,
         updated_at = excluded.updated_at`,
      params
    );

    written += chunk.length;
  }

  return written;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL belum di-set di .env.local");
    process.exit(1);
  }

  const bboxArg = process.argv
    .find((arg) => arg.startsWith("--bbox="))
    ?.slice("--bbox=".length);
  const box = bboxArg ? parseBBox(bboxArg) : SYNC_BBOX;

  if (!box) {
    console.error("Format --bbox salah. Contoh: --bbox=south,west,north,east");
    process.exit(1);
  }

  // Import setelah env terbaca, karena db.ts membacanya saat modul dimuat.
  const { sql } = await import("../src/lib/db");

  console.log("• Memastikan tabel bike_lanes ada...");
  await sql`
    create table if not exists bike_lanes (
      osm_id     bigint primary key,
      name       text,
      kind       text not null,
      surface    text,
      geom       jsonb not null,
      min_lat    double precision not null,
      min_lng    double precision not null,
      max_lat    double precision not null,
      max_lng    double precision not null,
      updated_at timestamptz not null default now()
    )`;
  await sql`
    create index if not exists bike_lanes_bbox_idx
      on bike_lanes (min_lat, max_lat, min_lng, max_lng)`;

  const grid = tiles(box);
  const startedAt = new Date();
  const seen = new Set<number>();
  const failed: number[] = [];
  let written = 0;

  console.log(
    `• Menarik ${grid.length} petak dari Overpass (${box.south},${box.west} -> ${box.north},${box.east})`
  );

  // Tiap petak langsung ditulis: satu petak yang gagal tidak membatalkan
  // petak-petak yang sudah berhasil, dan run berikutnya tinggal melanjutkan.
  for (const [index, tile] of grid.entries()) {
    const label = `petak ${index + 1}/${grid.length}`;

    let elements: OverpassWay[];
    try {
      elements = await fetchTile(tile, label);
    } catch (error) {
      failed.push(index + 1);
      console.log(`  ${label} DILEWATI - ${(error as Error).message}`);
      continue;
    }

    // Petak bertetangga berbagi ruas di perbatasan - jangan tulis dua kali.
    const laneRows = elements
      .map(toRow)
      .filter((row): row is LaneRow => row !== null && !seen.has(row.osm_id));
    for (const row of laneRows) seen.add(row.osm_id);

    if (laneRows.length > 0) written += await upsert(sql, laneRows);
    console.log(`  ${label} · +${laneRows.length} ruas (total ${written})`);

    if (index < grid.length - 1) await sleep(TILE_DELAY_MS);
  }

  if (written === 0) {
    console.error("Tidak ada satu pun ruas yang berhasil ditarik.");
    process.exit(1);
  }

  // Pembersihan hanya aman kalau seluruh area benar-benar tercakup - kalau ada
  // petak yang gagal, ruas di sana akan terlihat "hilang" dan salah terhapus.
  let pruned = 0;
  if (failed.length === 0) {
    const stale = (await sql`
      delete from bike_lanes
      where updated_at < ${startedAt.toISOString()}
        and min_lat <= ${box.north} and max_lat >= ${box.south}
        and min_lng <= ${box.east}  and max_lng >= ${box.west}
      returning osm_id`) as { osm_id: string }[];
    pruned = stale.length;
  }

  const byKind = (await sql`
    select kind, count(*)::int as n from bike_lanes
    group by kind order by n desc`) as { kind: string; n: number }[];
  const [summary] = (await sql`
    select count(*)::int as total from bike_lanes`) as { total: number }[];

  console.log("");
  console.log("Selesai.");
  console.log(
    `  ditulis: ${written} · dibersihkan: ${pruned} · total tabel: ${summary.total}`
  );
  console.log(`  ${byKind.map((r) => `${r.kind}: ${r.n}`).join(" · ")}`);

  if (failed.length > 0) {
    console.log("");
    console.log(
      `  ${failed.length} petak gagal (${failed.join(", ")}) - pembersihan dilewati.`
    );
    console.log("  Jalankan ulang perintah yang sama untuk melengkapi.");
  }
}

main().catch((error) => {
  console.error("\nGagal sinkronisasi jalur sepeda:\n", error);
  process.exit(1);
});
