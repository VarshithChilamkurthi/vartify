"use client";

import { SongRow } from "@/components/search/SongRow";
import type { Track } from "@/lib/types/music";

type ArtistSongsInfiniteListProps = {
  songs: Track[];
  onPlayAtIndex: (index: number) => void;
};

export function ArtistSongsInfiniteList({
  songs,
  onPlayAtIndex,
}: ArtistSongsInfiniteListProps) {
  return (
    <div className="space-y-2">
      {songs.map((track, index) => (
        <SongRow
          key={`${track.id}-${index}`}
          track={track}
          onPlay={() => onPlayAtIndex(index)}
        />
      ))}
    </div>
  );
}
