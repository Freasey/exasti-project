import { NextResponse } from "next/server";
import { sql, one } from "@/lib/db";
import {
  findUserByEmail,
  generateUsername,
  hashPassword,
  toSessionUser,
} from "@/lib/auth";
import { createSession } from "@/lib/session";
import type { User } from "@/lib/types";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: { name?: string; email?: string; password?: string; city?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const city = (body.city ?? "").trim() || null;

  if (name.length < 2) {
    return NextResponse.json({ error: "Nama minimal 2 karakter." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Format email tidak valid." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Kata sandi minimal 8 karakter." },
      { status: 400 }
    );
  }

  if (await findUserByEmail(email)) {
    return NextResponse.json(
      { error: "Email ini sudah terdaftar. Coba masuk saja." },
      { status: 409 }
    );
  }

  const username = await generateUsername(name || email.split("@")[0]);
  const passwordHash = await hashPassword(password);

  const user = one<User>(
    await sql`
      insert into users (name, username, email, password_hash, city)
      values (${name}, ${username}, ${email}, ${passwordHash}, ${city})
      returning *`
  );

  if (!user) {
    return NextResponse.json(
      { error: "Gagal membuat akun. Coba lagi." },
      { status: 500 }
    );
  }

  await createSession(toSessionUser(user));
  return NextResponse.json({ ok: true, redirect: "/dashboard" });
}
