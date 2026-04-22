"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { Track } from "@/lib/types/music";
import { ArtistHero } from "@/components/artist/ArtistHero";
import { ArtistSongsInfiniteList } from "@/components/search/ArtistSongsInfiniteList";
import { getArtistSongs } from "@/services/musicService";
import { usePlayerStore } from "@/store/playerStore";

type ArtistPageClientProps = {
  artistId: string;
  artist: { id: string; name: string; image: string };
  initialSongs: Track[];
  initialHasMore: boolean;
};

export function ArtistPageClient({
  artistId,
  artist,
  initialSongs,
  initialHasMore,
}: ArtistPageClientProps) {
  const playQueue = usePlayerStore((s) => s.playQueue);
  const setPlaying = usePlayerStore((s) => s.setPlaying);

  const [songs, setSongs] = useState<Track[]>(initialSongs);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const songIds = useMemo(() => new Set(songs.map((s) => s.id)), [songs]);

  useEffect(() => {
    setSongs(initialSongs);
    setCurrentPage(1);
    setHasMore(initialHasMore);
  }, [artistId, initialHasMore, initialSongs]);

  const fetchMore = useCallback(async () => {
    if (isLoading || !hasMore) {
      return;
    }

    setIsLoading(true);
    try {
      const nextPage = currentPage + 1;
      const res = await getArtistSongs(artistId, nextPage);
      const incoming = res.songs.filter((song) => !songIds.has(song.id));
      setSongs((prev) => [...prev, ...incoming]);
      setCurrentPage(nextPage);
      setHasMore(res.hasMore);
    } catch {
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [artistId, currentPage, hasMore, isLoading, songIds]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) {
          return;
        }
        void fetchMore();
      },
      { rootMargin: "150px 0px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchMore]);

  const handlePlayAtIndex = useCallback(
    (index: number) => {
      if (!songs.length) {
        return;
      }
      playQueue(songs, index, { type: "artist", id: artist.id, page: currentPage });
      setPlaying(true);
    },
    [artist.id, currentPage, playQueue, setPlaying, songs]
  );

  return (
    <div className="space-y-8">
      <ArtistHero artist={artist} songs={songs} />

      {songs.length > 0 ? (
        <div className="mt-6 space-y-4">
          <ArtistSongsInfiniteList songs={songs} onPlayAtIndex={handlePlayAtIndex} />
          <div ref={sentinelRef} className="h-8 w-full" />
          {isLoading ? (
            <p className="text-xs text-white/50">Loading more songs...</p>
          ) : null}
          {!hasMore && songs.length > 0 ? (
            <p className="text-xs text-white/40">You have reached the end.</p>
          ) : null}
        </div>
      ) : (
        <p className="text-white/60">No songs found for this artist.</p>
      )}
    </div>
  );
}
