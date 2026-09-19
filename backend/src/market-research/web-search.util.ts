export interface WebSearchResult {
  title: string;
  snippet: string;
  url: string;
}

interface SerperOrganicResult {
  title?: string;
  snippet?: string;
  link?: string;
}

export async function webSearch(
  query: string,
  apiKey: string,
  limit = 8,
): Promise<WebSearchResult[]> {
  if (!apiKey) return [];
  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: query, num: limit }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return [];
    const data = (await response.json()) as {
      organic?: SerperOrganicResult[];
    };
    return (data.organic ?? [])
      .filter((r) => r.title && r.link)
      .slice(0, limit)
      .map((r) => ({
        title: r.title as string,
        snippet: r.snippet ?? '',
        url: r.link as string,
      }));
  } catch {
    return [];
  }
}
