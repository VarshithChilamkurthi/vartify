"use client";

import { HorizontalScroll } from "@/components/ui/HorizontalScroll";
import { usePlayerStore } from "@/store/playerStore";

export function JumpBackInClient() {
  const recentTracks = usePlayerStore((s) => s.recentTracks);
  const playTrack = usePlayerStore((s) => s.playTrack);

  if (recentTracks.length === 0) {
    return null;
  }

  return (
    <HorizontalScroll title="Jump Back In">
      {recentTracks.map((track) => (
        <button
          key={track.id}
          type="button"
          onClick={() => {
            playTrack(track);
            usePlayerStore.setState({ isRadioMode: true });
          }}
          className="w-[150px] shrink-0 cursor-pointer rounded-md text-left transition hover:opacity-90"
        >
          <div className="aspect-square w-full overflow-hidden rounded-md bg-[#181818]">
            {track.image ? (
              <img
                src={track.image}
                alt={track.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-white/40">
                No art
              </div>
            )}
          </div>
          <p className="mt-2 truncate text-sm text-white">{track.name}</p>
          {track.artist ? (
            <p className="truncate text-xs text-white/55">{track.artist}</p>
          ) : null}
        </button>
      ))}
    </HorizontalScroll>
  );
}
