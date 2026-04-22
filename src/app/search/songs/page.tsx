import { SearchSongsInfiniteList } from "@/components/search/SearchSongsInfiniteList";
import type { Track } from "@/lib/types/music";
import { getSongs } from "@/services/musicService";

type Props = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function SearchSongsPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q || "";

  let songs: Track[] = [];
  let hasMore = false;

  try {
    if (query) {
      const songRes = await getSongs(query, 1);
      songs = songRes.songs;
      hasMore = songRes.hasMore;
    }
  } catch (err) {
    console.error("Search songs page error:", err);
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
      <h1 className="text-xl font-semibold text-white">
        Songs for "{query}"
      </h1>

      {songs.length > 0 ? (
        <section>
          <SearchSongsInfiniteList
            query={query}
            initialSongs={songs}
            initialHasMore={hasMore}
          />
        </section>
      ) : (
        <p className="text-white/60">No songs found.</p>
      )}
    </main>
  );
}
