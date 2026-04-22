import type { Album } from "@/lib/types/music";
import type { Track } from "@/lib/types/music";

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Album not found") {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  const isServer = typeof window === "undefined";
  const baseUrl = resolveInternalBaseUrl(isServer);

  const response = await fetch(`${baseUrl}${url}`, {
    method: "GET",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new NotFoundError();
    }

    throw new ApiError(
      `Request failed with status ${response.status}`,
      response.status
    );
  }

  return (await response.json()) as T;
}

function resolveInternalBaseUrl(isServer: boolean): string {
  if (!isServer) {
    return "";
  }

  // Preferred explicit base URL (works both locally and on Vercel).
  const configured = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  // Vercel provides deployment host without protocol.
  const vercelHost = process.env.VERCEL_URL?.trim();
  if (vercelHost) {
    return `https://${vercelHost.replace(/\/+$/, "")}`;
  }

  // Local fallback when env vars are not set.
  const port = process.env.PORT?.trim() || "3000";
  return `http://localhost:${port}`;
}

export async function getAlbums(query?: string): Promise<{
  albums: Album[];
  hasMore: boolean;
}> {
  const suffix = query?.trim()
    ? `?query=${encodeURIComponent(query)}`
    : "";
  return fetchJson<{ albums: Album[]; hasMore: boolean }>(`/api/albums${suffix}`);
}

export async function getAlbumById(id: string): Promise<Album> {
  return fetchJson<Album>(`/api/albums/${encodeURIComponent(id)}`);
}

export async function getSongs(
  query: string,
  page: number = 1
): Promise<{ songs: Track[]; hasMore: boolean }> {
  return fetchJson<{ songs: Track[]; hasMore: boolean }>(
    `/api/songs?query=${encodeURIComponent(query)}&page=${page}`
  );
}

export async function getArtistById(id: string): Promise<{
  artist: { id: string; name: string; image: string };
  songs: Track[];
}> {
  return fetchJson<{
    artist: { id: string; name: string; image: string };
    songs: Track[];
  }>(`/api/artist/${encodeURIComponent(id)}`);
}

export async function getArtistSongs(
  id: string,
  page: number = 1
): Promise<{ songs: Track[]; hasMore: boolean }> {
  return fetchJson<{ songs: Track[]; hasMore: boolean }>(
    `/api/artist/${encodeURIComponent(id)}/songs?page=${page}`
  );
}

export async function getJumpBackInAlbums(): Promise<{ albums: Album[] }> {
  return fetchJson<{ albums: Album[] }>("/api/home/jump-back-in");
}

export async function getNewReleases(): Promise<{ albums: Album[] }> {
  return fetchJson<{ albums: Album[] }>("/api/home/new-releases");
}

export async function getRecommendations(): Promise<{ albums: Album[] }> {
  return fetchJson<{ albums: Album[] }>("/api/home/recommendations");
}