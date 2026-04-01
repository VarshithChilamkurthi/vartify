import { NextResponse } from "next/server";

import { mapAlbumSearchItem } from "@/lib/server/mapAlbumSearchItem";
import { ExternalApiError, fetchSaavn } from "@/lib/server/saavnHttp";

function getSearchItems(payload: unknown): unknown[] {
  if (typeof payload !== "object" || payload === null) {
    return [];
  }

  const root = payload as Record<string, unknown>;
  const data = typeof root.data === "object" && root.data !== null ? (root.data as Record<string, unknown>) : null;

  if (!data) {
    return [];
  }

  if (Array.isArray(data.results)) {
    return data.results;
  }

  if (typeof data.albums === "object" && data.albums !== null) {
    const albums = data.albums as Record<string, unknown>;
    if (Array.isArray(albums.results)) {
      return albums.results;
    }
  }

  return [];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "Attack on Titan";
    const page = Number(searchParams.get("page")) || "1";
    const limit = 10;
    
    const payload = await fetchSaavn(`/search/albums?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
    const items = getSearchItems(payload);
    const albums = items.map(mapAlbumSearchItem).filter((album): album is NonNullable<typeof album> => album !== null);

    return NextResponse.json(
      {
        albums,
        hasMore: albums.length > 0,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof ExternalApiError) {
      return NextResponse.json(
        { message: "Failed to fetch album list from external provider" },
        { status: 502 }
      );
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
