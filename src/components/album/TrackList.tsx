"use client";

import type { Track } from "@/lib/types/music";
import { usePlayerStore } from "@/store/playerStore";

type TrackListProps = {
  tracks: Track[];
  artist: string;
  image: string;
};

function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function TrackList({ tracks, artist, image }: TrackListProps) {
  const playTrack = usePlayerStore((state) => state.playTrack);

  if (!tracks.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-neutral-900/50 p-4 text-sm text-white/60">
        No tracks available for this album.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-neutral-900/40">
      <div className="grid grid-cols-[56px_1fr_80px] px-4 py-3 text-xs uppercase tracking-wide text-white/50">
        <span>#</span>
        <span>Title</span>
        <span className="text-right">Time</span>
      </div>

      <div className="divide-y divide-white/5">
        {tracks.map((track, index) => (
          <button
            key={track.id}
            type="button"
            onClick={() => {
              const store = usePlayerStore.getState();
            
              const tracksWithMeta = tracks.map((t) => ({
                ...t,
                artist,
                image,
              }));
            
              const clickedIndex = tracks.findIndex((t) => t.id === track.id);
            
              store.playAlbum(tracksWithMeta);
              store.setCurrentIndex(clickedIndex);
            }}
            className="grid w-full grid-cols-[56px_1fr_80px] items-center px-4 py-3 text-left transition-all duration-300 ease-in-out hover:bg-white/10"
          >
            <span className="text-sm text-white/60">{index + 1}</span>
            <span className="truncate pr-2 text-sm text-white/90">{track.name}</span>
            <span className="text-right text-sm text-white/60">
              {formatDuration(track.duration)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

