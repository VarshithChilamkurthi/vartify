"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import type { Track } from "@/lib/types/music";

type InfiniteScrollListProps = {
  initialSongs: Track[];
  initialHasMore?: boolean;
  fetchMoreFn: (page: number) => Promise<{ songs: Track[]; hasMore: boolean }>;
  itemRenderer: (track: Track, index: number) => ReactNode;
};

export function InfiniteScrollList({
  initialSongs,
  initialHasMore,
  fetchMoreFn,
  itemRenderer,
}: InfiniteScrollListProps) {
  const [songs, setSongs] = useState<Track[]>(initialSongs);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore ?? initialSongs.length > 0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const songIds = useMemo(() => new Set(songs.map((song) => song.id)), [songs]);

  useEffect(() => {
    setSongs(initialSongs);
    setCurrentPage(1);
    setHasMore(initialHasMore ?? initialSongs.length > 0);
  }, [initialHasMore, initialSongs]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      async (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting || isLoading || !hasMore) {
          return;
        }

        setIsLoading(true);
        try {
          const nextPage = currentPage + 1;
          const response = await fetchMoreFn(nextPage);
          const incoming = response.songs.filter((song) => !songIds.has(song.id));
          setSongs((prev) => [...prev, ...incoming]);
          setCurrentPage(nextPage);
          setHasMore(response.hasMore);
        } catch {
          setHasMore(false);
        } finally {
          setIsLoading(false);
        }
      },
      { rootMargin: "150px 0px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [currentPage, fetchMoreFn, hasMore, isLoading, songIds]);

  return (
    <div className="space-y-2">
      {songs.map((track, index) => (
        <div key={`${track.id}-${index}`}>{itemRenderer(track, index)}</div>
      ))}
      <div ref={sentinelRef} className="h-8 w-full" />
      {isLoading ? <p className="text-xs text-white/50">Loading more songs...</p> : null}
      {!hasMore && songs.length > 0 ? (
        <p className="text-xs text-white/40">You have reached the end.</p>
      ) : null}
    </div>
  );
}
