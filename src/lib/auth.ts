import "server-only";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { sql, one } from "./db";
import { readSession } from "./session";
import type { User, UserRow, SessionUser } from "./types";

export { DEMO_EMAIL, DEMO_PASSWORD } from "./constants";

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  return one<UserRow>(
    await sql`select * from users where lower(email) = lower(${email}) limit 1`
  );
}

export async function findUserById(id: string): Promise<User | null> {
  return one<User>(await sql`select * from users where id = ${id} limit 1`);
}

/** User dari sesi, tapi di-refresh dari DB (poin/level selalu terbaru). */
export async function getCurrentUser(): Promise<User | null> {
  const session = await readSession();
  if (!session) return null;
  return findUserById(session.id);
}

/** Dipakai layout area privat: lempar ke /login kalau belum masuk. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export function toSessionUser(user: User): SessionUser {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    avatar_url: user.avatar_url,
    is_demo: user.is_demo,
  };
}

/** Username unik dari nama/email, dipakai saat registrasi. */
export async function generateUsername(base: string): Promise<string> {
  const slug =
    base
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 16) || "rider";
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? slug : `${slug}${i}`;
    const taken = one<{ id: string }>(
      await sql`select id from users where username = ${candidate} limit 1`
    );
    if (!taken) return candidate;
  }
  return `${slug}${Date.now().toString(36)}`;
}
