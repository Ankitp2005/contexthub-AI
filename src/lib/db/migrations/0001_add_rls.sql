-- Enable Row Level Security (RLS) on all 14 tables
ALTER TABLE "organizations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "github_installations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "repositories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pull_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pull_request_files" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ownership_rules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "deployment_constraints" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "incidents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "incident_services" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "risk_assessments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "risk_factors" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "mcp_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "mcp_responses" ENABLE ROW LEVEL SECURITY;

-- Define RLS policies based on auth.jwt() -> 'sub' matching user organization_id / id
CREATE POLICY organizations_policy ON "organizations" FOR ALL USING (id = (auth.jwt() ->> 'sub'));
CREATE POLICY users_policy ON "users" FOR ALL USING (organization_id = (auth.jwt() ->> 'sub'));
CREATE POLICY github_installations_policy ON "github_installations" FOR ALL USING (organization_id = (auth.jwt() ->> 'sub'));
CREATE POLICY repositories_policy ON "repositories" FOR ALL USING (organization_id = (auth.jwt() ->> 'sub'));

CREATE POLICY pull_requests_policy ON "pull_requests" FOR ALL USING (EXISTS (
  SELECT 1 FROM "repositories" WHERE "repositories".id = repository_id AND "repositories".organization_id = (auth.jwt() ->> 'sub')
));

CREATE POLICY pull_request_files_policy ON "pull_request_files" FOR ALL USING (EXISTS (
  SELECT 1 FROM "pull_requests" JOIN "repositories" ON "pull_requests".repository_id = "repositories".id WHERE "pull_requests".id = pull_request_id AND "repositories".organization_id = (auth.jwt() ->> 'sub')
));

CREATE POLICY ownership_rules_policy ON "ownership_rules" FOR ALL USING (EXISTS (
  SELECT 1 FROM "repositories" WHERE "repositories".id = repository_id AND "repositories".organization_id = (auth.jwt() ->> 'sub')
));

CREATE POLICY deployment_constraints_policy ON "deployment_constraints" FOR ALL USING (organization_id = (auth.jwt() ->> 'sub'));
CREATE POLICY incidents_policy ON "incidents" FOR ALL USING (organization_id = (auth.jwt() ->> 'sub'));

CREATE POLICY incident_services_policy ON "incident_services" FOR ALL USING (EXISTS (
  SELECT 1 FROM "incidents" WHERE "incidents".id = incident_id AND "incidents".organization_id = (auth.jwt() ->> 'sub')
));

CREATE POLICY risk_assessments_policy ON "risk_assessments" FOR ALL USING (EXISTS (
  SELECT 1 FROM "pull_requests" JOIN "repositories" ON "pull_requests".repository_id = "repositories".id WHERE "pull_requests".id = pull_request_id AND "repositories".organization_id = (auth.jwt() ->> 'sub')
));

CREATE POLICY risk_factors_policy ON "risk_factors" FOR ALL USING (EXISTS (
  SELECT 1 FROM "risk_assessments" JOIN "pull_requests" ON "risk_assessments".pull_request_id = "pull_requests".id JOIN "repositories" ON "pull_requests".repository_id = "repositories".id WHERE "risk_assessments".id = risk_assessment_id AND "repositories".organization_id = (auth.jwt() ->> 'sub')
));

CREATE POLICY mcp_requests_policy ON "mcp_requests" FOR ALL USING (organization_id = (auth.jwt() ->> 'sub'));

CREATE POLICY mcp_responses_policy ON "mcp_responses" FOR ALL USING (EXISTS (
  SELECT 1 FROM "mcp_requests" WHERE "mcp_requests".id = mcp_request_id AND "mcp_requests".organization_id = (auth.jwt() ->> 'sub')
));