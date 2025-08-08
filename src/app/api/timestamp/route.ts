// app/api/timestamp/route.ts
import { NextResponse } from "next/server";
import { getTimestamp, saveTimestamp } from "@/server/timestampService";

export async function GET() {
  const ts = getTimestamp();
  return NextResponse.json({ lastUpdateTimestamp: ts });
}

export async function POST(req: Request) {
  const body = await req.json();
  if (body.timestamp === undefined || body.timestamp === null) {
    return NextResponse.json({ error: "Timestamp required" }, { status: 400 });
  }
  saveTimestamp(body.timestamp);
  return NextResponse.json({ success: true });
}
