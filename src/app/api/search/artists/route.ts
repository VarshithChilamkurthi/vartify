import { NextResponse } from "next/server";

import { decodeHtmlEntities } from "@/lib/server/utils";
import { ExternalApiError, fetchSaavn } from "@/lib/server/saavnHttp";

type LinkObject = {
  quality?: string;
  link?: string;
  url?: string;
};

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

  if (typeof data.artists === "object" && data.artists !== null) {
    const artists = data.artists as Record<string, unknown>;
    if (Array.isArray(artists.results)) {
      return artists.results;
    }
  }

  return [];
}

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

  const exact500 = links.find((entry) => {
    return toNumber(entry.quality) === 500;
  });
  const exact500Url = exact500?.link ?? exact500?.url;
  if (typeof exact500Url === "string" && exact500Url.trim()) {
    return exact500Url;
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

function mapArtistSearchItem(item: unknown) {
  if (typeof item !== "object" || item === null) {
    return null;
  }

  const raw = item as Record<string, unknown>;
  const id = typeof raw.id === "string" ? raw.id : "";
  const name = typeof raw.name === "string" ? decodeHtmlEntities(raw.name) : "";
  const image = extractBestImageUrl(raw.image);

  if (!id || !name) {
    return null;
  }

  return { id, name, image };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "Attack on Titan";

    const payload = await fetchSaavn(
      `/search/artists?query=${encodeURIComponent(query)}&limit=5`
    );

    const items = getSearchItems(payload);
    const artists = items
      .map(mapArtistSearchItem)
      .filter((artist): artist is NonNullable<typeof artist> => artist !== null);

    return NextResponse.json(artists, { status: 200 });
  } catch (error) {
    if (error instanceof ExternalApiError) {
      return NextResponse.json(
        { message: "Failed to fetch artists from external provider" },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
