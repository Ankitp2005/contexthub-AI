import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// Singleton pattern to avoid connection exhaustion in dev mode
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

const conn =
  globalForDb.conn ??
  postgres(connectionString, {
    prepare: false,
    max: 20,
    idle_timeout: 30,
    connect_timeout: 10,
    max_lifetime: 60 * 30,
    connection: {
      application_name: "contexthub-ai",
    },
  });
if (process.env.NODE_ENV !== "production") globalForDb.conn = conn;

export const db = drizzle(conn, { schema });
