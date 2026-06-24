-- Step 5: Ownership Intelligence -- Implicit Ownership Mapping
-- Creates commit_activity and implicit_ownership tables

CREATE TABLE IF NOT EXISTS "commit_activity" (
  "id" text PRIMARY KEY NOT NULL,
  "repository_id" text NOT NULL,
  "file_path" text NOT NULL,
  "author_login" text NOT NULL,
  "commit_count" integer NOT NULL DEFAULT 0,
  "additions" integer NOT NULL DEFAULT 0,
  "deletions" integer NOT NULL DEFAULT 0,
  "last_committed_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "implicit_ownership" (
  "id" text PRIMARY KEY NOT NULL,
  "repository_id" text NOT NULL,
  "file_path" text NOT NULL,
  "owner_login" text NOT NULL,
  "confidence_score" numeric NOT NULL,
  "commit_count" integer NOT NULL DEFAULT 0,
  "total_commits" integer NOT NULL DEFAULT 0,
  "computed_at" timestamp NOT NULL DEFAULT now()
);

ALTER TABLE "commit_activity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "implicit_ownership" ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS commit_activity_repo_file_idx ON "commit_activity" ("repository_id", "file_path");
CREATE INDEX IF NOT EXISTS implicit_ownership_repo_file_idx ON "implicit_ownership" ("repository_id", "file_path");
