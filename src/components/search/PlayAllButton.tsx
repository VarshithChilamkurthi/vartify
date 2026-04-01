"use client";

import { usePlayerStore } from "@/store/playerStore";
import type { Track } from "@/lib/types/music";

export function PlayAllButton({ songs }: { songs: Track[] }) {
  const playQueue = usePlayerStore((s) => s.playQueue);

  if (!songs.length) return null;

  return (
    <button
      onClick={() => playQueue(songs, 0)}
      className="mb-4 px-4 py-2 bg-green-500 text-black rounded"
    >
      Play All
    </button>
  );
}