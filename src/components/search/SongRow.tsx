"use client";

import type { MouseEvent } from "react";
import { Play } from "lucide-react";

import type { Track } from "@/lib/types/music";
import { selectCurrentTrack, usePlayerStore } from "@/store/playerStore";
import { formatDuration } from "@/utils/formatTime";

type SongRowProps = {
  track: Track;
  onPlay?: () => void;
};

export function SongRow({ track, onPlay }: SongRowProps) {
  const currentTrack = usePlayerStore(selectCurrentTrack);
  const isActive = currentTrack?.id === track.id;

  const handleTrackPlay = () => {
    if (onPlay) {
      onPlay();
      return;
    }

    // 1. Play ONLY the clicked track (this wipes the queue clean to 1 song)
    usePlayerStore.getState().playTrack(track);

    // 2. Ensure Radio Mode is active so AI suggestions start immediately after this song
    if (!usePlayerStore.getState().isRadioMode) {
      usePlayerStore.getState().toggleRadioMode();
    }
  };

  const handlePlayClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    handleTrackPlay();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleTrackPlay}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleTrackPlay();
        }
      }}
      className="group/row flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-white/5"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative h-12 w-12 overflow-hidden rounded-md bg-neutral-800">
          {track.image ? (
            <img
              src={track.image}
              alt={track.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : null}
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover/row:opacity-100">
            <Play size={16} fill="currentColor" className="text-white" />
          </div>
        </div>

        <div className="min-w-0">
          <p
            className={`truncate text-base ${
              isActive ? "text-[#1DB954]" : "text-white group-hover:text-white"
            }`}
          >
            {track.name}
          </p>
          <p className="line-clamp-1 text-sm text-white/60">{track.artist || "Unknown Artist"}</p>
        </div>
      </div>

      <div className="ml-3 flex items-center gap-2">
        <span className="text-xs text-white/50">{formatDuration(track.duration)}</span>
        <button
          type="button"
          onClick={handlePlayClick}
          className="rounded-full p-1 text-white/80 opacity-0 transition-opacity hover:text-white group-hover/row:opacity-100"
          aria-label={`Play ${track.name}`}
        >
          <Play size={14} fill="currentColor" />
        </button>
      </div>
    </div>
  );
}
