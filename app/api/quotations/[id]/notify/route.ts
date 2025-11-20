import { NextRequest, NextResponse } from "next/server";

import { sendLateQuotationNotification } from "@/server/services/lateNotifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  let roleInput = "";
  try {
    const payload = await request.json();
    if (payload && typeof payload === "object" && typeof payload.role === "string") {
      roleInput = payload.role;
    }
  } catch {
    // ignore malformed bodies and treat as empty
  }

  const result = await sendLateQuotationNotification(id, roleInput);
  return NextResponse.json(result.body, { status: result.status });
}
