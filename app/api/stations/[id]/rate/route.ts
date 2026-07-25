import { sql } from "drizzle-orm";
import { NextRequest } from "next/server";
import { db } from "@/db";
import { errorResponse, getDeviceId, requireNumber, requireObject, verifyTurnstile } from "@/lib/server/write-security";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const body = requireObject(await request.json()); const deviceId = getDeviceId(request); await verifyTurnstile(body.turnstileToken, request);
    const score = requireNumber(body.score, "score", 1, 5); const { id: stationId } = await context.params;
    const station = await db.execute<{ id: string }>(sql`SELECT id FROM stations WHERE id = ${stationId}`);
    if (!station.rows[0]) return Response.json({ error: "Station not found." }, { status: 404 });
    await db.execute(sql`INSERT INTO device_trust (device_id) VALUES (${deviceId}) ON CONFLICT (device_id) DO NOTHING`);
    const rating = await db.execute<{ id: string }>(sql`INSERT INTO ratings (station_id, device_id, score) VALUES (${stationId}, ${deviceId}, ${score}) RETURNING id`);
    return Response.json({ id: rating.rows[0]!.id }, { status: 201 });
  } catch (error: unknown) { return errorResponse(error); }
}
