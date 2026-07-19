import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Run a fast, cheap query to touch the database and keep it awake
    await db.execute(sql`SELECT 1`);
    return NextResponse.json({ status: "healthy", database: "connected" });
  } catch (error) {
    console.error("[Health Check] Database connection failed:", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
