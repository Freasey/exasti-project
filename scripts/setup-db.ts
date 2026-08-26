/**
 * Menyiapkan database Neon: jalankan schema, isi katalog reward & badge,
 * lalu buat akun demo beserta rider pesaing.
 *
 *   npm run db:setup     -> idempoten, aman diulang
 *   npm run db:reset     -> hapus semua tabel dulu, baru bangun ulang
 */
import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

config({ path: ".env.local" });
config({ path: ".env" });

const RESET = process.argv.includes("--reset");

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL belum di-set di .env.local");
    process.exit(1);
  }

  // Import setelah env terbaca, karena db.ts membacanya saat modul dimuat.
  const { sql } = await import("../src/lib/db");
  const { seedCatalog, seedDemoWorld } = await import("../src/lib/seed");

  if (RESET) {
    console.log("• Menghapus tabel lama...");
    await sql`drop table if exists user_achievements, achievements, redemptions,
                                   rewards, kudos, rides, users cascade`;
  }

  console.log("• Menjalankan schema...");
  const schema = readFileSync(
    resolve(process.cwd(), "src/lib/schema.sql"),
    "utf8"
  );

  const statements = schema
    .split(/;\s*(?:\r?\n|$)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  for (const statement of statements) {
    await sql.query(statement);
  }
  console.log(`  ${statements.length} statement dijalankan.`);

  console.log("• Mengisi katalog reward & badge...");
  await seedCatalog();

  console.log("• Membuat akun demo + rider pesaing (butuh ~1 menit)...");
  await seedDemoWorld();

  const [summary] = (await sql`
    select (select count(*) from users)   as users,
           (select count(*) from rides)   as rides,
           (select count(*) from rewards) as rewards
  `) as { users: string; rides: string; rewards: string }[];

  console.log("\nSelesai.");
  console.log(
    `  users: ${summary.users} · rides: ${summary.rides} · rewards: ${summary.rewards}`
  );
  console.log("\n  Login demo -> demo@ecocycle.id / demo1234");
}

main().catch((error) => {
  console.error("\nGagal menyiapkan database:\n", error);
  process.exit(1);
});
