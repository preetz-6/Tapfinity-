export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Top-up temporarily disabled" },
    { status: 410 }
  );
}
