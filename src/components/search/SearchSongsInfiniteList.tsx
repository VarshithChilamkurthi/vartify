"use client";

import { useCallback } from "react";

import { SongRow } from "@/components/search/SongRow";
import { InfiniteScrollList } from "@/components/ui/InfiniteScrollList";
import type { Track } from "@/lib/types/music";
import { getSongs } from "@/services/musicService";

type SearchSongsInfiniteListProps = {
  query: string;
  initialSongs: Track[];
  initialHasMore?: boolean;
};

export function SearchSongsInfiniteList({
  query,
  initialSongs,
  initialHasMore,
}: SearchSongsInfiniteListProps) {
  const fetchMoreFn = useCallback(
    (page: number) => getSongs(query, page),
    [query]
  );

  return (
    <InfiniteScrollList
      initialSongs={initialSongs}
      initialHasMore={initialHasMore}
      fetchMoreFn={fetchMoreFn}
      itemRenderer={(track) => <SongRow track={track} />}
    />
  );
}
