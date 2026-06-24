// src/app/api/feedback/route.ts
//
// POST /api/feedback
// Accepts thumbs-up / thumbs-down feedback on a risk assessment from engineers
// or AI agents. Persists to agent_feedback table.
//
// Body:
//   { riskAssessmentId: string, feedbackType: "thumbs_up" | "thumbs_down", comment?: string }
//
// Auth: Clerk session via currentUser()

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { agent_feedback, risk_assessments, repositories, organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const FeedbackSchema = z.object({
  riskAssessmentId: z.string().min(1),
  feedbackType: z.enum(["thumbs_up", "thumbs_down"]),
  comment: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = FeedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { riskAssessmentId, feedbackType, comment } = parsed.data;

  // Verify the risk assessment exists and resolve organizationId through the chain:
  // risk_assessments → pull_requests → repositories → organizations
  const assessmentRows = await db
    .select({ id: risk_assessments.id, pull_request_id: risk_assessments.pull_request_id })
    .from(risk_assessments)
    .where(eq(risk_assessments.id, riskAssessmentId))
    .limit(1);

  if (assessmentRows.length === 0) {
    return NextResponse.json({ error: "Risk assessment not found" }, { status: 404 });
  }

  // Resolve organizationId from Clerk user → organizations table
  const orgRows = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.id, user.id))
    .limit(1);

  const organizationId = orgRows[0]?.id;
  if (!organizationId) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  await db.insert(agent_feedback).values({
    id: crypto.randomUUID(),
    risk_assessment_id: riskAssessmentId,
    organization_id: organizationId,
    feedback_type: feedbackType,
    comment: comment ?? null,
    submitted_by: user.id,
  });

  return NextResponse.json({ success: true, feedbackType });
}
