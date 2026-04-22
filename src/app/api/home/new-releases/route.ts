import { NextResponse } from "next/server";

import { mapAlbumSearchItem } from "@/lib/server/mapAlbumSearchItem";
import { ExternalApiError, fetchSaavn } from "@/lib/server/saavnHttp";

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

  if (typeof data.albums === "object" && data.albums !== null) {
    const albums = data.albums as Record<string, unknown>;
    if (Array.isArray(albums.results)) {
      return albums.results;
    }
  }

  return [];
}

export async function GET() {
  try {
    const payload = await fetchSaavn(
      "/search/albums?query=new%20releases&page=1&limit=12"
    );
    const items = getSearchItems(payload);
    const albums = items
      .map(mapAlbumSearchItem)
      .filter((album): album is NonNullable<typeof album> => album !== null);

    return NextResponse.json({ albums }, { status: 200 });
  } catch (error) {
    if (error instanceof ExternalApiError) {
      return NextResponse.json(
        { message: "Failed to fetch new releases from external provider" },
        { status: 502 }
      );
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
