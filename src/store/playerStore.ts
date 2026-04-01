import { create } from "zustand";

import type { Track } from "@/lib/types/music";

type PlayerState = {
  queue: Track[];
  currentIndex: number;
  isPlaying: boolean;
  volume: number;
  isExpanded: boolean;
};

type PlayerActions = {
  playAlbum: (tracks: Track[]) => void;
  playTrack: (track: Track) => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  setVolume: (volume: number) => void;
  setCurrentIndex: (index: number) => void;
  toggleExpanded: () => void;
  expand: () => void;
  collapse: () => void;
  playQueue: (tracks: Track[], startIndex: number) => void;
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

  toggleExpanded: () => {
    set((s) => ({ isExpanded: !s.isExpanded }));
  },

  expand: () => {
    set({ isExpanded: true });
  },

  collapse: () => {
    set({ isExpanded: false });
  },

  setCurrentIndex: (index) => {
    set({ currentIndex: index });
  },

  playAlbum: (tracks) => {
    if (!tracks.length) {
      set({ queue: [], currentIndex: -1, isPlaying: false });
      return;
    }
    set({ queue: tracks, currentIndex: 0, isPlaying: true });
  },

  playQueue: (tracks, startIndex) => {
    if (!tracks.length) {
      set({ queue: [], currentIndex: -1, isPlaying: false });
      return;
    }

    const safeIndex = Math.max(0, Math.min(startIndex, tracks.length - 1));

    set({ queue: tracks, currentIndex: safeIndex, isPlaying: true });
  },

  playTrack: (track) => {
    set({ queue: [track], currentIndex: 0, isPlaying: true });
  },

  togglePlay: () => {
    set((s) => ({ isPlaying: !s.isPlaying }));
  },

  next: () => {
  const { queue, currentIndex } = get();

  // if next exists → go next
  if (currentIndex < queue.length - 1) {
    set({ currentIndex: currentIndex + 1, isPlaying: true });
  } else {
    // loop back to start
    set({ currentIndex: 0, isPlaying: true });
  }
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
}));

/** Derived: queue[currentIndex], or null if out of range / empty. */
export const selectCurrentTrack = (state: PlayerState): Track | null => {
  if (state.currentIndex < 0 || state.currentIndex >= state.queue.length) {
    return null;
  }
  return state.queue[state.currentIndex];
};
