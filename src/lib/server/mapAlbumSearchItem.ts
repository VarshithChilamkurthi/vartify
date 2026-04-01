import "server-only";

import type { Album } from "@/lib/types/music";

import { decodeHtmlEntities } from "@/lib/server/utils";
type LinkObject = {
  quality?: string;
  link?: string;
  url?: string;
};

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function extractBestUrl(value: unknown): string {
  if (!Array.isArray(value)) {
    return "";
  }

  const links = value.filter((item): item is LinkObject => {
    return typeof item === "object" && item !== null;
  });

  const sorted = [...links].sort((a, b) => {
    const qa = toNumber(a.quality);
    const qb = toNumber(b.quality);
    return qb - qa;
  });

  for (const entry of sorted) {
    const candidate = entry.link ?? entry.url;
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
  }

  return "";
}

function extractArtist(raw: Record<string, unknown>): string {
  const artists = raw.artists;
  if (typeof artists === "object" && artists !== null) {
    const primary = (artists as { primary?: unknown }).primary;
    if (Array.isArray(primary)) {
      const names = primary
        .map((artist) => {
          if (typeof artist !== "object" || artist === null) {
            return "";
          }
          const maybeName = (artist as { name?: unknown }).name;
          return typeof maybeName === "string" ? decodeHtmlEntities(maybeName) : "";
        })
        .filter(Boolean);

      if (names.length) {
        return names.join(", ");
      }
    }
  }

  const fallback = raw.primaryArtists ?? raw.artist;
  return typeof fallback === "string" ? decodeHtmlEntities(fallback) : "";
}

export function mapAlbumSearchItem(item: unknown): Album | null {
  if (typeof item !== "object" || item === null) {
    return null;
  }

  const raw = item as Record<string, unknown>;

  const id = typeof raw.id === "string" ? raw.id : "";
  const name = typeof raw.name === "string" ? decodeHtmlEntities(raw.name) : "";
  const artist = extractArtist(raw);
  const image = extractBestUrl(raw.image);

  if (!id || !name) {
    return null;
  }

  return {
    id,
    name,
    artist,
    image,
    songs: [],
  };
}
