"use client";

import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { Play } from "lucide-react";
import type { Album } from "@/lib/types/music";
import { usePlayerStore } from "@/store/playerStore";

export function AlbumCard({ album }: { album: Album }) {
  const router = useRouter();
  const playQueue = usePlayerStore((state) => state.playQueue);
  const setPlaying = usePlayerStore((state) => state.setPlaying);

  const handlePlayClick = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      const response = await fetch(`/api/albums/${encodeURIComponent(album.id)}`, {
        method: "GET",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as { songs?: Album["songs"] };
      const tracks = Array.isArray(data.songs) ? data.songs : [];
      if (!tracks.length) {
        return;
      }

      const tracksWithMeta = tracks.map((track) => ({
        ...track,
        image: track.image || album.image,
        artist: track.artist || album.artist,
      }));

      playQueue(tracksWithMeta, 0);
      setPlaying(true);
    } catch {
      // Swallow to avoid disrupting navigation interactions.
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/album/${album.id}`)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(`/album/${album.id}`);
        }
      }}
      className="group/card block rounded-xl border border-white/5 bg-[#181818] p-3 shadow-sm transition-all duration-300 ease-out hover:border-white/15 hover:bg-[#202020] hover:shadow-lg hover:shadow-black/40"
    >
      <div className="relative aspect-square rounded-lg overflow-hidden">
        
        {/* Image */}
        <img
          src={album.image}
          alt={album.name}
          className="h-full w-full object-cover transition-all duration-300 ease-out group-hover/card:scale-[1.03] group-hover/card:brightness-110"
          loading="lazy"
        />

        <div className="absolute inset-0 z-10 bg-black/35 opacity-0 transition-all duration-300 ease-in-out group-hover/card:opacity-100" />
        <div className="absolute bottom-3 right-3 z-20 opacity-0 translate-y-2 transition-all duration-300 ease-in-out group-hover/card:translate-y-0 group-hover/card:opacity-100">
          <button
            type="button"
            onClick={handlePlayClick}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1DB954] text-black shadow-2xl transition hover:scale-105"
            aria-label={`Play ${album.name}`}
          >
            <Play size={20} fill="currentColor" />
          </button>
        </div>
      </div>

      <div className="mt-3 space-y-1">
        <div className="line-clamp-1 text-sm font-semibold tracking-tight text-white">
          {album.name}
        </div>
        <div className="line-clamp-1 text-xs text-white/50">
          {album.artist}
        </div>
      </div>
    </div>
  );
}