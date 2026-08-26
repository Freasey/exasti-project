import bcrypt from "bcryptjs";
import { sql, one, rows } from "./db";
import { ACHIEVEMENTS, evaluateAchievements } from "./achievements";
import { insertCompletedRide } from "./rides";
import {
  CITY_SPOTS,
  generateTrack,
  makeRandom,
  titleForHour,
} from "./fake-ride";
import { DEMO_EMAIL, DEMO_PASSWORD } from "./constants";
import type { User } from "./types";

/* ------------------------------------------------------------------ *
 * Katalog reward — mengikuti brand partner pada desain awal
 * ------------------------------------------------------------------ */

export const REWARD_CATALOG = [
  { slug: "gojek-25", brand: "Gojek", title: "Gojek Voucher", value_label: "Rp25.000", points_cost: 3000, accent: "#00AA13", sort_order: 1 },
  { slug: "shopee-50", brand: "Shopee", title: "Shopee Voucher", value_label: "Rp50.000", points_cost: 6000, accent: "#EE4D2D", sort_order: 2 },
  { slug: "tokopedia-50", brand: "Tokopedia", title: "Tokopedia Voucher", value_label: "Rp50.000", points_cost: 6000, accent: "#42B549", sort_order: 3 },
  { slug: "decathlon-100", brand: "Decathlon", title: "Decathlon Voucher", value_label: "Rp100.000", points_cost: 12000, accent: "#0082C3", sort_order: 4 },
  { slug: "starbucks-50", brand: "Starbucks", title: "Starbucks Voucher", value_label: "Rp50.000", points_cost: 6000, accent: "#00704A", sort_order: 5 },
  { slug: "grab-25", brand: "Grab", title: "Grab Voucher", value_label: "Rp25.000", points_cost: 3000, accent: "#00B14F", sort_order: 6 },
  { slug: "alfamart-20", brand: "Alfamart", title: "Alfamart Voucher", value_label: "Rp20.000", points_cost: 2500, accent: "#E4002B", sort_order: 7 },
  { slug: "rodalink-150", brand: "Rodalink", title: "Servis Sepeda", value_label: "Rp150.000", points_cost: 15000, accent: "#F26522", sort_order: 8 },
  { slug: "kopken-25", brand: "Kopi Kenangan", title: "Kopi Kenangan", value_label: "Rp25.000", points_cost: 3000, accent: "#8B5E34", sort_order: 9 },
  { slug: "tree-donation", brand: "EcoCycle", title: "Donasi 1 Pohon", value_label: "1 Pohon", points_cost: 4000, accent: "#8BE04E", sort_order: 10 },
];

/* ------------------------------------------------------------------ *
 * Rider lain untuk mengisi leaderboard & feed
 * ------------------------------------------------------------------ */

type RivalSeed = {
  name: string;
  username: string;
  city: keyof typeof CITY_SPOTS;
  rides: number;
  baseKm: number;
  speed: number;
};

export const RIVALS: RivalSeed[] = [
  { name: "Bagas Pratama", username: "CycleMaster", city: "Jakarta", rides: 34, baseKm: 26, speed: 27 },
  { name: "Nadia Wijaya", username: "GreenWheels", city: "Jakarta", rides: 30, baseKm: 22, speed: 25 },
  { name: "Reza Fadillah", username: "EcoRider_99", city: "Bandung", rides: 27, baseKm: 20, speed: 24 },
  { name: "Sinta Larasati", username: "UrbanCyclist", city: "Jakarta", rides: 24, baseKm: 18, speed: 23 },
  { name: "Dimas Anggara", username: "PedalPower", city: "Surabaya", rides: 22, baseKm: 17, speed: 26 },
  { name: "Putri Maharani", username: "LeafRunner", city: "Yogyakarta", rides: 18, baseKm: 15, speed: 22 },
  { name: "Arif Kurniawan", username: "CarbonZero", city: "Bali", rides: 16, baseKm: 19, speed: 25 },
  { name: "Melati Kusuma", username: "SpinDaily", city: "Bandung", rides: 14, baseKm: 12, speed: 21 },
  { name: "Yoga Saputra", username: "NightPedal", city: "Jakarta", rides: 12, baseKm: 14, speed: 24 },
];

/* ------------------------------------------------------------------ *
 * Katalog statis
 * ------------------------------------------------------------------ */

export async function seedCatalog(): Promise<void> {
  for (const r of REWARD_CATALOG) {
    await sql`
      insert into rewards (slug, brand, title, value_label, points_cost, accent, sort_order)
      values (${r.slug}, ${r.brand}, ${r.title}, ${r.value_label},
              ${r.points_cost}, ${r.accent}, ${r.sort_order})
      on conflict (slug) do update set
        brand = excluded.brand,
        title = excluded.title,
        value_label = excluded.value_label,
        points_cost = excluded.points_cost,
        accent = excluded.accent,
        sort_order = excluded.sort_order`;
  }

  for (const [index, a] of ACHIEVEMENTS.entries()) {
    await sql`
      insert into achievements (code, name, description, icon, metric, threshold, sort_order)
      values (${a.code}, ${a.name}, ${a.description}, ${a.icon},
              ${a.metric}, ${a.threshold}, ${index})
      on conflict (code) do update set
        name = excluded.name,
        description = excluded.description,
        icon = excluded.icon,
        metric = excluded.metric,
        threshold = excluded.threshold,
        sort_order = excluded.sort_order`;
  }
}

/* ------------------------------------------------------------------ *
 * Riwayat ride sintetis
 * ------------------------------------------------------------------ */

async function generateHistory(
  user: { id: string; username: string },
  opts: { rides: number; city: keyof typeof CITY_SPOTS; baseKm: number; speed: number; days: number }
): Promise<void> {
  const seedBase = [...user.username].reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = makeRandom(seedBase);
  const spots = CITY_SPOTS[opts.city] ?? CITY_SPOTS.Jakarta;

  const jobs: (() => Promise<unknown>)[] = [];

  for (let i = 0; i < opts.rides; i++) {
    const daysAgo = Math.floor((i / opts.rides) * opts.days) + Math.floor(rand() * 3);
    const startTime = new Date();
    startTime.setDate(startTime.getDate() - daysAgo);
    const hour = rand() < 0.55 ? 5 + Math.floor(rand() * 4) : 16 + Math.floor(rand() * 5);
    startTime.setHours(hour, Math.floor(rand() * 60), 0, 0);

    const spot = spots[Math.floor(rand() * spots.length)];
    const distanceKm = Math.max(
      2.5,
      opts.baseKm * (0.45 + rand() * 1.15) * (rand() < 0.12 ? 1.8 : 1)
    );
    const avgSpeedKmh = opts.speed * (0.85 + rand() * 0.3);

    const track = generateTrack(seedBase + i * 977, {
      start: [
        spot[0] + (rand() - 0.5) * 0.01,
        spot[1] + (rand() - 0.5) * 0.01,
      ],
      distanceKm,
      avgSpeedKmh,
      startTime,
    });

    const title = titleForHour(hour, rand);
    jobs.push(() => insertCompletedRide(user.id, track, title));
  }

  // Neon HTTP = satu round-trip per query, jadi dijalankan berkelompok.
  const CHUNK = 8;
  for (let i = 0; i < jobs.length; i += CHUNK) {
    await Promise.all(jobs.slice(i, i + CHUNK).map((job) => job()));
  }
}

/** Sinkronkan poin user dari total poin ride-nya. */
async function syncPoints(userId: string, spentRatio = 0): Promise<void> {
  await sql`
    update users u set
      lifetime_points = coalesce(t.total, 0),
      points_balance  = greatest(0, round(coalesce(t.total, 0) * ${1 - spentRatio}::numeric))::int
    from (
      select coalesce(sum(points), 0)::int as total
      from rides where user_id = ${userId} and status = 'completed'
    ) t
    where u.id = ${userId}`;
}

/* ------------------------------------------------------------------ *
 * Akun demo
 * ------------------------------------------------------------------ */

export async function findDemoUser(): Promise<User | null> {
  return one<User>(
    await sql`select * from users where email = ${DEMO_EMAIL} limit 1`
  );
}

/**
 * Memastikan akun demo ada beserta riwayatnya. Idempoten: aman dipanggil
 * setiap kali tombol "Coba Akun Demo" ditekan.
 */
export async function ensureDemoUser(): Promise<User> {
  let user = await findDemoUser();

  if (!user) {
    const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
    user = one<User>(
      await sql`
        insert into users (name, username, email, password_hash, city, is_demo, bio)
        values ('Rider Green', 'ridergreen', ${DEMO_EMAIL}, ${hash},
                'Jakarta', true,
                'Akun demo EcoCycle. Gowes tiap pagi, kumpulkan poin, tukar reward.')
        on conflict (email) do update set name = excluded.name
        returning *`
    );
  }
  if (!user) throw new Error("Gagal menyiapkan akun demo.");

  const existing = one<{ count: number }>(
    await sql`select count(*)::int as count from rides
              where user_id = ${user.id} and status = 'completed'`
  );

  if (Number(existing?.count ?? 0) === 0) {
    await generateHistory(user, {
      rides: 42,
      city: "Jakarta",
      baseKm: 16,
      speed: 24,
      days: 120,
    });
    await syncPoints(user.id, 0.25);
    await evaluateAchievements(user.id);
    user = await findDemoUser();
  }

  return user!;
}

/** Seed penuh: akun demo + rider pesaing + kudos. */
export async function seedDemoWorld(): Promise<void> {
  await ensureDemoUser();

  const hash = await bcrypt.hash("ecocycle123", 10);

  for (const rival of RIVALS) {
    let user = one<User>(
      await sql`select * from users where username = ${rival.username} limit 1`
    );
    if (!user) {
      user = one<User>(
        await sql`
          insert into users (name, username, email, password_hash, city, bio)
          values (${rival.name}, ${rival.username},
                  ${`${rival.username.toLowerCase()}@ecocycle.id`}, ${hash},
                  ${rival.city}, ${`Rider ${rival.city}`})
          on conflict (username) do nothing
          returning *`
      );
    }
    if (!user) continue;

    const count = one<{ count: number }>(
      await sql`select count(*)::int as count from rides where user_id = ${user.id}`
    );
    if (Number(count?.count ?? 0) > 0) continue;

    await generateHistory(user, {
      rides: rival.rides,
      city: rival.city,
      baseKm: rival.baseKm,
      speed: rival.speed,
      days: 120,
    });
    await syncPoints(user.id, 0.15);
    await evaluateAchievements(user.id);
  }

  await seedKudos();
}

/** Sebar kudos acak supaya feed komunitas tidak kosong. */
async function seedKudos(): Promise<void> {
  const userIds = rows<{ id: string }>(await sql`select id from users`).map(
    (u) => u.id
  );
  const recent = rows<{ id: string; user_id: string }>(
    await sql`select id, user_id from rides
              where status = 'completed'
              order by started_at desc limit 60`
  );

  const rand = makeRandom(42);
  const pairs: [string, string][] = [];
  for (const ride of recent) {
    for (const uid of userIds) {
      if (uid === ride.user_id || rand() > 0.35) continue;
      pairs.push([ride.id, uid]);
    }
  }

  const CHUNK = 12;
  for (let i = 0; i < pairs.length; i += CHUNK) {
    await Promise.all(
      pairs.slice(i, i + CHUNK).map(
        ([rideId, uid]) =>
          sql`insert into kudos (ride_id, user_id) values (${rideId}, ${uid})
              on conflict do nothing`
      )
    );
  }
}
