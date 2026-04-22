"use client";

import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { Play } from "lucide-react";
import { usePlayerStore } from "@/store/playerStore";

type ArtistCardProps = {
  artist: { id: string; name: string; image: string };
};

export function ArtistCard({ artist }: ArtistCardProps) {
  const router = useRouter();
  const playQueue = usePlayerStore((state) => state.playQueue);
  const setPlaying = usePlayerStore((state) => state.setPlaying);

  const handlePlayClick = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      const response = await fetch(
        `/api/artist/${encodeURIComponent(artist.id)}/songs?page=1`,
        {
          method: "GET",
          cache: "no-store",
          headers: { Accept: "application/json" },
        }
      );

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as {
        songs?: Array<{
          id: string;
          name: string;
          duration: number;
          audioUrl: string;
          artist?: string;
          image?: string;
        }>;
      };
      const tracks = Array.isArray(data.songs) ? data.songs : [];
      if (!tracks.length) {
        return;
      }

      playQueue(tracks, 0, { type: "artist", id: artist.id, page: 1 });
      setPlaying(true);
    } catch {
      // Swallow to avoid disrupting navigation interactions.
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/artist/${artist.id}`)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(`/artist/${artist.id}`);
        }
      }}
      className="group/artist block w-[180px] shrink-0 rounded-xl border border-white/5 bg-[#181818] p-3 shadow-sm transition-all duration-300 ease-out hover:border-white/15 hover:bg-[#202020] hover:shadow-lg hover:shadow-black/40"
    >
      <div className="relative aspect-square overflow-hidden rounded-lg">
        <img
          src={artist.image}
          alt={artist.name}
          className="h-full w-full object-cover transition-all duration-300 ease-out group-hover/artist:scale-[1.03] group-hover/artist:brightness-110"
          loading="lazy"
        />

        <div className="absolute inset-0 z-10 bg-black/35 opacity-0 transition-all duration-300 ease-in-out group-hover/artist:opacity-100" />
        <div className="absolute bottom-3 right-3 z-20 translate-y-2 opacity-0 transition-all duration-300 ease-in-out group-hover/artist:translate-y-0 group-hover/artist:opacity-100">
          <button
            type="button"
            onClick={handlePlayClick}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1DB954] text-black shadow-2xl transition hover:scale-105"
            aria-label={`Play ${artist.name}`}
          >
            <Play size={20} fill="currentColor" />
          </button>
        </div>
      </div>

      <div className="mt-3 space-y-1">
        <div className="line-clamp-1 text-sm font-semibold tracking-tight text-white">
          {artist.name}
        </div>
        <div className="line-clamp-1 text-xs text-white/50">Artist</div>
      </div>
    </div>
  );
}
