import Link from "next/link";

import type { Album } from "@/lib/types/music";

type HomeHeroProps = {
  album: Album;
};

export function HomeHero({ album }: HomeHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-950/80 via-neutral-950 to-neutral-950 p-6 shadow-2xl sm:p-8 md:p-10">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(34,197,94,0.25),transparent)]"
        aria-hidden
      />
      <div className="relative flex flex-col gap-8 md:flex-row md:items-end md:gap-10">
        <div className="mx-auto w-full max-w-[280px] shrink-0 overflow-hidden rounded-lg shadow-2xl ring-1 ring-white/10 md:mx-0 md:max-w-[320px]">
          {album.image ? (
            <img
              src={album.image}
              alt={album.name}
              className="aspect-square w-full object-cover"
            />
          ) : (
            <div className="aspect-square w-full bg-gradient-to-br from-neutral-700 to-neutral-900" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-4 pb-1 text-center md:pb-2 md:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
            Featured
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
            {album.name}
          </h2>
          <p className="text-base text-white/55 md:text-lg">{album.artist}</p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 md:justify-start">
            <Link
              href={`/album/${album.id}`}
              className="inline-flex min-h-[44px] min-w-[120px] items-center justify-center rounded-full bg-green-500 px-8 text-sm font-bold text-black transition-all duration-300 hover:scale-[1.02] hover:bg-green-400 active:scale-[0.98]"
            >
              Play
            </Link>
            <Link
              href={`/album/${album.id}`}
              className="inline-flex min-h-[44px] min-w-[120px] items-center justify-center rounded-full border border-white/20 bg-white/5 px-8 text-sm font-semibold text-white transition-all duration-300 hover:border-white/30 hover:bg-white/10"
            >
              Open
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
