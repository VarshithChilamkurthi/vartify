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

function extractArtistName(song: any): string {
  if (typeof song?.primaryArtists === "string" && song.primaryArtists.trim()) {
    return decodeHtmlEntities(song.primaryArtists);
  }

  if (Array.isArray(song?.artists?.primary) && song.artists.primary.length) {
    return song.artists.primary
      .map((a: any) => a?.name)
      .filter(Boolean)
      .join(", ");
  }

  return "Unknown Artist";
}

function mapArtistSong(song: any): Track | null {
  if (!song || typeof song !== "object" || !song.id) {
    return null;
  }

  return {
    id: String(song.id),
    name: decodeHtmlEntities(song.name || ""),
    duration: typeof song.duration === "number" ? song.duration : Number(song.duration) || 0,
    audioUrl: song.downloadUrl?.[song.downloadUrl.length - 1]?.url || "",
    artist: extractArtistName(song),
    image: extractBestImageUrl(song.image),
  };
}

export async function GET(
  _: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ message: "Artist not found" }, { status: 404 });
  }

  try {
    const payload = await fetchSaavn(`/artists?id=${encodeURIComponent(id)}`);
    const data =
      typeof payload === "object" && payload !== null && "data" in payload
        ? (payload as { data?: any }).data
        : null;

    if (!data || typeof data !== "object") {
      return NextResponse.json({ message: "Artist not found" }, { status: 404 });
    }

    const artist = {
      id: String(data.id || id),
      name: decodeHtmlEntities(String(data.name || "")),
      image: extractBestImageUrl(data.image),
    };

    const songs = (Array.isArray(data.topSongs) ? data.topSongs : [])
      .map(mapArtistSong)
      .filter((song: Track | null): song is Track => song !== null);

    return NextResponse.json({ artist, songs }, { status: 200 });
  } catch (error) {
    if (error instanceof ExternalApiError) {
      if (error.status === 404) {
        return NextResponse.json({ message: "Artist not found" }, { status: 404 });
      }
      return NextResponse.json(
        { message: "Failed to fetch artist details from external provider" },
        { status: 502 }
      );
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
