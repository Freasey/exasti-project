import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { blobEnabled, isAppBlob, putAvatar, removeBlob } from "@/lib/blob";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  }

  if (!blobEnabled()) {
    return NextResponse.json(
      {
        error:
          "Vercel Blob belum dikonfigurasi. Isi BLOB_READ_WRITE_TOKEN di environment.",
      },
      { status: 503 }
    );
  }

  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json(
      { error: "Format harus JPG, PNG, WEBP, atau AVIF." },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Ukuran file maksimal 4 MB." },
      { status: 400 }
    );
  }

  const url = await putAvatar(user.id, file);
  if (!url) {
    return NextResponse.json({ error: "Gagal mengunggah foto." }, { status: 500 });
  }

  const previous = user.avatar_url;
  await sql`update users set avatar_url = ${url} where id = ${user.id}`;

  // Foto lama hanya dihapus kalau memang tersimpan di Blob milik aplikasi.
  if (previous && isAppBlob(previous)) {
    await removeBlob(previous);
  }

  return NextResponse.json({ ok: true, url });
}
