import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { blobEnabled, readBlob } from "@/lib/blob";

export const runtime = "nodejs";

/**
 * Menyajikan berkas dari Vercel Blob store yang bersifat privat — saat ini
 * hanya foto profil. Blob privat tidak punya URL publik, jadi isinya dialirkan
 * lewat route ini setelah pengunjung terbukti sudah masuk.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  }
  if (!blobEnabled()) {
    return NextResponse.json({ error: "Blob tidak aktif." }, { status: 503 });
  }

  const { path } = await params;
  const pathname = path.join("/");

  // Hanya folder avatar yang boleh dibaca lewat route publik ini; track ride
  // berisi jejak lokasi mentah dan hanya dibaca di server.
  if (!pathname.startsWith("avatars/")) {
    return NextResponse.json({ error: "Tidak ditemukan." }, { status: 404 });
  }

  try {
    const result = await readBlob(pathname);
    if (!result || result.statusCode !== 200) {
      return NextResponse.json({ error: "Tidak ditemukan." }, { status: 404 });
    }

    return new NextResponse(result.stream, {
      headers: {
        "content-type": result.blob.contentType || "application/octet-stream",
        // Nama berkas mengandung timestamp, jadi isinya tidak pernah berubah.
        "cache-control": "private, max-age=86400, immutable",
      },
    });
  } catch (error) {
    console.error("[blob] gagal menyajikan", pathname, error);
    return NextResponse.json({ error: "Gagal memuat berkas." }, { status: 500 });
  }
}
