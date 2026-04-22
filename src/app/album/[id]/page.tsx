import { notFound } from "next/navigation";

import { PlayAlbumButton } from "@/components/album/PlayAlbumButton";
import { TrackList } from "@/components/album/TrackList";
import { NotFoundError, getAlbumById } from "@/services/musicService";

type AlbumPageProps = {
  params: {
    id: string;
  };
};

export default async function AlbumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: albumId } = await params;

  try {
    const album = await getAlbumById(albumId);

    return (
      <main className="mx-auto max-w-7xl px-4 pb-8 sm:px-6">
        <section className="relative mb-10 overflow-hidden rounded-2xl p-6 sm:p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-800/30 via-[#1f1f1f] to-[#121212]" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-end">
          <div className="w-full max-w-[320px] shrink-0 overflow-hidden rounded-xl shadow-2xl">
            <img
              src={album.image}
              alt={album.name}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="flex-1 space-y-4">
            <p className="text-xs uppercase tracking-widest text-white/50">
              Album
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
              {album.name}
            </h1>
            <p className="text-base text-white/70">{album.artist}</p>
            <PlayAlbumButton tracks={album.songs} artist={album.artist} image={album.image} />
          </div>
          </div>
        </section>

        <section>
          <TrackList tracks={album.songs} artist={album.artist} image={album.image} />
        </section>
      </main>
    );
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      (error as { status: number }).status === 404
    ) {
      notFound();
    }

    throw error;
  }
}
