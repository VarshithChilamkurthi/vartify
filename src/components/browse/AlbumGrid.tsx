import type { Album } from "@/lib/types/music";

import { AlbumCard } from "./AlbumCard";

type AlbumGridProps = {
  albums: Album[];
  className?: string;
};

export function AlbumGrid({ albums, className = "" }: AlbumGridProps) {
  return (
    <div
      className={`grid grid-cols-2 gap-5 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4 lg:gap-8 ${className}`}
    >
      {albums.map((album) => (
        <AlbumCard key={album.id} album={album} />
      ))}
    </div>
  );
}

