"use client";

import { useEffect } from "react";
import { usePlayerStore, selectCurrentTrack } from "@/store/playerStore";

export function PlayerExpanded() {
  const currentTrack = usePlayerStore(selectCurrentTrack);
  const isExpanded = usePlayerStore((s) => s.isExpanded);
  const toggleExpanded = usePlayerStore((s) => s.toggleExpanded);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  // ✅ ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        toggleExpanded();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleExpanded]);

  if (!isExpanded || !currentTrack) return null;

  return (
    <div className="fixed inset-0 z-50 animate-slide-up overflow-hidden text-white flex items-center justify-center">
      
      {/* 🔥 Background image blur */}
      <div
        className="absolute inset-0 blur-3xl scale-110 opacity-40"
        style={{
          backgroundImage: `url(${currentTrack.image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* 🔥 Dark overlay */}
      <div className="absolute inset-0 bg-black/70" />

      {/* ✅ Content */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        
        {/* Close button */}
        <button
  onClick={toggleExpanded}
  className="fixed top-6 right-6 z-50 rounded-full bg-black/60 px-3 py-1 text-sm text-white hover:bg-black/80"
>
  ✕
</button>

        {/* Album Art */}
        <div className="w-80 h-80 mb-10 rounded-2xl overflow-hidden shadow-2xl">
          {currentTrack.image ? (
            <img
              src={currentTrack.image}
              alt={currentTrack.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-neutral-800" />
          )}
        </div>

        {/* Track Info */}
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold tracking-tight">
            {currentTrack.name}
          </h2>
          <p className="text-white/60">
            {currentTrack.artist || "Unknown Artist"}
          </p>
        </div>

        {/* Controls */}
        <div className="text-2xl mt-8 flex items-center gap-6">
          <button
            onClick={() => usePlayerStore.getState().prev()}
            className="text-white/70 hover:text-white text-xl"
          >
            ⏮
          </button>

          <button
  onClick={() => usePlayerStore.getState().togglePlay()}
  className="bg-white text-black rounded-full p-4 hover:scale-105 transition"
>
  {isPlaying ? "⏸" : "▶"}
</button>

          <button
            onClick={() => usePlayerStore.getState().next()}
            className="text-white/70 hover:text-white text-xl"
          >
            ⏭
          </button>
        </div>
      </div>
    </div>
  );
}