// app/api/orders/[id]/notify/route.ts
console.log(">>> ROUTE FILE LOADED");

import { NextRequest, NextResponse } from "next/server";
import { sendLateOrderNotification } from "@/server/services/lateNotifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;  // ✅ FIXED

  let roleInput = "";
  try {
    const payload = await request.json();
    if (payload && typeof payload.role === "string") {
      roleInput = payload.role;
    }
  } catch {}

  const result = await sendLateOrderNotification(id, roleInput);
  return NextResponse.json(result.body, { status: result.status });
}
