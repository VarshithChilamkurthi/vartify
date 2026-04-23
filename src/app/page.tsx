import type { Album, Track } from "@/lib/types/music";

import { getAlbums } from "@/services/musicService";
import { HomeHero } from "@/components/browse/HomeHero";
import { getSongs } from "@/services/musicService";
import { getNewReleases, getRecommendations } from "@/services/musicService";
import { getGreeting } from "@/utils/greeting";
import { HorizontalScroll } from "@/components/ui/HorizontalScroll";
import { ArtistCard } from "@/components/browse/ArtistCard";
import { AlbumCard } from "@/components/browse/AlbumCard";
import { JumpBackInClient } from "@/components/home/JumpBackInClient";

type ArtistItem = {
  id: string;
  name: string;
  image?: string;
};
function getFavoriteArtistsFromSongs(
  songs: Track[],
  limit: number = 50
): ArtistItem[] {
  const seen = new Set<string>();
  const artists: ArtistItem[] = [];
  for (const song of songs) {
    const artistId = (song as Track & { artistId?: string }).artistId;
    if (!song.artist) continue;
    const primary = song.artist.split(",")[0].trim();
    if (!primary || seen.has(primary)) continue;
    seen.add(primary);
    artists.push({
      id: artistId || "",
      name: primary,
      image: "",
    });
    if (artists.length >= limit) break;
  }
  return artists;
}

export default async function Page() {
  let albums: Album[] = [];
  let newReleaseAlbums: Album[] = [];
  let recommendationAlbums: Album[] = [];
  let errorMessage: string | null = null;

  try {
    const [albumRes, newReleasesRes, recommendationsRes] = await Promise.all([
      getAlbums("telugu", "telugu"),
      getNewReleases("telugu"),
      getRecommendations("telugu"),
    ]);
    albums = albumRes.albums;
    newReleaseAlbums = newReleasesRes.albums;
    recommendationAlbums = recommendationsRes.albums;
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : "Failed to load albums";
  }

  let songs: Track[] = [];
  try {
    const res = await getSongs("telugu");
    songs = res.songs;
  } catch (err) {
    console.error(err);
  }

  const featuredHero = albums[0];
  const favoriteArtists = getFavoriteArtistsFromSongs(songs);

  const artistsWithImages = await Promise.all(
    favoriteArtists.map(async (artist) => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/search/artists?query=${encodeURIComponent(artist.name)}`
        );
  
        if (!res.ok) return artist;
  
        const data = await res.json();
  
        const first = Array.isArray(data)
          ? data[0]
          : data?.data?.results?.[0];

        return {
          ...artist,
          image: first?.image || "",
        };
      } catch {
        return artist;
      }
    })
  );

  return (
    <main className="min-h-screen bg-neutral-950 pb-28">
      <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8 lg:pt-6">
        <header className="mb-10 space-y-2">
          <div className="pt-2">
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {getGreeting()}
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

            {favoriteArtists.length > 0 && (
              <section className="space-y-4">
                <HorizontalScroll title="Your Favorite Artists">
                  {artistsWithImages.map((artist) => (
                    <ArtistCard
                      key={artist.id || artist.name}
                      artist={{
                        id: artist.id,
                        name: artist.name,
                        image: artist.image || "",
                      }}
                    />
                  ))}
                </HorizontalScroll>
              </section>
            )}

            <JumpBackInClient />

            {newReleaseAlbums.length > 0 ? (
              <HorizontalScroll title="New Releases">
                {newReleaseAlbums.map((album) => (
                  <div key={album.id} className="w-[180px] shrink-0">
                    <AlbumCard album={album} />
                  </div>
                ))}
              </HorizontalScroll>
            ) : null}

            {recommendationAlbums.length > 0 ? (
              <HorizontalScroll title="Recommendations">
                {recommendationAlbums.map((album) => (
                  <div key={album.id} className="w-[180px] shrink-0">
                    <AlbumCard album={album} />
                  </div>
                ))}
              </HorizontalScroll>
            ) : null}
          </div>
        )}
      </div>
    </main>
  );
}
