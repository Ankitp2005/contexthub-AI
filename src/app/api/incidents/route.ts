import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createIncident, deleteIncident } from "@/domains/incidents/repositories";
import { IncidentInputSchema } from "@/domains/incidents/services";

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = IncidentInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { title, description, severity, status, services } = parsed.data;

    const newIncident = await createIncident(
      {
        id: crypto.randomUUID(),
        organization_id: userId,
        title,
        description,
        severity,
        status,
      },
      services
    );

    return NextResponse.json({ success: true, incident: newIncident });
  } catch (error) {
    console.error("[Incidents API] Error creating incident:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing incident ID" }, { status: 400 });
  }

  try {
    await deleteIncident(id, userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Incidents API] Error deleting incident:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
