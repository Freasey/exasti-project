import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL belum di-set. Salin .env.example menjadi .env.local lalu isi connection string Neon."
  );
}

/**
 * Neon HTTP driver. Aman dipakai di serverless/edge karena tiap query
 * adalah satu round-trip HTTP (tidak memegang koneksi TCP).
 *
 * Pemakaian: const rows = await sql`select * from users where id = ${id}`;
 */
export const sql = neon(connectionString);

/** Helper agar hasil query punya tipe yang jelas tanpa banyak casting. */
export function rows<T>(result: unknown): T[] {
  return result as T[];
}

export function one<T>(result: unknown): T | null {
  const list = result as T[];
  return list.length > 0 ? list[0] : null;
}
