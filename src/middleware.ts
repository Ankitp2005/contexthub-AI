import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isRateLimited } from "@/lib/rate-limit";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/github/webhook(.*)", // GitHub webhook — must bypass auth
  "/api/mcp(.*)",            // MCP API surface — uses Bearer API key auth, bypasses session auth
  "/api/inngest(.*)",        // Inngest background jobs — uses its own signing-key verification
]);

const isRateLimitedRoute = createRouteMatcher([
  "/api/github/webhook(.*)",
  "/api/mcp(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  // Generate a correlation ID for this request
  const correlationId = crypto.randomUUID();

  // 1. Rate limiting check for public webhook and MCP endpoints
  if (isRateLimitedRoute(request)) {
    // Prefer x-real-ip (set by trusted reverse proxies like nginx)
    // over x-forwarded-for (which can be spoofed by clients).
    let ip =
      request.headers.get("x-real-ip") ??
      (request as any).ip ??
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

    ip = ip || "127.0.0.1";
    // Limit to 60 requests per minute
    if (isRateLimited(ip, { limit: 60, windowMs: 60 * 1000 })) {
      return new NextResponse(
        JSON.stringify({ error: "Too Many Requests", correlationId }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-Request-ID": correlationId,
          },
        }
      );
    }
  }

  // 2. Authentication check
  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  // 3. Attach correlation ID to every response
  const response = NextResponse.next();
  response.headers.set("X-Request-ID", correlationId);
  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
