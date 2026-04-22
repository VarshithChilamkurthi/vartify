"use client";

import { useCallback, useState } from "react";
import {
  Maximize2,
  ListMusic,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
} from "lucide-react";

import { getAudioElement, seekTo, useAudioPlayer } from "@/hooks/useAudioPlayer";
import { selectCurrentTrack, usePlayerStore } from "@/store/playerStore";

export function PlayerBar() {
  const currentTrack = usePlayerStore(selectCurrentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isShuffle = usePlayerStore((s) => s.isShuffle);
  const loopMode = usePlayerStore((s) => s.loopMode);
  const queue = usePlayerStore((s) => s.queue);
  const currentIndex = usePlayerStore((s) => s.currentIndex);
  const playbackContext = usePlayerStore((s) => s.playbackContext);
  const prev = usePlayerStore((s) => s.prev);
  const playNext = usePlayerStore((s) => s.next);
  const playQueue = usePlayerStore((s) => s.playQueue);
  const appendSongs = usePlayerStore((s) => s.appendSongs);
  const setPlaying = usePlayerStore((s) => s.setPlaying);
  const setPlaybackContext = usePlayerStore((s) => s.setPlaybackContext);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const cycleLoopMode = usePlayerStore((s) => s.cycleLoopMode);
  const toggleQueue = usePlayerStore((s) => s.toggleQueue);
  const toggleExpanded = usePlayerStore((s) => s.toggleExpanded);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const { currentTime, duration } = useAudioPlayer();
  const repeatMode: "OFF" | "ALL" | "ONE" =
    loopMode === "one" ? "ONE" : loopMode === "all" ? "ALL" : "OFF";

    const handleTrackEnd = useCallback(async () => {
      const audio = getAudioElement();
      const { loopMode, next } = usePlayerStore.getState(); // Get fresh state
    
      if (loopMode === "one" && audio) {
        audio.currentTime = 0;
        void audio.play().catch(() => {});
        return;
      }
    
      // Just call the smart 'next' we built in the store
      await next();
      
      // If we are still playing (meaning next found a song or fetched one)
      if (usePlayerStore.getState().isPlaying && audio) {
        void audio.play().catch(() => {});
      }
    }, []);

  if (!currentTrack) {
    return null;
  }

  const formatTime = (seconds: number) => {
    const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
    const mins = Math.floor(safe / 60);
    const secs = Math.floor(safe % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };
  const progressPercent = duration > 0 ? (Math.min(currentTime, duration) / duration) * 100 : 0;

  return (
    <div className="relative z-50 flex-shrink-0 w-full border-t border-white/10 bg-black/90 backdrop-blur">
      <audio id="vartify-audio" onEnded={() => void handleTrackEnd()} className="hidden" />
      <div className="mx-auto grid max-w-[1400px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-[#181818]">
            {currentTrack.image ? (
              <img
                src={currentTrack.image}
                alt={currentTrack.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-neutral-800" />
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-white">
              {currentTrack.name}
            </div>
            <div className="truncate text-xs text-white/60">
              {currentTrack.artist || "Unknown Artist"}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleShuffle();
            }}
            className={`rounded-full p-2 ${
              isShuffle ? "text-[#1DB954]" : "text-white/70 hover:text-white"
            }`}
            aria-label="Shuffle"
          >
            <Shuffle size={18} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white"
            aria-label="Previous"
          >
            <SkipBack size={20} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            className="rounded-full bg-white p-2 text-black transition hover:scale-105"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              playNext();
            }}
            className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white"
            aria-label="Next"
          >
            <SkipForward size={20} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              cycleLoopMode();
            }}
            className={`rounded-full p-2 ${
              loopMode !== "off" ? "text-[#1DB954]" : "text-white/70 hover:text-white"
            }`}
            aria-label="Repeat"
          >
            {loopMode === "one" ? <Repeat1 size={18} /> : <Repeat size={18} />}
          </button>
        </div>

        <div className="flex items-center justify-end gap-3">
          <span className="w-10 text-right text-xs text-white/60">{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={Math.min(currentTime, duration || 0)}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              e.stopPropagation();
              seekTo(Number(e.target.value));
            }}
            className="spotify-range h-1 w-full max-w-xs cursor-pointer"
            style={{ backgroundSize: `${progressPercent}% 100%, 100% 100%` }}
            aria-label="Seek"
          />
          <span className="w-10 text-xs text-white/60">{formatTime(duration)}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleQueue();
            }}
            className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white"
            aria-label="Queue"
          >
            <ListMusic size={18} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleExpanded();
            }}
            className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white"
            aria-label="Expand player"
          >
            <Maximize2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

