ALTER TABLE "github_installations" ALTER COLUMN "github_installation_id" TYPE bigint;--> statement-breakpoint
ALTER TABLE "repositories" ALTER COLUMN "github_installation_id" TYPE bigint;--> statement-breakpoint
ALTER TABLE "repositories" ALTER COLUMN "github_repo_id" TYPE bigint;--> statement-breakpoint
ALTER TABLE "pull_requests" ALTER COLUMN "github_pr_id" TYPE bigint;