"use client";

import { useRouter } from "next/navigation";
import type { Album } from "@/lib/types/music";
import { usePlayerStore } from "@/store/playerStore";

export function AlbumCard({ album }: { album: Album }) {
  const router = useRouter();
  const playAlbum = usePlayerStore((state) => state.playAlbum);

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
      className="group block rounded-xl border border-white/5 bg-neutral-900/30 p-3 shadow-sm transition-all duration-300 ease-out hover:border-white/15 hover:bg-neutral-800/50 hover:shadow-lg hover:shadow-black/40 hover:scale-[1.02] active:scale-[0.99]"
    >
      <div className="relative aspect-square rounded-lg overflow-hidden">
        
        {/* Image */}
        <img
          src={album.image}
          alt={album.name}
          className="h-full w-full object-cover transition-all duration-300 ease-out group-hover:scale-[1.03] group-hover:brightness-110"
          loading="lazy"
        />

        {/* Dark overlay */}
        <div className="absolute inset-0 z-10 bg-black/50 opacity-0 transition-all duration-300 ease-in-out group-hover:opacity-100" />

        {/* Play button */}
        <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 scale-95 transition-all duration-300 ease-in-out group-hover:opacity-100 group-hover:scale-100">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              playAlbum(album.songs);
            }}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-2xl transition-transform duration-300 group-hover:scale-110"
            aria-label={`Play ${album.name}`}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M8 5v14l11-7L8 5z" />
            </svg>
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