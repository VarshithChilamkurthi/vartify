"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { Play } from "lucide-react";
import { useRouter } from "next/navigation";

import type { Album } from "@/lib/types/music";
import { usePlayerStore } from "@/store/playerStore";
import { getAverageColor } from "@/utils/colorUtils";

type HomeHeroProps = {
  album: Album;
};

export function HomeHero({ album }: HomeHeroProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const storeRecent = usePlayerStore((s) => s.recentTracks[0]);
  const recentTrack = mounted ? storeRecent : undefined;

  const playQueue = usePlayerStore((state) => state.playQueue);
  const playTrack = usePlayerStore((state) => state.playTrack);
  const [dominantColor, setDominantColor] = useState("rgba(34, 197, 94, 0.3)");

  const displayTitle = recentTrack?.name ?? album.name;
  const displaySubtitle = recentTrack?.artist ?? album.artist;
  const displayImage = recentTrack?.image || album.image;
  const isRecentHero = Boolean(recentTrack);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadColor = async () => {
      if (!displayImage) {
        return;
      }
      const color = await getAverageColor(displayImage);
      if (isMounted) {
        setDominantColor(color);
      }
    };

    void loadColor();

    return () => {
      isMounted = false;
    };
  }, [displayImage]);

  const handlePlayClick = async (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();

    if (recentTrack) {
      playTrack(recentTrack);
      const st = usePlayerStore.getState();
      if (!st.isRadioMode) {
        st.toggleRadioMode();
      }
      return;
    }

    try {
      const response = await fetch(`/api/albums/${encodeURIComponent(album.id)}`, {
        method: "GET",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as { songs?: Album["songs"] };
      const songs = Array.isArray(data.songs) ? data.songs : [];
      if (!songs.length) {
        return;
      }

      const tracksWithMeta = songs.map((track) => ({
        ...track,
        image: track.image || album.image,
        artist: track.artist || album.artist,
      }));

      playQueue(tracksWithMeta, 0);
    } catch {
      // Swallow to avoid disrupting navigation interactions.
    }
  };

  const goToAlbum = () => {
    if (isRecentHero) {
      return;
    }
    router.push(`/album/${album.id}`);
  };

  return (
    <div
      role="button"
      tabIndex={isRecentHero ? -1 : 0}
      onClick={goToAlbum}
      onKeyDown={(event) => {
        if (isRecentHero) {
          return;
        }
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(`/album/${album.id}`);
        }
      }}
      className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-950/80 via-neutral-950 to-neutral-950 p-6 shadow-2xl sm:p-8 md:p-10 ${
        isRecentHero ? "" : "cursor-pointer"
      }`}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% -20%, ${dominantColor}, transparent)`,
        }}
        aria-hidden
      />
      <div className="relative flex flex-col gap-8 md:flex-row md:items-end md:gap-10">
        <div className="mx-auto w-full max-w-[280px] shrink-0 overflow-hidden rounded-lg shadow-2xl ring-1 ring-white/10 md:mx-0 md:max-w-[320px]">
          {displayImage ? (
            <img
              src={displayImage}
              alt={displayTitle}
              crossOrigin="anonymous"
              className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="aspect-square w-full bg-gradient-to-br from-neutral-700 to-neutral-900" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-4 rounded-xl border border-white/10 bg-black/40 p-6 pb-1 text-center backdrop-blur-md md:pb-2 md:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
            {isRecentHero ? "Jump Back In" : "Featured Album"}
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
            {displayTitle}
          </h2>
          <p className="text-base text-white/55 md:text-lg">{displaySubtitle}</p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 md:justify-start">
            <button
              type="button"
              onClick={handlePlayClick}
              className="inline-flex min-h-[44px] min-w-[120px] items-center justify-center rounded-full bg-green-500 px-8 text-sm font-bold text-black transition-all duration-300 hover:scale-[1.02] hover:bg-green-400 active:scale-[0.98]"
            >
              <Play size={16} fill="currentColor" className="mr-2" />
              {isRecentHero ? "Resume" : "Play Album"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
