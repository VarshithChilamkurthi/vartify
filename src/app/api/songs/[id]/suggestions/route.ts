import { NextResponse } from "next/server";

import { fetchSaavn } from "@/lib/server/saavnHttp";
import { decodeHtmlEntities } from "@/lib/server/utils";
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

function extractArtist(item: Record<string, unknown>): string {
  if (typeof item.primaryArtists === "string" && item.primaryArtists.trim()) {
    return decodeHtmlEntities(item.primaryArtists);
  }

  const artists = item.artists as { primary?: Array<{ name?: string }> } | undefined;
  if (Array.isArray(artists?.primary) && artists.primary.length) {
    return artists.primary
      .map((artist) => artist?.name)
      .filter((name): name is string => Boolean(name))
      .join(", ");
  }

  return "Unknown Artist";
}

function mapSong(item: unknown): Track | null {
  if (!item || typeof item !== "object") {
    return null;
  }

  const raw = item as Record<string, unknown>;
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
    artist: extractArtist(raw),
    image: extractBestImageUrl(raw.image),
  };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ songs: [] }, { status: 200 });
  }

  try {
    const payload = await fetchSaavn(`/songs/${encodeURIComponent(id)}/suggestions?limit=10`);

    try {
      const root = payload as Record<string, unknown>;
      const rootData = root?.data;

      let rawSongs: unknown[] = [];
      if (rootData && typeof rootData === "object") {
        const dataObj = rootData as Record<string, unknown>;
        if (Array.isArray(dataObj.results)) {
          rawSongs = dataObj.results;
        }
      } else if (Array.isArray(rootData)) {
        rawSongs = rootData;
      }

      const songs = rawSongs
        .map(mapSong)
        .filter((song): song is Track => song !== null);

      return NextResponse.json({ songs }, { status: 200 });
    } catch (error) {
      console.error("Failed to map song suggestions", error);
      return NextResponse.json({ songs: [] }, { status: 200 });
    }
  } catch (error) {
    console.error("Failed to fetch song suggestions", error);
    return NextResponse.json({ songs: [] }, { status: 200 });
  }
}
