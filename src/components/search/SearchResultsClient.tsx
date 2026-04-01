"use client";

import { useEffect, useRef, useState } from "react";
import { AlbumGrid } from "@/components/browse/AlbumGrid";
import type { Album } from "@/lib/types/music";

type Props = {
  initialAlbums: Album[];
  query: string;
  initialHasMore: boolean;
};

export function SearchResultsClient({ initialAlbums, query, initialHasMore }: Props) {
  const [albums, setAlbums] = useState<Album[]>(initialAlbums);
  const [page, setPage] = useState(2); // page 1 already loaded
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);

  const observerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!observerRef.current) return;
  
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first.isIntersecting) return;
  
        // Move async logic OUTSIDE observer callback
        loadMore();
      },
      {
        rootMargin: "200px",
      }
    );
  
    observer.observe(observerRef.current);
  
    return () => observer.disconnect();
  }, [query]);

  useEffect(() => {
    setAlbums(initialAlbums);
    setPage(2);
    setHasMore(initialHasMore);
  }, [query, initialAlbums, initialHasMore]);

  const loadMore = async () => {
    if (loading || !hasMore) return;
  
    try {
      setLoading(true);
  
      const res = await fetch(
        `/api/albums?query=${encodeURIComponent(query)}&page=${page}`
      );
  
      if (!res.ok) {
        throw new Error("Failed to fetch more albums");
      }
  
      const data = await res.json();
  
      setAlbums((prev) => {
        const existingIds = new Set(prev.map((a) => a.id));
      
        const newAlbums = data.albums.filter(
          (album: any) => !existingIds.has(album.id)
        );

        // if no new unique items, stop pagination
        if (newAlbums.length === 0) {
          setHasMore(false);
          return prev;
        }

        return [...prev, ...newAlbums];
      });
      setPage((prev) => prev + 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <AlbumGrid albums={albums} />

      {/* Sentinel for infinite scroll */}
      <div ref={observerRef} />

      {loading && (
        <p className="text-center text-sm text-white/60">
          Loading more albums...
        </p>
      )}

      {!hasMore && (
        <p className="text-center text-sm text-white/40">
          No more results
        </p>
      )}
    </div>
  );
}