"use client";

import { X } from "lucide-react";

import { selectCurrentTrack, usePlayerStore } from "@/store/playerStore";

export function NowPlayingQueuePanel() {
  const queue = usePlayerStore((s) => s.queue);
  const currentIndex = usePlayerStore((s) => s.currentIndex);
  const isOpen = usePlayerStore((s) => s.isQueueOpen);
  const currentTrack = usePlayerStore(selectCurrentTrack);
  const playQueue = usePlayerStore((s) => s.playQueue);
  const toggleQueue = usePlayerStore((s) => s.toggleQueue);

  const nextTracks = queue.slice(currentIndex + 1);

  return (
    <aside
      className={`flex h-full flex-shrink-0 flex-col overflow-hidden bg-neutral-950 transition-all duration-300 ease-in-out ${
        isOpen
          ? "w-[350px] opacity-100 border-l border-white/10"
          : "w-0 opacity-0 border-none overflow-hidden"
      }`}
    >
      <div className="flex h-full w-[350px] flex-col p-5 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white/70">
            Now Playing
          </h2>
          <button
            type="button"
            onClick={toggleQueue}
            className="rounded-full p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
            aria-label="Close queue"
          >
            <X size={18} />
          </button>
        </div>

        {currentTrack ? (
          <div className="mb-6">
            <div className="aspect-square w-full overflow-hidden rounded-xl bg-[#181818]">
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
            <p className="mt-3 truncate text-base font-semibold text-white">
              {currentTrack.name}
            </p>
            <p className="truncate text-sm text-white/65">
              {currentTrack.artist || "Unknown Artist"}
            </p>
          </div>
        ) : null}

        <div>
          <h3 className="mb-2 text-sm font-semibold text-white/85">Next Up</h3>
          <div className="space-y-1">
            {nextTracks.length ? (
              nextTracks.map((track, idx) => {
                const queueIndex = currentIndex + 1 + idx;
                return (
                  <button
                    key={`${track.id}-${queueIndex}`}
                    type="button"
                    onClick={() => playQueue(queue, queueIndex)}
                    className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-white/10"
                  >
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-[#181818]">
                      {track.image ? (
                        <img
                          src={track.image}
                          alt={track.name}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm text-white">{track.name}</p>
                      <p className="truncate text-xs text-white/60">
                        {track.artist || "Unknown Artist"}
                      </p>
                    </div>
                  </button>
                );
              })
            ) : (
              <p className="text-sm text-white/60">Queue is empty.</p>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
