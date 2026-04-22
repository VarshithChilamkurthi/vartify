"use client";

import type { Track } from "@/lib/types/music";
import { SongRow } from "@/components/search/SongRow";

type Props = {
  songs: Track[];
};

export function SongsList({ songs }: Props) {

  return (
    <div className="flex flex-col gap-2">
      {songs.map((track) => (
        <SongRow key={track.id} track={track} />
      ))}
    </div>
  );
}