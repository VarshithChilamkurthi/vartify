import type { Album } from "@/lib/types/music";

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
  const baseUrl = "";

  const response = await fetch(`${baseUrl}${url}`, {
    method: "GET",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new NotFoundError();
    }

    throw new ApiError(`Request failed with status ${response.status}`, response.status);
  }

  return (await response.json()) as T;
}

export async function getAlbums(): Promise<{
  albums: Album[];
  hasMore: boolean;
}> {
  return fetchJson<{ albums: Album[]; hasMore: boolean }>("/api/albums");
}

export async function getAlbumById(id: string): Promise<Album> {
  return fetchJson<Album>(`/api/albums/${encodeURIComponent(id)}`);
}
