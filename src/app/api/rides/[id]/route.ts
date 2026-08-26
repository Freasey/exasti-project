import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { discardRide } from "@/lib/rides";

export const runtime = "nodejs";

/** Membatalkan sesi yang sedang berjalan tanpa menyimpannya. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  }

  const { id } = await params;
  await discardRide(id, user.id);
  return NextResponse.json({ ok: true });
}

/** Mengubah judul / catatan ride yang sudah selesai. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as { title?: string; note?: string };
  const title = body.title?.trim().slice(0, 80);
  const note = body.note?.trim().slice(0, 500) ?? null;

  if (!title) {
    return NextResponse.json({ error: "Judul tidak boleh kosong." }, { status: 400 });
  }

  await sql`
    update rides set title = ${title}, note = ${note}
    where id = ${id} and user_id = ${user.id}`;

  return NextResponse.json({ ok: true });
}
