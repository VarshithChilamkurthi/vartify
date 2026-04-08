import { AlbumGrid } from "@/components/browse/AlbumGrid";
import type { Album, Track } from "@/lib/types/music";
import { SongsList } from "@/components/search/SongsList";
import { SearchResultsClient } from "@/components/search/SearchResultsClient";
import { PlayAllButton } from "@/components/search/PlayAllButton";
import { getAlbums, getSongs } from "@/services/musicService";

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

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-10">
      
      <h1 className="text-xl font-semibold text-white">
        Results for "{query}"
      </h1>

      {/* Songs */}
      {songs.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-white">Songs</h2>
          <PlayAllButton songs={songs} />
          <SongsList songs={songs} />
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