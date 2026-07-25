import { NextRequest } from "next/server";

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

type TurnstileResponse = {
  success: boolean;
  "error-codes"?: string[];
};

export function getDeviceId(request: NextRequest): string {
  const deviceId = request.headers.get("x-device-id") ?? request.cookies.get("device_id")?.value;

  if (!deviceId || !UUID_PATTERN.test(deviceId)) {
    throw new HttpError(400, "A valid device ID is required.");
  }

  return deviceId;
}

export async function verifyTurnstile(token: unknown, request: NextRequest): Promise<void> {
  if (typeof token !== "string" || !token.trim()) {
    throw new HttpError(400, "A Turnstile token is required.");
  }

  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    throw new HttpError(503, "Turnstile verification is not configured.");
  }

  let response: Response;
  try {
    response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret,
        response: token,
        remoteip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "",
      }),
      cache: "no-store",
    });
  } catch {
    throw new HttpError(502, "Turnstile verification could not be reached.");
  }

  if (!response.ok) {
    throw new HttpError(502, "Turnstile verification failed.");
  }

  const result = (await response.json()) as TurnstileResponse;
  if (!result.success) {
    throw new HttpError(403, "Turnstile verification was rejected.");
  }
}

export function requireObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HttpError(400, "Request body must be a JSON object.");
  }
  return value as Record<string, unknown>;
}

export function requireString(value: unknown, field: string, maximumLength?: number): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new HttpError(400, `${field} is required.`);
  }
  const trimmed = value.trim();
  if (maximumLength && trimmed.length > maximumLength) {
    throw new HttpError(400, `${field} must be at most ${maximumLength} characters.`);
  }
  return trimmed;
}

export function optionalString(value: unknown, field: string, maximumLength?: number): string | null {
  if (value === undefined || value === null || value === "") return null;
  return requireString(value, field, maximumLength);
}

export function requireNumber(value: unknown, field: string, minimum: number, maximum: number): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > maximum) {
    throw new HttpError(400, `${field} must be a number between ${minimum} and ${maximum}.`);
  }
  return value;
}

export function errorResponse(error: unknown): Response {
  if (error instanceof HttpError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error(error);
  return Response.json({ error: "Internal server error." }, { status: 500 });
}
