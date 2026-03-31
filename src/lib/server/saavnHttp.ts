import "server-only";

const REQUEST_TIMEOUT_MS = 10000;

export class ExternalApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ExternalApiError";
    this.status = status;
  }
}

function getBaseUrl(): string {
  const baseUrl = process.env.JIOSAAVN_API_BASE_URL;
  if (!baseUrl) {
    throw new ExternalApiError("JioSaavn API base URL not configured", 500);
  }

  return baseUrl.replace(/\/+$/, "");
}

export async function fetchSaavn(path: string): Promise<unknown> {
  const baseUrl = getBaseUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${baseUrl}/api${cleanPath}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new ExternalApiError("External music provider request failed", response.status);
    }

    return (await response.json()) as unknown;
  } catch (error) {
    if (error instanceof ExternalApiError) {
      throw error;
    }

    throw new ExternalApiError("Unable to reach external music provider", 502);
  } finally {
    clearTimeout(timeoutId);
  }
}
