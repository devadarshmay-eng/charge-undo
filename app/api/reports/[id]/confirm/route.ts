import { sql } from "drizzle-orm";
import { NextRequest } from "next/server";
import { db } from "@/db";
import { errorResponse, getDeviceId, requireObject, verifyTurnstile } from "@/lib/server/write-security";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const body = requireObject(await request.json()); const deviceId = getDeviceId(request); await verifyTurnstile(body.turnstileToken, request);
    const { id } = await context.params;
    const result = await db.transaction(async (tx) => {
      const report = await tx.execute<{ deviceId: string; resolution: "verified" | "disputed" | null }>(sql`SELECT device_id AS "deviceId", resolution FROM reports WHERE id = ${id} FOR UPDATE`);
      if (!report.rows[0]) return { error: "Report not found.", status: 404 };
      if (report.rows[0].deviceId === deviceId) return { error: "You cannot confirm your own report.", status: 403 };
      await tx.execute(sql`INSERT INTO device_trust (device_id) VALUES (${deviceId}) ON CONFLICT (device_id) DO NOTHING`);
      const confirmation = await tx.execute(sql`INSERT INTO confirmations (report_id, device_id) VALUES (${id}, ${deviceId}) ON CONFLICT (report_id, device_id) DO NOTHING RETURNING id`);
      if (!confirmation.rows[0]) return { error: "You already confirmed this report.", status: 409 };
      const weight = await tx.execute<{ total: number }>(sql`SELECT COALESCE(SUM(COALESCE(dt.trust_score, 1)), 0)::double precision AS total FROM confirmations c LEFT JOIN device_trust dt ON dt.device_id = c.device_id WHERE c.report_id = ${id}`);
      if (weight.rows[0]!.total >= 3 && report.rows[0].resolution === null) {
        await tx.execute(sql`UPDATE reports SET resolution = 'verified', resolved_at = NOW() WHERE id = ${id}`);
        await tx.execute(sql`UPDATE device_trust SET trust_score = trust_score + 0.1, updated_at = NOW() WHERE device_id = ${report.rows[0].deviceId}`);
        return { verified: true };
      }
      return { verified: report.rows[0].resolution === "verified" };
    });
    if ("error" in result) return Response.json({ error: result.error }, { status: result.status });
    return Response.json({ status: result.verified ? "verified" : "unconfirmed" }, { status: 201 });
  } catch (error: unknown) { return errorResponse(error); }
}
