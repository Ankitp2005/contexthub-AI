import postgres from "postgres";

async function testConnections() {
  const pooledUrl = "postgresql://postgres.uaupywofibtcsqahxgqj:Ankit%4018pandey@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres";
  const transactionUrl = "postgresql://postgres.uaupywofibtcsqahxgqj:Ankit%4018pandey@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres";
  const directUrl = "postgresql://postgres:Ankit%4018pandey@db.uaupywofibtcsqahxgqj.supabase.co:5432/postgres";

  console.log("=== Testing Pooled URL (5432) ===");
  try {
    const sql = postgres(pooledUrl, { connect_timeout: 5 });
    await sql`SELECT 1`;
    console.log("SUCCESS");
    await sql.end();
  } catch (e) {
    console.error("FAILED:", e);
  }

  console.log("\n=== Testing Transaction URL (6543) ===");
  try {
    const sql = postgres(transactionUrl, { connect_timeout: 5 });
    await sql`SELECT 1`;
    console.log("SUCCESS");
    await sql.end();
  } catch (e) {
    console.error("FAILED:", e);
  }

  console.log("\n=== Testing Direct URL (5432) ===");
  try {
    const sql = postgres(directUrl, { connect_timeout: 5 });
    await sql`SELECT 1`;
    console.log("SUCCESS");
    await sql.end();
  } catch (e) {
    console.error("FAILED:", e);
  }

  process.exit(0);
}

testConnections();
