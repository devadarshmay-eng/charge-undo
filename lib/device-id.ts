const DEVICE_COOKIE = "device_id";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function readDeviceId(): string | undefined {
  return document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${DEVICE_COOKIE}=`))
    ?.split("=", 2)[1];
}

/** Creates the client-readable, long-lived device cookie used by write requests. */
export function getDeviceId(): string {
  const existingId = readDeviceId();
  if (existingId) return existingId;

  let deviceId;
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    deviceId = crypto.randomUUID();
  } else {
    deviceId = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  document.cookie = `${DEVICE_COOKIE}=${deviceId}; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
  return deviceId;
}

export async function writeJson<TResponse>(
  url: string,
  body: Record<string, unknown> & { honeypot?: string },
): Promise<TResponse | null> {
  if (typeof body.honeypot === "string" && body.honeypot.trim()) {
    return null;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-device-id": getDeviceId() },
    body: JSON.stringify(body),
  });

  const payload: unknown = await response.json();
  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : "Request failed.";
    throw new Error(message);
  }
  return payload as TResponse;
}
