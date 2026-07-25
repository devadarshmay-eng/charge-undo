import { sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  errorResponse,
  getDeviceId,
  optionalString as optionalWriteString,
  requireNumber,
  requireObject,
  requireString,
  verifyTurnstile,
} from "@/lib/server/write-security";

const CONFIRMATION_FRESHNESS_HOURS = 4;
const CACHE_CONTROL = "public, s-maxage=60, stale-while-revalidate=300";
const PLACEHOLDER_VALUES = new Set(["n/a", "na", "not available", "unknown"]);

type BoundingBox = {
  minLatitude: number;
  minLongitude: number;
  maxLatitude: number;
  maxLongitude: number;
};

type ReportStatus = "available" | "occupied" | "broken" | "missing" | "other";
type DisplayStatus = ReportStatus | "unconfirmed" | "disputed";

type StationQueryRow = {
  id: string;
  source: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone: string | null;
  website: string | null;
  hours: string | null;
  operator: string | null;
  stationConnectorType: string | null;
  precisionFlag: string | null;
  status: DisplayStatus | null;
  reportConnectorType: string | null;
  coverPhotoUrl: string | null;
  statusUpdatedAt: Date | null;
  ratingAverage: number | null;
};

type StationResponse = {
  id: string;
  source: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  website?: string;
  hours?: string;
  operator?: string;
  connectorType?: string;
  precisionFlag?: string;
  status?: DisplayStatus;
  statusUpdatedAt?: string;
  coverPhotoUrl?: string;
  ratingAverage?: number;
};

function optionalString(value: string | null): string | undefined {
  const trimmedValue = value?.trim();

  if (!trimmedValue || PLACEHOLDER_VALUES.has(trimmedValue.toLowerCase())) {
    return undefined;
  }

  return trimmedValue;
}

function parseBoundingBox(value: string | null): BoundingBox | null {
  if (!value) return null;

  const coordinates = value.split(",").map((coordinate) => Number(coordinate.trim()));
  if (coordinates.length !== 4 || coordinates.some((coordinate) => !Number.isFinite(coordinate))) {
    throw new Error("bbox must be minLongitude,minLatitude,maxLongitude,maxLatitude.");
  }

  const [minLongitude, minLatitude, maxLongitude, maxLatitude] = coordinates;
  const hasValidBounds =
    minLatitude >= -90 &&
    maxLatitude <= 90 &&
    minLongitude >= -180 &&
    maxLongitude <= 180 &&
    minLatitude <= maxLatitude &&
    minLongitude <= maxLongitude;

  if (!hasValidBounds) {
    throw new Error("bbox coordinates are outside valid bounds or are ordered incorrectly.");
  }

  return { minLatitude, minLongitude, maxLatitude, maxLongitude };
}

function toStationResponse(row: StationQueryRow): StationResponse {
  const station: StationResponse = {
    id: row.id,
    source: row.source,
    name: row.name,
    address: row.address,
    lat: row.lat,
    lng: row.lng,
  };
  const phone = optionalString(row.phone);
  const website = optionalString(row.website);
  const hours = optionalString(row.hours);
  const operator = optionalString(row.operator);
  const connectorType = optionalString(row.reportConnectorType) ?? optionalString(row.stationConnectorType);
  const precisionFlag = optionalString(row.precisionFlag);
  const coverPhotoUrl = optionalString(row.coverPhotoUrl);

  if (phone) station.phone = phone;
  if (website) station.website = website;
  if (hours) station.hours = hours;
  if (operator) station.operator = operator;
  if (connectorType) station.connectorType = connectorType;
  if (precisionFlag) station.precisionFlag = precisionFlag;
  if (row.status) station.status = row.status;
  if (row.statusUpdatedAt) station.statusUpdatedAt = row.statusUpdatedAt.toISOString();
  if (coverPhotoUrl) station.coverPhotoUrl = coverPhotoUrl;
  if (row.ratingAverage !== null) station.ratingAverage = row.ratingAverage;

  return station;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  let boundingBox: BoundingBox | null;

  try {
    boundingBox = parseBoundingBox(request.nextUrl.searchParams.get("bbox"));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Invalid bbox.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const boundsCondition = boundingBox
    ? sql`
        AND s.lat >= ${boundingBox.minLatitude}
        AND s.lat <= ${boundingBox.maxLatitude}
        AND s.lng >= ${boundingBox.minLongitude}
        AND s.lng <= ${boundingBox.maxLongitude}
      `
    : sql``;
  const result = await db.execute<StationQueryRow>(sql`
    SELECT
      s.id,
      s.source,
      s.name,
      s.address,
      s.lat,
      s.lng,
      s.phone,
      s.website,
      s.hours,
      s.operator,
      s.connector_type AS "stationConnectorType",
      s.precision_flag AS "precisionFlag",
      CASE
        WHEN latest_report.resolution = 'disputed' THEN 'disputed'
        WHEN latest_report.resolution = 'verified'
          AND latest_report.last_confirmation_at >= NOW() - (${CONFIRMATION_FRESHNESS_HOURS} * INTERVAL '1 hour')
          THEN latest_report.status_preset::text
        WHEN latest_report.id IS NOT NULL THEN 'unconfirmed'
        ELSE NULL
      END AS status,
      latest_report.connector_type AS "reportConnectorType",
      latest_report.photo_url AS "coverPhotoUrl",
      latest_report.created_at AS "statusUpdatedAt",
      rating.average AS "ratingAverage"
    FROM stations AS s
    LEFT JOIN LATERAL (
      SELECT r.id, r.status_preset, r.connector_type, r.photo_url, r.created_at, r.resolution,
        (SELECT MAX(c.created_at) FROM confirmations AS c WHERE c.report_id = r.id) AS last_confirmation_at
      FROM reports AS r
      WHERE r.station_id = s.id
      ORDER BY r.created_at DESC, r.id DESC
      LIMIT 1
    ) AS latest_report ON TRUE
    LEFT JOIN LATERAL (
      SELECT AVG(score)::double precision AS average
      FROM ratings
      WHERE station_id = s.id
    ) AS rating ON TRUE
    WHERE TRUE ${boundsCondition}
    ORDER BY s.name ASC
  `);

  return NextResponse.json(
    { stations: result.rows.map(toStationResponse) },
    { headers: { "Cache-Control": CACHE_CONTROL } },
  );
}

/** Add Missing Station. The new station starts without a status report. */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = requireObject(await request.json());
    const deviceId = getDeviceId(request);
    await verifyTurnstile(body.turnstileToken, request);
    const name = requireString(body.name, "name", 200);
    const address = requireString(body.address, "address", 500);
    const lat = requireNumber(body.lat, "lat", -90, 90);
    const lng = requireNumber(body.lng, "lng", -180, 180);
    const phone = optionalWriteString(body.phone, "phone", 100) ?? "";
    const website = optionalWriteString(body.website, "website", 2_000) ?? "";
    const hours = optionalWriteString(body.hours, "hours", 200) ?? "";
    const operator = optionalWriteString(body.operator, "operator", 200) ?? "";
    const connectorType = optionalWriteString(body.connectorType, "connectorType", 100);
    const id = `user-${crypto.randomUUID()}`;
    await db.execute(sql`INSERT INTO device_trust (device_id) VALUES (${deviceId}) ON CONFLICT (device_id) DO NOTHING`);
    await db.execute(sql`
      INSERT INTO stations (id, source, name, address, lat, lng, phone, website, hours, operator, connector_type, owner_email)
      VALUES (${id}, 'user-submitted', ${name}, ${address}, ${lat}, ${lng}, ${phone}, ${website}, ${hours}, ${operator}, ${connectorType}, ${null})`);
    return Response.json({ id }, { status: 201 });
  } catch (error: unknown) { return errorResponse(error); }
}
