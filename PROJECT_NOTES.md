# Vartify Project Notes

## Architecture

- Next.js App Router
- Zustand player
- Audio engine (singleton Audio)
- API proxy layer

## Key Decisions

- No direct API calls from frontend
- Service layer abstraction
- Zustand for global player state

## Used Prompts Till Now

Simplify this architecture for Phase 1 only.
Prompt1:
Constraints:

- Use Next.js instead of Vite
- No backend for now (frontend only)
- Focus only on:
  - album browsing
  - album page
  - music playback

Give:

- exact folder structure
- exact components to build
- step-by-step implementation plan

Avoid overengineering.

Prompt2:
Create a Next.js 14 app with App Router and TypeScript.

Setup:

- Tailwind CSS
- src directory
- ESLint

Do not implement features yet. We will go Step-by-step

Prompt3:
Create Next.js API routes for music data.

Routes:

1. GET /api/albums
2. GET /api/albums/[id]

Requirements:

1. External API Integration

- Use process.env.JIOSAAVN_API_BASE_URL
- Call:
  - /api/search/albums?query=bollywood&limit=10 (for album list)
  - /api/albums?id={id} (for album details)

2. Create clean DTO mapping (VERY IMPORTANT)

Album:
{
id: string,
name: string,
artist: string,
image: string,
songs: Track[]
}

Track:
{
id: string,
name: string,
duration: number,
audioUrl: string
}

3. Mapping Rules

- Extract only required fields from API response
- Convert duration to number (seconds)
- Choose a valid audioUrl (prefer highest quality)
- If audioUrl is missing, skip that track
- Flatten artist into a single string
- Pick a single image URL (highest quality if available)

4. Code Structure

- Create server-only helper files:
  - lib/server/saavnHttp.ts (for fetch logic)
  - lib/server/mapAlbum.ts (for mapping)
  - lib/server/mapAlbumSearchItem.ts (for album list mapping)
- Do NOT put mapping logic inside route files

5. Error Handling

- Return 404 if album not found
- Return 502 if external API fails
- Do NOT expose raw API response

6. Environment

- Use JIOSAAVN_API_BASE_URL from .env.local
- Do NOT hardcode URLs

7. Clean Architecture

- API routes should only call helper functions and return transformed data
- No frontend logic
- No UI code

Do not implement any UI yet.

Prompt4:
Create services/musicService.ts

Requirements:

1. Create functions:

- getAlbums(): Promise<Album[]>
  - fetch from /api/albums
  - return parsed JSON

- getAlbumById(id: string): Promise<Album>
  - fetch from /api/albums/{id}
  - return parsed JSON

2. Error Handling:

- If response is not ok, throw an error with message
- Handle 404 separately (optional: return null or throw)

3. Implementation:

- Use fetch API
- Use relative URLs ("/api/..."), no localhost hardcoding
- Add basic typing using existing Album/Track types

4. Clean Code:

- No UI code
- No console logs
- Reusable functions

Goal:
Frontend components should ONLY use this service layer, not call API routes directly.

Prompt5:
Create a global music player store using Zustand.

Requirements:

1. State:

- queue: Track[]
- currentIndex: number
- isPlaying: boolean
- volume: number (0–1)

2. Derived:

- currentTrack = queue[currentIndex]

3. Actions:

- playAlbum(tracks: Track[])
  - set queue
  - set currentIndex = 0
  - set isPlaying = true

- playTrack(track: Track)
  - set queue = [track]
  - currentIndex = 0
  - isPlaying = true

- togglePlay()
  - toggle isPlaying

- next()
  - move to next track if exists

- prev()
  - move to previous track if exists

- setVolume(volume: number)

4. Constraints:

- Use Zustand
- Keep store in src/store/playerStore.ts
- No UI code
- No audio element yet (only state)

Goal:
Centralized player state for the entire app.

Prompt6:
Create a homepage UI that displays albums in a grid.

Requirements:

1. Fetch data using getAlbums() from musicService

2. Display:

- Album image
- Album name
- Artist name

3. Layout:

- Responsive grid (Tailwind)
- 2 columns mobile, 4+ desktop

4. Styling:

- Dark theme (Spotify-like)
- Hover effect on album cards
- Rounded images

5. Behavior:

- Clicking an album navigates to /album/[id]

6. Use Next.js App Router (Link)

7. Keep code clean and component-based

Do not implement player UI yet.

Prompt7:
Create album detail page at /album/[id] using Next.js App Router.

Requirements:

1. Data Fetching:

- Use getAlbumById(id) from musicService
- This should be a Server Component page

2. Layout:

Top Section:

- Large album image (left)
- Album name (big title)
- Artist name
- Play Album button

Below:

- Track list

3. Track List:

- Show all tracks
- Each row:
  - Track number
  - Track name
  - Duration (mm:ss)

4. Behavior:

- Clicking "Play Album" button:
  → usePlayerStore.getState().playAlbum(album.songs)

- Clicking a track:
  → usePlayerStore.getState().playTrack(track)

5. Styling:

- Dark theme
- Clean spacing
- Hover effect on tracks
- Spotify-like layout

6. Important:

- Track click handlers must be in a Client Component
- Page itself can remain Server Component

Goal:
Connect UI interactions to player store.

7. Search:

- Initially the search just returned the list with lowest quality. But i changed the quality to max. Did the change in songs/route.ts
