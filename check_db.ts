import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./src/lib/db/schema";

async function checkDatabase() {
  const url = process.env.DATABASE_URL!;
  const conn = postgres(url, { prepare: false });
  const db = drizzle(conn, { schema });

  try {
    const installations = await db.select().from(schema.github_installations);
    const repos = await db.select().from(schema.repositories);
    const prs = await db.select().from(schema.pull_requests);

    console.log("=== GITHUB INSTALLATIONS ===");
    console.log(installations.map(i => ({ id: i.id, orgId: i.organization_id, githubId: i.github_installation_id })));

    console.log("\n=== CONNECTED REPOSITORIES ===");
    console.log(repos.map(r => ({ id: r.id, name: r.full_name, orgId: r.organization_id, lastScanned: r.last_scanned_at })));

    console.log("\n=== INGESTED PULL REQUESTS ===");
    console.log(prs.map(p => ({ id: p.id, number: p.number, title: p.title, state: p.state })));
  } catch (error) {
    console.error("Database connection check failed:", error);
  } finally {
    await conn.end();
    process.exit(0);
  }
}

checkDatabase();
