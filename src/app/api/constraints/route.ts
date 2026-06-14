import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createConstraint, deleteConstraint } from "@/domains/constraints/repositories";
import { ConstraintInputSchema } from "@/domains/constraints/services";

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = ConstraintInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { scope, constraint_type, description, severity } = parsed.data;

    const newConstraint = await createConstraint({
      id: crypto.randomUUID(),
      organization_id: userId,
      scope,
      constraint_type,
      description,
      severity,
    });

    return NextResponse.json({ success: true, constraint: newConstraint });
  } catch (error) {
    console.error("[Constraints API] Error creating constraint:", error);
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
    return NextResponse.json({ error: "Missing constraint ID" }, { status: 400 });
  }

  try {
    await deleteConstraint(id, userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Constraints API] Error deleting constraint:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
