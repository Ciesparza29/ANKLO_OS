import { NextResponse } from "next/server";
import { healthResponseSchema, type HealthResponse } from "@anklo/contracts";

export function createHealthResponse(now = new Date()): HealthResponse {
  return healthResponseSchema.parse({
    status: "ok",
    service: "anklo-os-web",
    timestamp: now.toISOString(),
    version: "0.0.0",
  });
}

export function GET() {
  try {
    return NextResponse.json(createHealthResponse(), { status: 200 });
  } catch {
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
