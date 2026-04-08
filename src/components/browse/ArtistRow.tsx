"use client";

import { useRouter } from "next/navigation";

type ArtistItem = {
  id: string;
  name: string;
  image?: string;
};

type Props = {
  artists: ArtistItem[];
};

export function ArtistRow({ artists }: Props) {
  const router = useRouter();

  if (!artists.length) return null;

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex gap-4 pb-2">
        {artists.map((artist) => (
          <button
            key={artist.id}
            type="button"
            aria-label={`Open artist ${artist.name}`}
            onClick={() =>
              router.push(`/artist/${encodeURIComponent(artist.id)}`)
            }
            className="flex flex-col items-center min-w-[80px] max-w-[80px] focus:outline-none transition-transform hover:scale-105"
          >
            <div className="h-20 w-20 rounded-full overflow-hidden bg-neutral-800 mb-2 flex items-center justify-center text-white/60 text-sm font-semibold">
              {artist.image ? (
                <img
                  src={artist.image}
                  alt={artist.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                artist.name.slice(0, 2).toUpperCase()
              )}
            </div>

            <span className="text-xs text-white/80 text-center line-clamp-2">
              {artist.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}