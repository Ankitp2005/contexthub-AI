import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/domains/github/services/webhooks";
import { handleInstallationEvent, handleInstallationRepositoriesEvent } from "@/domains/github/services/sync";
import { handlePullRequestEvent } from "@/domains/github/services/pr-ingestion";

export async function POST(request: NextRequest) {
  const secret = process.env.GITHUB_APP_WEBHOOK_SECRET;
  
  if (!secret) {
    console.error("[Webhook] GITHUB_APP_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const signature = request.headers.get("x-hub-signature-256");
  const event = request.headers.get("x-github-event");
  const deliveryId = request.headers.get("x-github-delivery");
  
  if (!signature || !event) {
    return NextResponse.json({ error: "Missing required headers" }, { status: 400 });
  }

  // Get raw body as string for HMAC validation
  const rawBody = await request.text();

  if (!verifyWebhookSignature(rawBody, signature, secret)) {
    console.error(`[Webhook] Invalid signature for delivery ${deliveryId}`);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Parse JSON for routing
  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  // Event routing (no processing per prompt instructions)
  console.log(`[Webhook] Received valid event: ${event} (Delivery: ${deliveryId})`);
  
  switch (event) {
    case "installation":
      await handleInstallationEvent(payload);
      break;
    case "installation_repositories":
      await handleInstallationRepositoriesEvent(payload);
      break;
    case "pull_request":
      await handlePullRequestEvent(payload);
      break;
    case "push":
      // Will be processed in a future phase
      console.log(`[Webhook] Event type 'push' acknowledged but not processed.`);
      break;
    default:
      console.log(`[Webhook] Unhandled event type: ${event}`);
  }

  // Return 200 OK so GitHub knows we received it securely
  return NextResponse.json({ success: true, event }, { status: 200 });
}
