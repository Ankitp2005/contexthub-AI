// Shared pagination helper for the GitHub REST API.
// Follows Link-header-based pagination (rel="next") and concatenates results.

export interface PaginationOptions {
  /** Per-page size passed to GitHub (default 100, max 100) */
  perPage?: number;
  /** Maximum pages to follow (safety limit, default 10 = 1000 items) */
  maxPages?: number;
}

/**
 * Fetches a paginated GitHub API endpoint that returns a flat JSON array.
 *
 * Example: GET /repos/:owner/:repo/pulls returns PR[] directly.
 */
export async function fetchPaginatedArray<T>(
  url: string,
  headers: HeadersInit,
  options: PaginationOptions = {}
): Promise<T[]> {
  return fetchPaginated<T>(url, headers, options, (res) => res.json() as Promise<T[]>);
}

/**
 * Fetches a paginated GitHub API endpoint where the items live under a
 * named key inside the response object.
 *
 * Example: GET /installation/repositories returns { total_count, repositories }.
 */
export async function fetchPaginatedField<T>(
  url: string,
  headers: HeadersInit,
  field: string,
  options: PaginationOptions = {}
): Promise<T[]> {
  return fetchPaginated<T>(url, headers, options, async (res) => {
    const body = (await res.json()) as Record<string, unknown>;
    return (body[field] as T[]) ?? [];
  });
}

// ---------------------------------------------------------------------------
// Internal shared pagination loop
// ---------------------------------------------------------------------------

async function fetchPaginated<T>(
  url: string,
  headers: HeadersInit,
  options: PaginationOptions,
  extract: (response: Response) => Promise<T[]>,
): Promise<T[]> {
  const { perPage = 100, maxPages = 10 } = options;
  const separator = url.includes("?") ? "&" : "?";
  let nextUrl: string | null = `${url}${separator}per_page=${perPage}`;

  const allResults: T[] = [];
  let pageCount = 0;

  while (nextUrl && pageCount < maxPages) {
    const response = await fetch(nextUrl, { headers });

    if (!response.ok) {
      throw new Error(
        `GitHub API error: ${response.status} ${response.statusText}`
      );
    }

    const items = await extract(response);
    allResults.push(...items);

    nextUrl = parseNextLink(response.headers.get("Link"));
    pageCount++;
  }

  return allResults;
}

/**
 * Parses the `Link` response header and returns the URL for `rel="next"`,
 * or `null` if there is no next page.
 *
 * GitHub Link header format:
 *   <https://api.github.com/...?page=2>; rel="next", <...>; rel="last"
 */
function parseNextLink(linkHeader: string | null): string | null {
  if (!linkHeader) return null;

  for (const part of linkHeader.split(",")) {
    const match = part.match(/<([^>]+)>;\s*rel="next"/);
    if (match) return match[1];
  }

  return null;
}
