import { NextResponse } from "next/server";

import { ExternalApiError, fetchSaavn } from "@/lib/server/saavnHttp";

// ✅ You already have this pattern → reuse it
function getSearchItems(payload: unknown): unknown[] {
  if (typeof payload !== "object" || payload === null) {
    return [];
  }

  const root = payload as Record<string, unknown>;
  const data =
    typeof root.data === "object" && root.data !== null
      ? (root.data as Record<string, unknown>)
      : null;

  if (!data) {
    return [];
  }

  if (Array.isArray(data.results)) {
    return data.results;
  }

  if (typeof data.songs === "object" && data.songs !== null) {
    const songs = data.songs as Record<string, unknown>;
    if (Array.isArray(songs.results)) {
      return songs.results;
    }
  }

  return [];
}

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

/** Same strategy as album mapping: prefer highest `quality` image URL. */
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

function extractArtist(item: any): string {
  if (!item) return "Unknown Artist";

  // Case 1: string (most common)
  if (typeof item.primaryArtists === "string" && item.primaryArtists.trim()) {
    return decodeHtmlEntities(item.primaryArtists);
  }

  // Case 2: nested structure
  if (item.artists?.primary?.length) {
    return item.artists.primary
      .map((a: any) => a.name)
      .filter(Boolean)
      .join(", ");
  }

  return "Unknown Artist";
}

function mapSongSearchItem(item: any) {
  if (!item) return null;

  return {
    id: item.id,
    name: decodeHtmlEntities(item.name || ""),
    duration: item.duration ?? 0,
    audioUrl:
      item.downloadUrl?.[item.downloadUrl.length - 1]?.url || "",
    artist: extractArtist(item),
    image: extractBestImageUrl(item.image),
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "Attack on Titan";

    // ✅ DIFFERENCE: songs endpoint instead of albums
    const payload = await fetchSaavn(
      `/search/songs?query=${encodeURIComponent(query)}&limit=10`
    );

    const items = getSearchItems(payload);

    const songs = items
      .map(mapSongSearchItem)
      .filter((song): song is NonNullable<typeof song> => song !== null);

    return NextResponse.json(songs, { status: 200 });
  } catch (error) {
    if (error instanceof ExternalApiError) {
      return NextResponse.json(
        { message: "Failed to fetch songs from external provider" },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}