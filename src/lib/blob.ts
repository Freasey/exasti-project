import { put, del, get } from "@vercel/blob";
import type { TrackPoint } from "./types";

/**
 * Track GPS mentah bisa berisi ribuan titik. Menyimpannya di Postgres
 * membuat tabel rides berat, jadi file penuhnya ditaruh di Vercel Blob dan
 * Postgres cukup menyimpan pathname-nya + polyline versi ringkas.
 *
 * Store yang dipakai bersifat **private**, sehingga blob tidak bisa dibuka
 * lewat URL publik. Semua pembacaan lewat SDK dengan token (di server), dan
 * file yang perlu tampil di browser — foto profil — disajikan lewat route
 * proxy `/api/blob/...`.
 */

const ACCESS = "private" as const;

/** Prefix route proxy yang menyajikan blob privat ke browser. */
export const BLOB_PROXY_PREFIX = "/api/blob/";

export const blobEnabled = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

/* ------------------------------------------------------------------ *
 * Track ride
 * ------------------------------------------------------------------ */

/** Mengembalikan pathname blob, atau null bila Blob belum dikonfigurasi. */
export async function putTrack(
  rideId: string,
  track: TrackPoint[]
): Promise<string | null> {
  if (!blobEnabled()) return null;
  try {
    const blob = await put(
      `tracks/${rideId}.json`,
      JSON.stringify({ version: 1, rideId, points: track }),
      {
        access: ACCESS,
        contentType: "application/json",
        addRandomSuffix: false,
        allowOverwrite: true,
        cacheControlMaxAge: 60 * 60 * 24 * 365,
      }
    );
    return blob.pathname;
  } catch (error) {
    console.error("[blob] gagal menyimpan track", error);
    return null;
  }
}

/** Membaca kembali track penuh dari Blob (hanya dipanggil di server). */
export async function fetchTrack(pathname: string): Promise<TrackPoint[]> {
  if (!blobEnabled()) return [];
  try {
    const result = await get(pathname, { access: ACCESS });
    if (!result || result.statusCode !== 200) return [];
    const data = (await new Response(result.stream).json()) as {
      points?: TrackPoint[];
    };
    return data.points ?? [];
  } catch (error) {
    console.error("[blob] gagal membaca track", error);
    return [];
  }
}

/* ------------------------------------------------------------------ *
 * Foto profil
 * ------------------------------------------------------------------ */

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

/**
 * Mengunggah avatar dan mengembalikan URL yang bisa langsung dipakai di
 * `<img src>` — yaitu route proxy aplikasi, bukan URL Blob (store privat).
 */
export async function putAvatar(
  userId: string,
  file: File
): Promise<string | null> {
  if (!blobEnabled()) return null;

  const ext = EXT_BY_TYPE[file.type] ?? "jpg";
  const blob = await put(`avatars/${userId}-${Date.now()}.${ext}`, file, {
    access: ACCESS,
    contentType: file.type || "image/jpeg",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60 * 60 * 24 * 30,
  });

  return BLOB_PROXY_PREFIX + blob.pathname;
}

/** Membaca blob untuk disajikan route proxy. */
export function readBlob(pathname: string) {
  return get(pathname, { access: ACCESS });
}

/* ------------------------------------------------------------------ *
 * Penghapusan
 * ------------------------------------------------------------------ */

/** Menerima pathname blob maupun URL proxy aplikasi. */
export async function removeBlob(pathnameOrUrl: string): Promise<void> {
  if (!blobEnabled()) return;
  const pathname = pathnameOrUrl.startsWith(BLOB_PROXY_PREFIX)
    ? pathnameOrUrl.slice(BLOB_PROXY_PREFIX.length)
    : pathnameOrUrl;
  try {
    await del(pathname);
  } catch (error) {
    console.error("[blob] gagal menghapus", error);
  }
}

/** Apakah nilai ini menunjuk ke blob milik aplikasi (bukan URL luar). */
export const isAppBlob = (value: string) => value.startsWith(BLOB_PROXY_PREFIX);
