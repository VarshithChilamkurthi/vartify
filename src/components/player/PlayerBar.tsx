"use client";

import type { MouseEvent } from "react";

import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { seekTo } from "@/hooks/useAudioPlayer";
import { selectCurrentTrack, usePlayerStore } from "@/store/playerStore";

function IconPrev() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6 5h2v14H6V5zm3.5 7L20 19V5L9.5 12z" />
    </svg>
  );
}

function IconNext() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16 5h2v14h-2V5zM4 19l10.5-7L4 5v14z" />
    </svg>
  );
}

function IconPlay() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7L8 5z" />
    </svg>
  );
}

function IconPause() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
    </svg>
  );
}

export function PlayerBar() {
  const currentTrack = usePlayerStore(selectCurrentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const prev = usePlayerStore((s) => s.prev);
  const next = usePlayerStore((s) => s.next);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const toggleExpanded = usePlayerStore((s) => s.toggleExpanded);

  const { currentTime, duration } = useAudioPlayer();

  if (!currentTrack) {
    return null;
  }

  const progressRatio = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;

  const formatTime = (seconds: number) => {
    const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
    const mins = Math.floor(safe / 60);
    const secs = Math.floor(safe % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const onProgressClick = (e: MouseEvent<HTMLDivElement>) => {
    if (duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.min(1, Math.max(0, x / rect.width));
    seekTo(ratio * duration);
  };

  return (
    <div
  onClick={toggleExpanded}
  className="fixed inset-x-0 bottom-0 z-50 cursor-pointer border-t border-white/10 bg-neutral-950/80 backdrop-blur"
>
      <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-3 sm:px-6">
        {/* Left */}
        <div className="flex min-w-0 items-center gap-3">
  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-neutral-800">
    {currentTrack.image ? (
      <img
        src={currentTrack.image}
        alt={currentTrack.name}
        className="h-full w-full object-cover"
      />
    ) : (
      <div className="h-full w-full bg-gradient-to-br from-neutral-700 to-neutral-900" />
    )}
  </div>

  <div className="min-w-0">
    <div className="truncate text-sm font-semibold text-white/95">
      {currentTrack.name}
    </div>
    <div className="truncate text-xs text-white/60">
      {currentTrack.artist || "Unknown Artist"}
    </div>
  </div>
</div>

        {/* Center */}
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            className="rounded-full p-2 text-white/70 transition-all duration-300 ease-in-out hover:bg-white/10 hover:text-white"
            aria-label="Previous"
          >
            <IconPrev />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            className="rounded-full bg-white p-2 text-black transition-all duration-300 ease-in-out hover:scale-105"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <IconPause /> : <IconPlay />}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            className="rounded-full p-2 text-white/70 transition-all duration-300 ease-in-out hover:bg-white/10 hover:text-white"
            aria-label="Next"
          >
            <IconNext />
          </button>
        </div>

        {/* Right - Progress */}
<div className="flex items-center justify-end">
  <div className="flex w-full max-w-xs items-center gap-2 text-xs text-white/60">
    <span className="w-10 text-right">
      {formatTime(currentTime)}
    </span>

    <div
      className="relative h-1 flex-1 cursor-pointer rounded-full bg-white/10"
      onClick={(e) => {
        e.stopPropagation();
        onProgressClick(e);
      }}
    >
      <div
        className="absolute left-0 top-0 h-1 rounded-full bg-green-500"
        style={{
          width: duration
            ? `${(currentTime / duration) * 100}%`
            : "0%",
        }}
      />
    </div>

    <span className="w-10">
      {formatTime(duration)}
    </span>
  </div>
</div>
      </div>
    </div>
  );
}

