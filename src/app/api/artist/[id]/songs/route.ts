import { NextResponse } from "next/server";

import { decodeHtmlEntities } from "@/lib/server/utils";
import { ExternalApiError, fetchSaavn } from "@/lib/server/saavnHttp";
import type { Track } from "@/lib/types/music";

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

function extractBestImageUrl(image: unknown): string {
  if (!Array.isArray(image)) {
    return "";
  }

  const links = image.filter((item): item is LinkObject => {
    return typeof item === "object" && item !== null;
  });
  if (!links.length) {
    return "";
  }

  const sorted = [...links].sort((a, b) => {
    return toNumber(b.quality) - toNumber(a.quality);
  });

  for (const entry of sorted) {
    const candidate = entry.link ?? entry.url;
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
  }

  return "";
}

function extractArtistName(song: Record<string, unknown>): string {
  if (typeof song.primaryArtists === "string" && song.primaryArtists.trim()) {
    return decodeHtmlEntities(song.primaryArtists);
  }

  const artists = song.artists as { primary?: Array<{ name?: string }> } | undefined;
  if (Array.isArray(artists?.primary) && artists.primary.length) {
    return artists.primary
      .map((artist) => artist?.name)
      .filter((name): name is string => Boolean(name))
      .join(", ");
  }

  return "Unknown Artist";
}

function mapArtistSong(song: unknown): Track | null {
  if (!song || typeof song !== "object") {
    return null;
  }

  const raw = song as Record<string, unknown>;
  if (typeof raw.id !== "string" || !raw.id.trim()) {
    return null;
  }

  const downloadUrl = Array.isArray(raw.downloadUrl) ? raw.downloadUrl : [];
  const lastDownload = downloadUrl[downloadUrl.length - 1] as { url?: string } | undefined;

  return {
    id: raw.id,
    name: decodeHtmlEntities(String(raw.name || "")),
    duration: typeof raw.duration === "number" ? raw.duration : Number(raw.duration) || 0,
    audioUrl: lastDownload?.url || "",
    artist: extractArtistName(raw),
    image: extractBestImageUrl(raw.image),
  };
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const pageParam = Number(searchParams.get("page") || "1");
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  if (!id) {
    return NextResponse.json({ message: "Artist not found" }, { status: 404 });
  }

  try {
    const payload = await fetchSaavn(`/artists/${encodeURIComponent(id)}/songs?page=${page}`);

    const data =
      typeof payload === "object" && payload !== null && "data" in payload
        ? (payload as { data?: unknown }).data
        : null;

    let rawSongs: unknown[] = [];
    if (Array.isArray(data)) {
      rawSongs = data;
    } else if (typeof data === "object" && data !== null) {
      const dataObject = data as { results?: unknown; songs?: unknown };

      if (Array.isArray(dataObject.results)) {
        rawSongs = dataObject.results;
      } else if (Array.isArray(dataObject.songs)) {
        rawSongs = dataObject.songs;
      } else if (
        typeof dataObject.songs === "object" &&
        dataObject.songs !== null &&
        Array.isArray((dataObject.songs as { results?: unknown }).results)
      ) {
        rawSongs = (dataObject.songs as { results: unknown[] }).results;
      }
    }
    const songs = rawSongs
      .map(mapArtistSong)
      .filter((song: Track | null): song is Track => song !== null);

    return NextResponse.json({ songs, hasMore: songs.length > 0 }, { status: 200 });
  } catch (error) {
    if (error instanceof ExternalApiError) {
      return NextResponse.json(
        { message: "Failed to fetch artist songs from external provider" },
        { status: 502 }
      );
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
