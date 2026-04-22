import type { Track } from "@/lib/types/music";
import { ArtistPageClient } from "@/components/artist/ArtistPageClient";
import { getArtistById, getArtistSongs } from "@/services/musicService";

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let artist: { id: string; name: string; image: string } | null = null;
  let artistSongs: Track[] = [];
  let hasMoreSongs = false;

  try {
    const [artistRes, songsRes] = await Promise.all([
      getArtistById(id),
      getArtistSongs(id, 1),
    ]);
    artist = artistRes.artist;
    artistSongs = songsRes.songs;
    hasMoreSongs = songsRes.hasMore;
  } catch (err) {
    console.error("Artist page error:", err);
  }

  const artistName = artist?.name || "Unknown Artist";
  const artistImage = artist?.image || "";
  const artistData = artist ?? { id, name: artistName, image: artistImage };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
      <ArtistPageClient
        artistId={id}
        artist={artistData}
        initialSongs={artistSongs}
        initialHasMore={hasMoreSongs}
      />
    </main>
  );
}
