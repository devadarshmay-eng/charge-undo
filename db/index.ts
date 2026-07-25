import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

let _db: NodePgDatabase<typeof schema> | null = null;

function getDb(): NodePgDatabase<typeof schema> {
  if (!_db) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is missing.");
    }
    const pool = new Pool({ connectionString: databaseUrl });
    _db = drizzle({ client: pool, schema });
  }
  return _db;
}

// Export a typed Proxy that lazy-initializes the Drizzle instance upon first property access.
// This prevents DATABASE_URL checks from throwing at module load/build time while maintaining types.
export const db: NodePgDatabase<typeof schema> = new Proxy({} as any, {
  get(target, prop, receiver) {
    const instance = getDb();
    const value = Reflect.get(instance, prop);
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  }
});

export type Database = typeof db;
