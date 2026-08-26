import { NextResponse } from "next/server";
import { findUserByEmail, toSessionUser, verifyPassword } from "@/lib/auth";
import { createSession } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400 });
  }

  const email = (body.email ?? "").trim();
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email dan kata sandi wajib diisi." },
      { status: 400 }
    );
  }

  const user = await findUserByEmail(email);
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    // Pesan sengaja disamakan agar tidak membocorkan email mana yang terdaftar.
    return NextResponse.json(
      { error: "Email atau kata sandi salah." },
      { status: 401 }
    );
  }

  await createSession(toSessionUser(user));
  return NextResponse.json({ ok: true, redirect: "/dashboard" });
}
