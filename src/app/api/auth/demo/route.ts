import { NextResponse } from "next/server";
import { toSessionUser } from "@/lib/auth";
import { createSession } from "@/lib/session";
import { ensureDemoUser } from "@/lib/seed";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Tombol "Coba Akun Demo". Akun beserta riwayat ride-nya dibuat otomatis
 * kalau belum ada, jadi demo tetap jalan di database yang masih kosong.
 */
export async function POST() {
  try {
    const user = await ensureDemoUser();
    await createSession(toSessionUser(user));
    return NextResponse.json({ ok: true, redirect: "/dashboard" });
  } catch (error) {
    console.error("[demo] gagal masuk", error);
    return NextResponse.json(
      { error: "Akun demo belum siap. Jalankan `npm run db:setup` lebih dulu." },
      { status: 500 }
    );
  }
}
