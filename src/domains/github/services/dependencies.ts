// src/domains/github/services/dependencies.ts
//
// Fetches and parses dependency manifests from a repository via the GitHub
// Contents API. Supports: package.json (npm), go.mod (Go), requirements.txt
// (pip), and Cargo.toml (Rust/cargo).
//
// Returns a flat list of { packageName, packageVersion, ecosystem } tuples —
// no external parsing libraries needed; all parsing is regex/JSON.

const GITHUB_API_BASE = "https://api.github.com";
const GITHUB_API_VERSION = "2022-11-28";

function githubHeaders(token: string): HeadersInit {
  return {
    Authorization: `token ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
    "User-Agent": "ContextHub-AI",
  };
}

export type Ecosystem = "npm" | "go" | "pip" | "cargo" | "unknown";

export interface DependencyEdge {
  packageName: string;
  packageVersion: string;
  ecosystem: Ecosystem;
}

// ---------------------------------------------------------------------------
// Internal: fetch a single file from the GitHub Contents API
// ---------------------------------------------------------------------------
async function fetchRepoFile(
  token: string,
  owner: string,
  repo: string,
  path: string
): Promise<string | null> {
  try {
    const res = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`,
      { headers: githubHeaders(token) }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { content?: string; encoding?: string };
    if (!data.content || data.encoding !== "base64") return null;
    return Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf-8");
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Parsers — one per ecosystem
// ---------------------------------------------------------------------------

function parsePackageJson(content: string): DependencyEdge[] {
  try {
    const pkg = JSON.parse(content) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
    };
    const all: Record<string, string> = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
      ...pkg.peerDependencies,
    };
    return Object.entries(all).map(([name, ver]) => ({
      packageName: name,
      packageVersion: ver ?? "*",
      ecosystem: "npm" as Ecosystem,
    }));
  } catch {
    return [];
  }
}

function parseGoMod(content: string): DependencyEdge[] {
  const edges: DependencyEdge[] = [];
  // Match "require" block lines: "\tgithub.com/foo/bar v1.2.3"
  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    // Skip indirect deps marker but still capture the package
    const match = trimmed.match(/^([\w./-]+)\s+(v[\w.\-+]+)/);
    if (match) {
      edges.push({
        packageName: match[1]!,
        packageVersion: match[2]!,
        ecosystem: "go",
      });
    }
  }
  return edges;
}

function parseRequirementsTxt(content: string): DependencyEdge[] {
  const edges: DependencyEdge[] = [];
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || line.startsWith("-")) continue;
    // Handles: "requests==2.28.0", "flask>=2.0", "numpy", "django~=4.0"
    const match = line.match(/^([A-Za-z0-9_.\-]+)\s*([=><!~^]+\s*[\w.*]+)?/);
    if (match) {
      edges.push({
        packageName: match[1]!.toLowerCase(),
        packageVersion: match[2]?.trim() ?? "*",
        ecosystem: "pip",
      });
    }
  }
  return edges;
}

function parseCargoToml(content: string): DependencyEdge[] {
  const edges: DependencyEdge[] = [];
  let inDeps = false;
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (line === "[dependencies]" || line === "[dev-dependencies]" || line === "[build-dependencies]") {
      inDeps = true;
      continue;
    }
    if (line.startsWith("[") && line.endsWith("]")) {
      inDeps = false;
      continue;
    }
    if (!inDeps || !line || line.startsWith("#")) continue;

    // name = "version" or name = { version = "x.y" }
    const simple = line.match(/^([\w-]+)\s*=\s*"([^"]+)"/);
    if (simple) {
      edges.push({ packageName: simple[1]!, packageVersion: simple[2]!, ecosystem: "cargo" });
      continue;
    }
    const tableVer = line.match(/^([\w-]+)\s*=\s*\{[^}]*version\s*=\s*"([^"]+)"/);
    if (tableVer) {
      edges.push({ packageName: tableVer[1]!, packageVersion: tableVer[2]!, ecosystem: "cargo" });
    }
  }
  return edges;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const MANIFESTS: Array<{
  path: string;
  parse: (content: string) => DependencyEdge[];
}> = [
  { path: "package.json",       parse: parsePackageJson },
  { path: "go.mod",             parse: parseGoMod },
  { path: "requirements.txt",   parse: parseRequirementsTxt },
  { path: "Cargo.toml",         parse: parseCargoToml },
];

/**
 * Fetches all known manifest files for a repository and returns a de-duped
 * flat list of dependency edges. Silently skips manifests that don't exist.
 */
export async function fetchRepositoryDependencies(
  token: string,
  owner: string,
  repo: string
): Promise<DependencyEdge[]> {
  const all: DependencyEdge[] = [];

  for (const manifest of MANIFESTS) {
    const content = await fetchRepoFile(token, owner, repo, manifest.path);
    if (!content) continue;
    const edges = manifest.parse(content);
    all.push(...edges);
  }

  // De-duplicate by (packageName, ecosystem) — keep first occurrence
  const seen = new Set<string>();
  return all.filter((e) => {
    const key = `${e.ecosystem}:${e.packageName}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Re-export parsers for unit testing
export { parsePackageJson, parseGoMod, parseRequirementsTxt, parseCargoToml };
