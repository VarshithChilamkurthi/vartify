import { AlbumGrid } from "@/components/browse/AlbumGrid";
import type { Album, Track } from "@/lib/types/music";
import { SearchResultsClient } from "@/components/search/SearchResultsClient";
import { SongRow } from "@/components/search/SongRow";
import { getAlbums, getSongs } from "@/services/musicService";
import Link from "next/link";

type Props = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q || "";

  let albums: Album[] = [];
  let hasMore: boolean = false;
  let songs: Track[] = [];

  try {
    if (query) {
      const [albumRes, songRes] = await Promise.all([
        getAlbums(query),
        getSongs(query),
      ]);
      albums = albumRes.albums;
      hasMore = albumRes.hasMore;
      songs = songRes.songs;
    }
  } catch (err) {
    console.error("Search page error:", err);
  }
  const displaySongs = songs.slice(0, 6);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-10">
      
      <h1 className="text-xl font-semibold text-white">
        Results for "{query}"
      </h1>

      {/* Songs */}
      {songs.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-white">Songs</h2>
            {query ? (
              <Link
                href={`/search/songs?q=${encodeURIComponent(query)}`}
                className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
              >
                See all
              </Link>
            ) : null}
          </div>
          <div className="space-y-2">
            {displaySongs.map((track, index) => (
              <SongRow key={`${track.id}-${index}`} track={track} />
            ))}
          </div>
        </section>
      )}

      {/* Albums */}
      {albums.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-white">Albums</h2>
          <SearchResultsClient initialAlbums={albums} query={query} initialHasMore={hasMore} />
        </section>
      )}

      {!songs.length && !albums.length && (
        <p className="text-white/60">No results found.</p>
      )}
    </main>
  );
}