CREATE TABLE "agent_executions" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"agent_name" text NOT NULL,
	"repository_id" text NOT NULL,
	"task_description" text NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "agent_executions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY agent_executions_policy ON "agent_executions" FOR ALL USING (organization_id = (auth.jwt() ->> 'sub'));

