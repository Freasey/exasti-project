import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sql, one } from "@/lib/db";

export const runtime = "nodejs";

/** Toggle kudos (jempol) pada sebuah ride. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  }

  const { id } = await params;
  const existing = one<{ ride_id: string }>(
    await sql`select ride_id from kudos
              where ride_id = ${id} and user_id = ${user.id} limit 1`
  );

  if (existing) {
    await sql`delete from kudos where ride_id = ${id} and user_id = ${user.id}`;
  } else {
    await sql`insert into kudos (ride_id, user_id) values (${id}, ${user.id})
              on conflict do nothing`;
  }

  const count = one<{ count: number }>(
    await sql`select count(*)::int as count from kudos where ride_id = ${id}`
  );

  return NextResponse.json({
    given: !existing,
    count: Number(count?.count ?? 0),
  });
}
