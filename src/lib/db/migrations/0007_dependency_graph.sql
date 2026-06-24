-- Step 6: Engineering Brain -- Dependency Graph
-- Creates the dependency_graph table for tracking inter-repository dependency edges.

CREATE TABLE IF NOT EXISTS "dependency_graph" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL,
  "source_repository_id" text NOT NULL,
  "package_name" text NOT NULL,
  "package_version" text NOT NULL,
  "ecosystem" text NOT NULL,
  "dependent_repository_id" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

ALTER TABLE "dependency_graph" ENABLE ROW LEVEL SECURITY;

-- Fast lookup: all deps for a given source repo
CREATE INDEX IF NOT EXISTS dep_graph_source_idx ON "dependency_graph" ("organization_id", "source_repository_id");
-- Fast reverse lookup: who depends on a given package name (blast radius)
CREATE INDEX IF NOT EXISTS dep_graph_package_idx ON "dependency_graph" ("organization_id", "package_name");
-- Fast lookup: repos that depend on another tracked internal repo
CREATE INDEX IF NOT EXISTS dep_graph_dependent_repo_idx ON "dependency_graph" ("dependent_repository_id") WHERE "dependent_repository_id" IS NOT NULL;
