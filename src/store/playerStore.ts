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
  isAutoplay: boolean;
  volume: number;
  isExpanded: boolean;
  isShuffle: boolean;
  loopMode: "off" | "all" | "one";
  isQueueOpen: boolean;
  isRadioMode: boolean;
  playbackContext: PlaybackContext | null;
  recentTracks: Track[];
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
  setShuffle: (isShuffle: boolean) => void;
  cycleLoopMode: () => void;
  toggleQueue: () => void;
  toggleAutoplay: () => void;
  toggleRadioMode: () => void;
  fetchRadioTracks: () => Promise<void>;
  addToHistory: (track: Track) => void;
};

function clampVolume(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export const usePlayerStore = create<PlayerState & PlayerActions>((set, get) => ({
  queue: [],
  currentIndex: -1,
  isPlaying: false,
  isAutoplay: true,
  volume: 1,
  isExpanded: false,
  isShuffle: false,
  loopMode: "off",
  isQueueOpen: false,
  isRadioMode: true,
  playbackContext: null,
  recentTracks: [],

  addToHistory: (track) => {
    set((state) => {
      const filtered = state.recentTracks.filter((t) => t.id !== track.id);
      return { recentTracks: [track, ...filtered].slice(0, 20) };
    });
  },

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

  toggleAutoplay: () => {
    set((s) => ({ isAutoplay: !s.isAutoplay }));
  },

  fetchRadioTracks: async () => {
    const { queue, currentIndex } = get();
    if (currentIndex < 0 || !queue.length) {
      return;
    }
    const seedTrack = queue[currentIndex];
    if (!seedTrack) {
      return;
    }
    const historyIds = queue.map((t) => t.id);
    try {
      const res = await fetch("/api/radio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seedTrack, historyIds }),
      });
      const data = (await res.json()) as { songs?: Track[] };
      const newSongs = data.songs?.filter((s) => s?.id) ?? [];
      if (!newSongs.length) {
        return;
      }
      set((state) => ({ queue: [...state.queue, ...newSongs] }));
    } catch (err) {
      console.error("Failed to fetch AI radio tracks", err);
    }
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
    const t = songs[safeIndex];
    if (t) {
      get().addToHistory(t);
    }
  },

  playTrack: (track) => {
    set({ queue: [track], currentIndex: 0, isPlaying: true, playbackContext: null });
    get().addToHistory(track);
  },

  togglePlay: () => {
    set((s) => ({ isPlaying: !s.isPlaying }));
  },

  setPlaying: (isPlaying) => {
    set({ isPlaying });
  },

  next: async () => {
    const { queue, currentIndex, isShuffle, loopMode, playbackContext } = get();

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
      const q = get().queue;
      const t = q[nextIndex];
      if (t) {
        get().addToHistory(t);
      }
      return;
    }

    // 3. Handle Normal Next
    if (currentIndex < queue.length - 1) {
      set({ currentIndex: currentIndex + 1, isPlaying: true });

      const t = get().queue[currentIndex + 1];
      if (t) {
        get().addToHistory(t);
      }

      // AI Radio Look-ahead Trigger (Fetch even if in an album/artist context)
      const remainingSongs = queue.length - 1 - (currentIndex + 1);
      if (remainingSongs <= 2 && get().isRadioMode) {
        get().fetchRadioTracks().catch(console.error);
      }
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
          const nextIndex = currentIndex + 1;
          set({
            queue: [...queue, ...data.songs],
            currentIndex: nextIndex,
            playbackContext: { ...playbackContext, page: nextPage },
            isPlaying: true,
          });
          const t = get().queue[nextIndex];
          if (t) {
            get().addToHistory(t);
          }
          return;
        }
      } catch (err) {
        console.error("Failed to fetch next page in store", err);
      }
    }

    // 5. Handle Loop All fallback
    if (loopMode === "all") {
      set({ currentIndex: 0, isPlaying: true });
      const t = get().queue[0];
      if (t) {
        get().addToHistory(t);
      }
      return;
    }

    // 6. Handle AI Radio Mode (End of Queue)
    const { isRadioMode, fetchRadioTracks } = get();
    if (isRadioMode) {
      await fetchRadioTracks();

      const freshQueue = get().queue;
      if (currentIndex < freshQueue.length - 1) {
        set({
          currentIndex: currentIndex + 1,
          isPlaying: true,
          playbackContext: null,
        });
        const t = get().queue[currentIndex + 1];
        if (t) {
          get().addToHistory(t);
        }
        return;
      }
    }

    // 7. Truly the end
    set({ isPlaying: false, playbackContext: null });
  },

  prev: () => {
    const { currentIndex } = get();
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      set({ currentIndex: prevIndex, isPlaying: true });
      const t = get().queue[prevIndex];
      if (t) {
        get().addToHistory(t);
      }
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

  setShuffle: (val) => {
    set({ isShuffle: val });
  },

  toggleRadioMode: () => {
    set((s) => ({ isRadioMode: !s.isRadioMode }));
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
