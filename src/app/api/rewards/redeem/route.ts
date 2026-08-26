import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sql, one } from "@/lib/db";
import type { Reward } from "@/lib/types";

export const runtime = "nodejs";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function voucherCode(): string {
  const block = () =>
    Array.from(
      { length: 4 },
      () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
    ).join("");
  return `ECO-${block()}-${block()}`;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  }

  const { rewardId } = (await request.json()) as { rewardId?: string };
  if (!rewardId) {
    return NextResponse.json({ error: "Reward tidak dikenal." }, { status: 400 });
  }

  const reward = one<Reward>(
    await sql`select * from rewards where id = ${rewardId} and active = true limit 1`
  );
  if (!reward) {
    return NextResponse.json({ error: "Reward tidak tersedia." }, { status: 404 });
  }
  if (reward.stock <= 0) {
    return NextResponse.json({ error: "Stok reward habis." }, { status: 409 });
  }

  // Pengurangan saldo dan pengecekan kecukupan poin dilakukan dalam satu
  // statement, jadi dua permintaan bersamaan tidak bisa membuat saldo minus.
  const debited = one<{ points_balance: number }>(
    await sql`
      update users
      set points_balance = points_balance - ${reward.points_cost}
      where id = ${user.id} and points_balance >= ${reward.points_cost}
      returning points_balance`
  );

  if (!debited) {
    return NextResponse.json(
      { error: "Poinmu belum cukup untuk reward ini." },
      { status: 409 }
    );
  }

  const code = voucherCode();
  await sql`
    insert into redemptions (user_id, reward_id, points_spent, code)
    values (${user.id}, ${reward.id}, ${reward.points_cost}, ${code})`;
  await sql`
    update rewards set stock = greatest(0, stock - 1) where id = ${reward.id}`;

  return NextResponse.json({
    ok: true,
    code,
    balance: Number(debited.points_balance),
    reward: { brand: reward.brand, title: reward.title, value: reward.value_label },
  });
}
