import { NextResponse } from "next/server";

import { mapAlbumResponse } from "@/lib/server/mapAlbum";
import { ExternalApiError, fetchSaavn } from "@/lib/server/saavnHttp";

type Params = {
  params: {
    id: string;
  };
};

export async function GET(_: Request,
  context: { params: Promise<{ id: string }> }) {
  const {id: albumId} = await context.params;

  if (!albumId) {
    return NextResponse.json({ message: "Album not found" }, { status: 404 });
  }

  try {
    const data = await fetchSaavn(`/albums?id=${encodeURIComponent(albumId)}`);

    if (
      typeof data !== "object" ||
      data === null ||
      !("data" in data) ||
      !(data as { data?: unknown }).data
    ) {
      return NextResponse.json({ message: "Album not found" }, { status: 404 });
    }

    const album = mapAlbumResponse(data);

    if (!album) {
      return NextResponse.json({ message: "Album not found" }, { status: 404 });
    }

    return NextResponse.json(album, { status: 200 });
  } catch (error) {
    if (error instanceof ExternalApiError) {
      if (error.status === 404) {
        return NextResponse.json({ message: "Album not found" }, { status: 404 });
      }

      return NextResponse.json(
        { message: "Failed to fetch album details from external provider" },
        { status: 502 }
      );
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
