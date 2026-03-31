import "server-only";

import type { Album, Track } from "@/lib/types/music";

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

  if (!links.length) {
    return "";
  }

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

function extractArtists(song: Record<string, unknown>): string {
  const artists = song.artists as Record<string, unknown> | undefined;
  const primary = artists?.primary;

  if (!Array.isArray(primary) || !primary.length) {
    return "";
  }

  const names = primary
    .map((artist) => {
      if (typeof artist !== "object" || artist === null) {
        return "";
      }
      const maybeName = (artist as { name?: unknown }).name;
      return typeof maybeName === "string" ? maybeName : "";
    })
    .filter(Boolean);

    return names.map(name => name.trim()).join(", ");
}

function extractAlbumArtist(data: Record<string, unknown>, songsRaw: unknown[]): string {
  const artists = data.artists;
  if (typeof artists === "object" && artists !== null) {
    const primary = (artists as { primary?: unknown }).primary;
    if (Array.isArray(primary) && primary.length) {
      const names = primary
        .map((artist) => {
          if (typeof artist !== "object" || artist === null) {
            return "";
          }
          const maybeName = (artist as { name?: unknown }).name;
          return typeof maybeName === "string" ? maybeName : "";
        })
        .filter(Boolean);

      if (names.length) {
        return names.map(name => name.trim()).join(", ");
      }
    }
  }

  for (const song of songsRaw) {
    if (typeof song !== "object" || song === null) {
      continue;
    }
    const names = extractArtists(song as Record<string, unknown>);
    if (names) {
      return names;
    }
  }

  return "";
}

function mapTrack(song: unknown): Track | null {
  if (typeof song !== "object" || song === null) {
    return null;
  }

  const raw = song as Record<string, unknown>;
  const id = typeof raw.id === "string" ? raw.id : "";
  const name = typeof raw.name === "string" ? raw.name : "";
  const duration = toNumber(raw.duration);
  const audioUrl = extractBestUrl(raw.downloadUrl);

  if (!id || !name || !audioUrl) {
    return null;
  }

  return { id, name, duration, audioUrl };
}

export function mapAlbumResponse(payload: unknown): Album | null {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }

  const root = payload as Record<string, unknown>;
  const data =
    typeof root.data === "object" && root.data !== null
      ? (root.data as Record<string, unknown>)
      : null;

  if (!data) {
    return null;
  }

  const id = typeof data.id === "string" ? data.id : "";
  const name = typeof data.name === "string" ? data.name : "";
  const image = extractBestUrl(data.image);

  const songsRaw = Array.isArray(data.songs) ? data.songs : [];
  const songs = songsRaw.map(mapTrack).filter((track): track is Track => track !== null);

  const artist = extractAlbumArtist(data, songsRaw);

  if (!id || !name) {
    return null;
  }

  return {
    id,
    name,
    artist,
    image,
    songs,
  };
}
