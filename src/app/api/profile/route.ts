import { NextResponse } from "next/server";
import { getCurrentUser, toSessionUser } from "@/lib/auth";
import { sql, one } from "@/lib/db";
import { createSession } from "@/lib/session";
import type { User } from "@/lib/types";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  }

  const body = (await request.json()) as {
    name?: string;
    city?: string;
    bio?: string;
  };

  const name = (body.name ?? "").trim();
  if (name.length < 2) {
    return NextResponse.json({ error: "Nama minimal 2 karakter." }, { status: 400 });
  }

  const updated = one<User>(
    await sql`
      update users set
        name = ${name},
        city = ${(body.city ?? "").trim() || null},
        bio  = ${(body.bio ?? "").trim().slice(0, 300) || null}
      where id = ${user.id}
      returning *`
  );

  if (!updated) {
    return NextResponse.json({ error: "Gagal menyimpan profil." }, { status: 500 });
  }

  // Sesi menyimpan nama & avatar, jadi cookie ikut diperbarui.
  await createSession(toSessionUser(updated));
  return NextResponse.json({ ok: true });
}
