import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

type Station = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  website: string;
  hours: string;
  operator: string;
  source: string;
  precision_flag: string | null;
  geocode_method: string | null;
};

type StationValue = string | number | null;

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, "..");

async function loadDatabaseUrl(): Promise<string> {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const envPath = path.join(projectDirectory, ".env");
  const envContents = await readFile(envPath, "utf8");
  const databaseUrlLine = envContents
    .split(/\r?\n/)
    .find((line) => line.trim().startsWith("DATABASE_URL="));

  if (!databaseUrlLine) {
    throw new Error("DATABASE_URL is not set in the environment or .env file.");
  }

  const value = databaseUrlLine.slice(databaseUrlLine.indexOf("=") + 1).trim();
  return value.replace(/^['\"]|['\"]$/g, "");
}

async function main(): Promise<void> {
  const dataPath = path.join(projectDirectory, "data", "stations_merged.json");
  const stations = JSON.parse(await readFile(dataPath, "utf8")) as Station[];

  if (stations.length !== 346) {
    throw new Error(`Expected 346 stations, found ${stations.length}.`);
  }

  if (new Set(stations.map((station) => station.id)).size !== stations.length) {
    throw new Error("Station data contains duplicate IDs.");
  }

  const client = new Client({ connectionString: await loadDatabaseUrl() });
  await client.connect();

  let inserted = 0;
  let skipped = 0;

  try {
    await client.query("BEGIN");
    const columnsPerStation = 11;
    const placeholders = stations
      .map((_, stationIndex) => {
        const firstParameter = stationIndex * columnsPerStation + 1;
        const parameters = Array.from(
          { length: columnsPerStation },
          (_, columnIndex) => `$${firstParameter + columnIndex}`,
        );
        return `(${parameters.join(", ")})`;
      })
      .join(", ");
    const values: StationValue[] = stations.flatMap((station) => [
      station.id,
      station.name,
      station.address,
      station.lat,
      station.lng,
      station.phone,
      station.website,
      station.hours,
      station.operator,
      station.source,
      station.precision_flag,
    ]);
    const result = await client.query(
      `INSERT INTO stations (
         id, name, address, lat, lng, phone, website, hours,
         operator, source, precision_flag
       ) VALUES ${placeholders}
       ON CONFLICT (id) DO NOTHING
       RETURNING id`,
      values,
    );

    inserted = result.rowCount ?? 0;
    skipped = stations.length - inserted;

    await client.query("COMMIT");
    console.log(`Seed complete: ${inserted} inserted, ${skipped} skipped as already present.`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error("Seed failed:", error);
  process.exitCode = 1;
});
