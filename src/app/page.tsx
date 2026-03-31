import type { Album } from "@/lib/types/music";

import { getAlbums } from "@/services/musicService";
import { AlbumGrid } from "@/components/browse/AlbumGrid";

export default async function Page() {
  let albums: Album[] = [];
  let errorMessage: string | null = null;

  try {
    albums = await getAlbums();
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : "Failed to load albums";
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Browse Albums
        </h1>
        <p className="mt-1 text-sm text-white/60">
          Pick an album to start listening.
        </p>
      </div>

      {errorMessage ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          {errorMessage}
        </div>
      ) : (
        <AlbumGrid albums={albums} />
      )}
    </main>
  );
}