import type { RiskAssessmentResult, RiskLevel } from "../../risk/types";

const GITHUB_API_BASE = "https://api.github.com";
const GITHUB_API_VERSION = "2022-11-28";

export interface PublishRiskCommentInput {
  installationId: number;
  owner: string;
  repo: string;
  prNumber: number;
  assessment: RiskAssessmentResult;
  explanation?: string;
}

export interface PublishRiskCommentResult {
  commentId: number;
  htmlUrl: string;
}

/**
 * Maps risk levels to deterministic recommendations.
 */
export function getRecommendationForLevel(level: RiskLevel): string {
  switch (level) {
    case "LOW":
      return "Low risk: no immediate action";
    case "MEDIUM":
      return "Medium risk: consider additional review";
    case "HIGH":
      return "High risk: require senior review";
    case "CRITICAL":
      return "Critical: block merge, escalate";
    default:
      return "No recommendation available.";
  }
}

/**
 * Formats the Markdown comment body for the GitHub pull request.
 */
export function formatRiskComment(
  assessment: RiskAssessmentResult,
  explanation?: string
): string {
  const { score, level, factors } = assessment;
  const recommendation = getRecommendationForLevel(level);

  const header = `## 🔍 ContextHub Risk Assessment`;
  const summaryLine = `**Risk Score:** ${score}/10 — **${level}**`;

  let explanationSection = "";
  if (explanation) {
    explanationSection = `\n### Explanation\n${explanation}\n`;
  }

  let factorsSection = "\n### Triggered Risk Factors\n";
  if (factors && factors.length > 0) {
    factorsSection += `| Factor | Weight | Reason |\n| :--- | :--- | :--- |\n`;
    factors.forEach((f) => {
      const sign = f.weight >= 0 ? "+" : "";
      factorsSection += `| ${f.name} | ${sign}${f.weight} | ${f.reason} |\n`;
    });
  } else {
    factorsSection += `*No specific risk factors triggered.*\n`;
  }

  const recommendationSection = `\n### Recommendation\n${recommendation}`;

  return `${header}\n\n${summaryLine}\n${explanationSection}${factorsSection}${recommendationSection}`;
}

/**
 * Publishes a formatted risk assessment comment to a GitHub PR.
 */
export async function publishRiskComment(
  input: PublishRiskCommentInput
): Promise<PublishRiskCommentResult> {
  const { installationId, owner, repo, prNumber, assessment, explanation } = input;

  const { getInstallationAccessToken } = await import("./index");
  const token = await getInstallationAccessToken(installationId);
  const commentBody = formatRiskComment(assessment, explanation);

  const response = await fetch(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/issues/${prNumber}/comments`,
    {
      method: "POST",
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": GITHUB_API_VERSION,
        "User-Agent": "ContextHub-AI",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ body: commentBody }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to publish PR comment: ${response.status} ${response.statusText} — ${errorText}`
    );
  }

  const data = (await response.json()) as { id: number; html_url: string };

  return {
    commentId: data.id,
    htmlUrl: data.html_url,
  };
}
