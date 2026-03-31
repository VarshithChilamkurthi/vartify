"use client";

import type { Track } from "@/lib/types/music";
import { usePlayerStore } from "@/store/playerStore";

type PlayAlbumButtonProps = {
  tracks: Track[];
  artist: string;
  image: string;
};

export function PlayAlbumButton({ tracks, artist, image }: PlayAlbumButtonProps) {
  const playAlbum = usePlayerStore((state) => state.playAlbum);

  return (
    <button
      type="button"
      onClick={() => playAlbum(tracks.map(track => ({ ...track, artist, image })))}
      className="inline-flex items-center justify-center rounded-full bg-green-500 px-6 py-3 text-sm font-semibold text-black transition-all duration-300 ease-in-out hover:scale-105 hover:bg-green-400"
    >
      Play Album
    </button>
  );
}

