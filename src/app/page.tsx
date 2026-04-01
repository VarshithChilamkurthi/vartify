import type { Album } from "@/lib/types/music";

import { getAlbums } from "@/services/musicService";
import { AlbumGrid } from "@/components/browse/AlbumGrid";
import { HomeHero } from "@/components/browse/HomeHero";
import { SearchBar } from "@/components/search/SearchBar";

export default async function Page() {
  let albums: Album[] = [];
  let errorMessage: string | null = null;

  try {
    const albumRes = await getAlbums();
    albums = albumRes.albums;
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : "Failed to load albums";
  }

  const featuredHero = albums[0];
  const featuredRow = albums.slice(1, 5);
  const popularAlbums = albums.slice(5);

  return (
    <main className="min-h-screen bg-neutral-950 pb-28">
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8 lg:pt-10">
        <header className="mb-10 space-y-2">
          <SearchBar />
          <div className="pt-2">
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Good evening
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/50">
              Browse albums and pick something to play. Your music picks up where
              you left off.
            </p>
          </div>
        </header>

        {errorMessage ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
            {errorMessage}
          </div>
        ) : albums.length === 0 ? (
          <p className="text-sm text-white/50">No albums to show yet.</p>
        ) : (
          <div className="space-y-16 lg:space-y-20">
            {featuredHero ? (
              <section aria-labelledby="featured-hero-heading" className="space-y-3">
                <h2
                  id="featured-hero-heading"
                  className="sr-only"
                >
                  Featured album
                </h2>
                <HomeHero album={featuredHero} />
              </section>
            ) : null}

            {featuredRow.length > 0 ? (
              <section className="space-y-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                      Featured
                    </h2>
                    <p className="mt-1 text-sm text-white/45">
                      Hand-picked highlights for you
                    </p>
                  </div>
                </div>
                <AlbumGrid albums={featuredRow} />
              </section>
            ) : null}

            {popularAlbums.length > 0 ? (
              <section className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                    Popular Albums
                  </h2>
                  <p className="mt-1 text-sm text-white/45">
                    Trending and loved by listeners
                  </p>
                </div>
                <AlbumGrid albums={popularAlbums} />
              </section>
            ) : null}
          </div>
        )}
      </div>
    </main>
  );
}
