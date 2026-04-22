"use client";

import { useEffect, useState } from "react";
import { Play, Shuffle } from "lucide-react";

import type { Track } from "@/lib/types/music";
import { usePlayerStore } from "@/store/playerStore";
import { getAverageColor } from "@/utils/colorUtils";

type ArtistHeroProps = {
  artist: { id: string; name: string; image: string };
  songs: Track[];
};

export function ArtistHero({ artist, songs }: ArtistHeroProps) {
  const [dominantColor, setDominantColor] = useState("rgba(30, 30, 30, 0.5)");
  const playQueue = usePlayerStore((state) => state.playQueue);
  const setPlaying = usePlayerStore((state) => state.setPlaying);

  useEffect(() => {
    let isActive = true;

    const updateColor = async () => {
      const color = await getAverageColor(artist.image);
      if (isActive) {
        setDominantColor(color);
      }
    };

    void updateColor();

    return () => {
      isActive = false;
    };
  }, [artist.image]);

  const handlePlay = () => {
    if (!songs.length) {
      return;
    }
    playQueue(songs, 0, { type: "artist", id: artist.id, page: 1 });
    setPlaying(true);
  };

  const handleShuffle = () => {
    if (!songs.length) {
      return;
    }
    const shuffled = [...songs].sort(() => Math.random() - 0.5);
    playQueue(shuffled, 0, { type: "artist", id: artist.id, page: 1 });
    setPlaying(true);
  };

  return (
    <section className="relative w-full overflow-hidden rounded-2xl">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(ellipse at top left, ${dominantColor}, transparent 80%), radial-gradient(ellipse at bottom right, ${dominantColor}, transparent 80%)`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-neutral-950/75 to-neutral-950" />

      <div className="relative z-10 flex flex-col md:flex-row items-end gap-6 p-6 sm:p-8 backdrop-blur-[2px]">
        <div className="h-40 w-40 overflow-hidden rounded-full shadow-2xl ring-1 ring-white/10">
          {artist.image ? (
            <img
              src={artist.image}
              alt={artist.name}
              className="h-full w-full object-cover"
              crossOrigin="anonymous"
            />
          ) : (
            <div className="h-full w-full bg-neutral-800 flex items-center justify-center text-white/60 text-xl font-bold">
              {artist.name.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-white/5 bg-black/20 p-4 backdrop-blur-md">
          <h1 className="text-3xl sm:text-5xl font-bold text-white">{artist.name}</h1>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePlay}
              className="h-12 w-12 rounded-full bg-[#1DB954] text-black hover:scale-105 flex items-center justify-center transition-all"
              aria-label={`Play ${artist.name}`}
            >
              <Play size={18} fill="currentColor" />
            </button>
            <button
              type="button"
              onClick={handleShuffle}
              className="flex items-center gap-2 rounded-full border border-white/20 bg-black/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/50 hover:bg-white/10"
              aria-label={`Shuffle ${artist.name}`}
            >
              <Shuffle size={16} />
              Shuffle
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
