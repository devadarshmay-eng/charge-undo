import { sql } from "drizzle-orm";
import { NextRequest } from "next/server";
import { db } from "@/db";
import {
  errorResponse,
  getDeviceId,
  optionalString,
  requireObject,
  requireString,
  verifyTurnstile,
} from "@/lib/server/write-security";

const STATUSES = new Set(["available", "occupied", "broken", "missing", "other"]);

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = requireObject(await request.json());
    const deviceId = getDeviceId(request);
    await verifyTurnstile(body.turnstileToken, request);
    const stationId = requireString(body.stationId, "stationId", 200);
    const statusPreset = requireString(body.statusPreset, "statusPreset", 20);
    if (!STATUSES.has(statusPreset)) return Response.json({ error: "Invalid statusPreset." }, { status: 400 });
    const connectorType = optionalString(body.connectorType, "connectorType", 100);
    const customText = optionalString(body.customText, "customText", 80);
    const photoUrl = optionalString(body.photoUrl, "photoUrl", 2_000);
    const result = await db.transaction(async (tx) => {
      const station = await tx.execute<{ id: string }>(sql`SELECT id FROM stations WHERE id = ${stationId}`);
      if (!station.rows[0]) return { error: "Station not found.", status: 404 };
      const cooldown = await tx.execute<{ id: string }>(sql`
        SELECT id FROM reports WHERE station_id = ${stationId} AND device_id = ${deviceId}
        AND created_at > NOW() - INTERVAL '15 minutes' LIMIT 1`);
      if (cooldown.rows[0]) return { error: "You can report this station again in 15 minutes.", status: 429 };
      await tx.execute(sql`INSERT INTO device_trust (device_id) VALUES (${deviceId}) ON CONFLICT (device_id) DO NOTHING`);
      const created = await tx.execute<{ id: string }>(sql`
        INSERT INTO reports (station_id, device_id, status_preset, connector_type, custom_text, photo_url)
        VALUES (${stationId}, ${deviceId}, ${statusPreset}, ${connectorType}, ${customText}, ${photoUrl}) RETURNING id`);
      return { id: created.rows[0]!.id };
    });
    if ("error" in result) return Response.json({ error: result.error }, { status: result.status });
    return Response.json({ id: result.id, status: "unconfirmed" }, { status: 201 });
  } catch (error: unknown) { return errorResponse(error); }
}
