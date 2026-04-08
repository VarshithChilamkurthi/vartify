"use client";

import type { Track } from "@/lib/types/music";
import { usePlayerStore } from "@/store/playerStore";

type Props = {
  songs: Track[];
  queueSongs?: Track[];
};

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function SongsList({ songs, queueSongs }: Props) {
  const playQueue = usePlayerStore((s) => s.playQueue);
  const queue = queueSongs ?? songs;

  return (
    <div className="space-y-2">
      {songs.map((song, i) => (
        <button
          key={song.id}
          onClick={() => playQueue(queue, i)}
          className="flex w-full items-center justify-between rounded-lg px-4 py-2 text-left hover:bg-white/10"
        >
          <span className="text-white/90">{song.name}</span>
          <span className="text-sm text-white/50">
            {formatDuration(song.duration)}
          </span>
        </button>
      ))}
    </div>
  );
}