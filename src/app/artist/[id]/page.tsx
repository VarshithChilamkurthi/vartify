import type { Track } from "@/lib/types/music";
import { SongsList } from "@/components/search/SongsList";
import { PlayAllButton } from "@/components/search/PlayAllButton";
import { getArtistById } from "@/services/musicService";

function resolveInternalBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  const vercelHost = process.env.VERCEL_URL?.trim();
  if (vercelHost) {
    return `https://${vercelHost.replace(/\/+$/, "")}`;
  }

  const port = process.env.PORT?.trim() || "3000";
  return `http://localhost:${port}`;
}

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let artist: { id: string; name: string; image: string } | null = null;
  let artistSongs: Track[] = [];
  let moreSongs: Track[] = [];

  try {
    const res = await getArtistById(id);
    artist = res.artist;
    artistSongs = res.songs;

    if (artist?.name) {
      const baseUrl = resolveInternalBaseUrl();
      const moreRes = await fetch(
        `${baseUrl}/api/songs?query=${encodeURIComponent(artist.name)}&limit=50`,
        {
          method: "GET",
          cache: "no-store",
          headers: { Accept: "application/json" },
        }
      );
      if (moreRes.ok) {
        const moreData = (await moreRes.json()) as { songs?: Track[] };
        moreSongs = moreData.songs || [];
      }
    }
  } catch (err) {
    console.error("Artist page error:", err);
  }

  const allSongs = [
    ...artistSongs,
    ...moreSongs.filter((s) => !artistSongs.some((a) => a.id === s.id)),
  ];

  const artistName = artist?.name || "Unknown Artist";
  const artistImage = artist?.image || "";

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
      <section className="relative w-full overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/40 via-neutral-950 to-neutral-950" />

        <div className="relative flex items-end gap-6 p-6 sm:p-8">
          <div className="h-32 w-32 sm:h-40 sm:w-40 rounded-full overflow-hidden shadow-xl ring-1 ring-white/10">
            {artistImage ? (
              <img
                src={artistImage}
                alt={artistName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-neutral-800 flex items-center justify-center text-white/60 text-xl font-bold">
                {artistName.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 pb-2">
            <p className="text-xs uppercase tracking-widest text-white/60">
              Artist
            </p>

            <h1 className="text-3xl sm:text-5xl font-bold text-white">
              {artistName}
            </h1>

            <p className="text-sm text-white/60">
              {allSongs.length} song
              {allSongs.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      </section>

      {allSongs.length > 0 ? (
        <div className="space-y-4 mt-6">
          <PlayAllButton songs={allSongs} />
          <SongsList songs={allSongs} queueSongs={allSongs} />
        </div>
      ) : (
        <p className="text-white/60">No songs found for this artist.</p>
      )}
    </main>
  );
}
