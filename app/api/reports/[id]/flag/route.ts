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
      if (report.rows[0].deviceId === deviceId) return { error: "You cannot flag your own report.", status: 403 };
      await tx.execute(sql`INSERT INTO device_trust (device_id) VALUES (${deviceId}) ON CONFLICT (device_id) DO NOTHING`);
      const flag = await tx.execute(sql`INSERT INTO flags (report_id, device_id) VALUES (${id}, ${deviceId}) ON CONFLICT (report_id, device_id) DO NOTHING RETURNING id`);
      if (!flag.rows[0]) return { error: "You already flagged this report.", status: 409 };
      const count = await tx.execute<{ total: number }>(sql`SELECT COUNT(*)::integer AS total FROM flags WHERE report_id = ${id}`);
      if (count.rows[0]!.total >= 3 && report.rows[0].resolution !== "disputed") {
        await tx.execute(sql`UPDATE reports SET resolution = 'disputed', resolved_at = NOW() WHERE id = ${id}`);
        const delta = report.rows[0].resolution === "verified" ? -0.2 : -0.1;
        await tx.execute(sql`UPDATE device_trust SET trust_score = GREATEST(0, trust_score + ${delta}), updated_at = NOW() WHERE device_id = ${report.rows[0].deviceId}`);
        return { disputed: true };
      }
      return { disputed: report.rows[0].resolution === "disputed" };
    });
    if ("error" in result) return Response.json({ error: result.error }, { status: result.status });
    return Response.json({ status: result.disputed ? "disputed" : "unconfirmed" }, { status: 201 });
  } catch (error: unknown) { return errorResponse(error); }
}
