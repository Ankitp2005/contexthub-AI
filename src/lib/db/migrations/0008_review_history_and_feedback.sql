-- Step 7: Final Integration -- review_history and agent_feedback tables

CREATE TABLE IF NOT EXISTS "review_history" (
  "id" text PRIMARY KEY NOT NULL,
  "risk_assessment_id" text NOT NULL,
  "pull_request_id" text NOT NULL,
  "suggested_reviewer" text NOT NULL,
  "status" text NOT NULL DEFAULT 'suggested',
  "reason" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "agent_feedback" (
  "id" text PRIMARY KEY NOT NULL,
  "risk_assessment_id" text NOT NULL,
  "organization_id" text NOT NULL,
  "feedback_type" text NOT NULL,
  "comment" text,
  "submitted_by" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);

ALTER TABLE "review_history" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "agent_feedback" ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS review_history_pr_idx ON "review_history" ("pull_request_id");
CREATE INDEX IF NOT EXISTS review_history_assessment_idx ON "review_history" ("risk_assessment_id");
CREATE INDEX IF NOT EXISTS agent_feedback_assessment_idx ON "agent_feedback" ("risk_assessment_id");
CREATE INDEX IF NOT EXISTS agent_feedback_org_idx ON "agent_feedback" ("organization_id");
