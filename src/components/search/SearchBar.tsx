"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { usePlayerStore } from "@/store/playerStore";

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function ClearIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const playTrack = usePlayerStore((s) => s.playTrack);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const playQueue = usePlayerStore((s) => s.playQueue);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    router.push(`/search?q=${encodeURIComponent(query)}`);
    setResults([]);
    setActiveIndex(-1);
  };

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
  
    const timeout = setTimeout(async () => {
      try {
        setLoading(true);
  
        const res = await fetch(
          `/api/songs?query=${encodeURIComponent(query)}`
        );

        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }

        const data = await res.json();
  
        setResults(data.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);
  
    return () => clearTimeout(timeout);
  }, [query]);

  const hasValue = query.length > 0;

  return (
    <form onSubmit={handleSearch} className="w-full max-w-xl relative">
      <div
        className={[
          "group relative flex items-center rounded-full border border-white/10 bg-white/[0.06] shadow-sm transition-all duration-300 ease-out",
          "hover:border-white/15 hover:bg-white/[0.08]",
          "focus-within:border-white/20 focus-within:bg-white/[0.09] focus-within:shadow-md focus-within:shadow-black/30 focus-within:ring-2 focus-within:ring-green-500/35 focus-within:ring-offset-2 focus-within:ring-offset-neutral-950",
          "focus-within:scale-[1.01] sm:focus-within:scale-[1.015]",
        ].join(" ")}
      >
        <label htmlFor="global-search" className="sr-only">
          Search
        </label>
        <span className="pointer-events-none absolute left-4 flex text-white/40 transition-colors duration-300 group-focus-within:text-white/55">
          <SearchIcon />
        </span>

        <input
          onKeyDown={(e) => {
            if (!results.length) return;
          
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveIndex((prev) =>
                prev < results.length - 1 ? prev + 1 : 0
              );
            }
          
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIndex((prev) =>
                prev > 0 ? prev - 1 : results.length - 1
              );
            }
          
            if (e.key === "Enter") {
              if (activeIndex >= 0) {
                e.preventDefault();
                const song = results[activeIndex];
                playQueue(results, activeIndex);
                setQuery("");
                setResults([]);
                setActiveIndex(-1);
              }
              // else → form submit handles navigation
            }
          
            if (e.key === "Escape") {
              setResults([]);
              setActiveIndex(-1);
            }
          }}
          id="global-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What do you want to listen to?"
          autoComplete="off"
          className={`min-h-[48px] w-full rounded-full bg-transparent py-3 pl-12 text-[15px] text-white placeholder:text-white/35 outline-none sm:min-h-[52px] sm:py-3.5 sm:pl-[3.25rem] sm:text-base ${hasValue ? "pr-11" : "pr-4"}`}
        />

        {hasValue ? (
          <button
            type="button"
            onClick={() => {
                setQuery(""); 
                document.getElementById("global-search")?.focus();
            }}
            className="absolute right-3 flex h-8 w-8 items-center justify-center rounded-full text-white/45 transition-colors hover:bg-white/10 hover:text-white/80"
            aria-label="Clear search"
          >
            <ClearIcon />
          </button>
        ) : null}
      </div>
      {results.length > 0 && (
  <div className="absolute top-full mt-2 w-full rounded-xl border border-white/10 bg-neutral-900 shadow-xl z-50">
    
    {/* Songs */}
    {results.map((song, index) => (
      <button type="button"
        key={song.id}
        onMouseEnter={() => setActiveIndex(index)}
        onClick={() => {
          playQueue(results, index);
          setQuery("");
          setResults([]);
        }}
        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors
            ${activeIndex === index ? "bg-white/15" : "hover:bg-white/10"}
          `}
      >
        <div className="h-10 w-10 rounded-md overflow-hidden bg-neutral-800">
          {song.image && (
            <img
              src={song.image}
              alt={song.name}
              className="h-full w-full object-cover"
            />
          )}
        </div>

        <div className="flex flex-col">
          <span className="text-sm text-white">{song.name}</span>
          <span className="text-xs text-white/60">{song.artist}</span>
        </div>
      </button>
    ))}

    {/* Divider */}
    <div className="h-px bg-white/10 my-1" />

    {/* View all results */}
    <button
      onClick={() => {
        router.push(`/search?q=${encodeURIComponent(query)}`);
        setResults([]);
      }}
      className="w-full px-4 py-3 text-left text-sm text-green-400 hover:bg-white/10"
    >
      View all results for "{query}"
    </button>
  </div>
)}
    </form>
  );
}
