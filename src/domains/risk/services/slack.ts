import type { RiskFactor } from "../types";

export interface SendSlackAlertInput {
  score: number;
  level: string;
  repoFullName: string;
  prNumber: number;
  prUrl?: string;
  factors: RiskFactor[];
}

/**
 * Sends a Slack alert if the risk score meets or exceeds the threshold.
 * Default threshold is 7.
 *
 * @param input - The alert payload including score, level, repo, and factors.
 * @returns Promise<boolean> - True if the alert was successfully sent, false if skipped or failed.
 */
export async function sendSlackAlert(
  input: SendSlackAlertInput
): Promise<boolean> {
  const { score, level, repoFullName, prNumber, prUrl, factors } = input;

  // 1. Check threshold
  const thresholdStr = process.env.SLACK_RISK_THRESHOLD;
  const threshold = thresholdStr ? parseInt(thresholdStr, 10) : 7;

  if (score < threshold) {
    return false;
  }

  // 2. Check webhook URL
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn(
      `[Slack Alert] Risk score ${score} >= threshold ${threshold}, but SLACK_WEBHOOK_URL is not configured.`
    );
    return false;
  }

  // 3. Format message
  const prLink = prUrl ? ` (<${prUrl}|#${prNumber}>)` : ` #${prNumber}`;
  
  let factorsText = "";
  if (factors && factors.length > 0) {
    factorsText = factors
      .map((f) => `• *${f.name}* (+${f.weight}): ${f.reason}`)
      .join("\n");
  } else {
    factorsText = "• *No specific risk factors triggered.*";
  }

  const messageText = 
    `⚠️ *High Risk Pull Request Detected*\n` +
    `*Repository:* ${repoFullName}\n` +
    `*PR:*${prLink}\n` +
    `*Risk Score:* ${score}/10 — *${level}*\n\n` +
    `*Triggered Factors:*\n${factorsText}`;

  // 4. Post to Slack webhook
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: messageText }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      `[Slack Alert] Failed to send webhook: ${response.status} ${response.statusText} — ${errorText}`
    );
    return false;
  }

  return true;
}
