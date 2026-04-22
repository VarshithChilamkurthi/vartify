import { create } from "zustand";

import type { Track } from "@/lib/types/music";

export type PlaybackContext = {
  type: "artist" | "album";
  id: string;
  page: number;
};

type PlayerState = {
  queue: Track[];
  currentIndex: number;
  isPlaying: boolean;
  volume: number;
  isExpanded: boolean;
  isShuffle: boolean;
  loopMode: "off" | "all" | "one";
  isQueueOpen: boolean;
  playbackContext: PlaybackContext | null;
};

type PlayerActions = {
  playAlbum: (tracks: Track[]) => void;
  playTrack: (track: Track) => void;
  togglePlay: () => void;
  setPlaying: (isPlaying: boolean) => void;
  next: () => void;
  prev: () => void;
  setVolume: (volume: number) => void;
  setCurrentIndex: (index: number) => void;
  toggleExpanded: () => void;
  expand: () => void;
  collapse: () => void;
  playQueue: (songs: Track[], startIndex: number, context?: PlaybackContext) => void;
  appendSongs: (songs: Track[]) => void;
  appendQueue: (songs: Track[]) => void;
  setPlaybackContext: (context: PlaybackContext | null) => void;
  toggleShuffle: () => void;
  cycleLoopMode: () => void;
  toggleQueue: () => void;
};

function clampVolume(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export const usePlayerStore = create<PlayerState & PlayerActions>((set, get) => ({
  queue: [],
  currentIndex: -1,
  isPlaying: false,
  volume: 1,
  isExpanded: false,
  isShuffle: false,
  loopMode: "all",
  isQueueOpen: false,
  playbackContext: null,

  toggleExpanded: () => {
    set((s) => ({ isExpanded: !s.isExpanded }));
  },

  expand: () => {
    set({ isExpanded: true });
  },

  collapse: () => {
    set({ isExpanded: false });
  },

  toggleQueue: () => {
    set((s) => ({ isQueueOpen: !s.isQueueOpen }));
  },

  setCurrentIndex: (index) => {
    set({ currentIndex: index });
  },

  playAlbum: (tracks) => {
    if (!tracks.length) {
      set({ queue: [], currentIndex: -1, isPlaying: false, playbackContext: null });
      return;
    }
    set({ queue: tracks, currentIndex: 0, isPlaying: true, playbackContext: null });
  },

  setPlaybackContext: (context) => {
    set({ playbackContext: context });
  },

  appendSongs: (songs) => {
    if (!songs.length) {
      return;
    }
    set((state) => ({ queue: [...state.queue, ...songs] }));
  },

  appendQueue: (songs) => {
    if (!songs.length) {
      return;
    }
    set((state) => ({ queue: [...state.queue, ...songs] }));
  },

  playQueue: (songs, startIndex, context) => {
    if (!songs.length) {
      set({ queue: [], currentIndex: -1, isPlaying: false, playbackContext: null });
      return;
    }

    const safeIndex = Math.max(0, Math.min(startIndex, songs.length - 1));

    set({
      queue: songs,
      currentIndex: safeIndex,
      isPlaying: true,
      playbackContext: context || null,
    });
  },

  playTrack: (track) => {
    set({ queue: [track], currentIndex: 0, isPlaying: true, playbackContext: null });
  },

  togglePlay: () => {
    set((s) => ({ isPlaying: !s.isPlaying }));
  },

  setPlaying: (isPlaying) => {
    set({ isPlaying });
  },

  next: async () => {
    const { queue, currentIndex, isShuffle, loopMode, playbackContext, appendSongs, setPlaybackContext } = get();
    
    if (!queue.length) return;
  
    // 1. Handle Loop One
    if (loopMode === "one") {
      set({ isPlaying: true });
      return;
    }
  
    // 2. Handle Shuffle
    if (isShuffle && queue.length > 1) {
      let nextIndex = currentIndex;
      while (nextIndex === currentIndex) {
        nextIndex = Math.floor(Math.random() * queue.length);
      }
      set({ currentIndex: nextIndex, isPlaying: true });
      return;
    }
  
    // 3. Handle Normal Next
    if (currentIndex < queue.length - 1) {
      set({ currentIndex: currentIndex + 1, isPlaying: true });
      return;
    }
  
    // 4. THE FIX: Handle End of Queue + Pagination
    if (playbackContext?.type === "artist") {
      try {
        const nextPage = playbackContext.page + 1;
        const res = await fetch(`/api/artist/${encodeURIComponent(playbackContext.id)}/songs?page=${nextPage}`);
        const data = await res.json();
  
        if (data.songs?.length) {
          // We update the queue AND move to the next song in one go
          set({
            queue: [...queue, ...data.songs],
            currentIndex: currentIndex + 1,
            playbackContext: { ...playbackContext, page: nextPage },
            isPlaying: true
          });
          return;
        }
      } catch (err) {
        console.error("Failed to fetch next page in store", err);
      }
    }
  
    // 5. Handle Loop All fallback
    if (loopMode === "all") {
      set({ currentIndex: 0, isPlaying: true });
      return;
    }
  
    // 6. Truly the end
    set({ isPlaying: false });
  },

  prev: () => {
    const { currentIndex } = get();
    if (currentIndex > 0) {
      set({ currentIndex: currentIndex - 1, isPlaying: true });
    } else {
      set({ currentIndex: 0, isPlaying: true });
    }
  },

  setVolume: (volume) => {
    set({ volume: clampVolume(volume) });
  },

  toggleShuffle: () => {
    set((s) => ({ isShuffle: !s.isShuffle }));
  },

  cycleLoopMode: () => {
    set((s) => {
      if (s.loopMode === "off") return { loopMode: "all" as const };
      if (s.loopMode === "all") return { loopMode: "one" as const };
      return { loopMode: "off" as const };
    });
  },
}));

/** Derived: queue[currentIndex], or null if out of range / empty. */
export const selectCurrentTrack = (state: PlayerState): Track | null => {
  if (state.currentIndex < 0 || state.currentIndex >= state.queue.length) {
    return null;
  }
  return state.queue[state.currentIndex];
};
