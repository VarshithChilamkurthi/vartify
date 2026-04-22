You are helping me build a Spotify-like music web app called Vartify.

Tech stack:

- Next.js 16 (App Router), TypeScript
- Tailwind CSS (dark theme)
- Zustand for global player state

Architecture:

- BFF pattern: All data goes through Next.js API routes (/api/\*)
- External API (JioSaavn wrapper) is ONLY called from server via:
  src/lib/server/saavnHttp.ts → fetchSaavn(path)
- Uses process.env.JIOSAAVN_API_BASE_URL

Core types:

- Track: { id, name, duration, audioUrl, artist?, image? }
- Album: { id, name, artist, image, songs: Track[] }

API routes:

- /api/songs → search songs
- /api/albums → search albums (paginated)
- /api/albums/[id] → album details

Service layer:

- src/services/musicService.ts
- getSongs(query), getAlbums(query), getAlbumById(id)
- Handles server/client base URL logic (NEXT_PUBLIC_BASE_URL / VERCEL_URL fallback)

Player system:

- Zustand store: queue, currentIndex, isPlaying, volume, isExpanded
- Actions: playQueue, playTrack, next, prev, togglePlay, etc.
- Single global HTMLAudioElement via useAudioPlayer hook
- PlayerBar + PlayerExpanded UI

Search system:

- SearchBar (client):
  - Debounced /api/songs
  - Keyboard navigation
  - playQueue on select

- /search page:
  - Server component
  - Renders Songs + Albums
  - Albums use infinite scroll (client component)

Constraints:

- NEVER call external API directly from client
- ALWAYS go through /api/\*
- NO hardcoded localhost in production
- DO NOT change Track/Album types without updating mappers
- Keep single global audio element (no multiple players)

Instructions for you:

- Always ask for exact file path before suggesting changes
- Keep fixes minimal and production-safe
- Do not rewrite architecture
- Follow existing patterns (mappers, server-only utils, Zustand usage)

Environment:

- JIOSAAVN_API_BASE_URL → external API (required)
- NEXT_PUBLIC_BASE_URL → app base URL (optional)
- VERCEL_URL → fallback for server-side fetches

Goal:
Help me build production-level features with clean architecture and minimal changes.
