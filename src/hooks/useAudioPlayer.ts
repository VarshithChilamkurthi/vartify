"use client";

import { useEffect, useState } from "react";

import { selectCurrentTrack, usePlayerStore } from "@/store/playerStore";

function getGlobalAudioSingleton(): HTMLAudioElement | null {
  if (typeof document === "undefined") {
    return null;
  }
  return document.getElementById("vartify-audio") as HTMLAudioElement | null;
}

function safeNumber(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function getAudio(): HTMLAudioElement | null {
  return getGlobalAudioSingleton();
}

export function getAudioElement(): HTMLAudioElement | null {
  if (typeof window === "undefined") {
    return null;
  }
  return getAudio();
}

export function seekTo(seconds: number): void {
  const audio = getAudio();
  if (!audio) {
    return;
  }
  const target = Math.max(0, seconds);
  audio.currentTime = target;
}

export function useAudioPlayer(): { currentTime: number; duration: number } {
  const currentTrack = usePlayerStore(selectCurrentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const volume = usePlayerStore((s) => s.volume);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // 1) Attach reliable audio event listeners (time/duration/seek)
  useEffect(() => {
    const audio = document.getElementById("vartify-audio") as HTMLAudioElement | null;
    if (!audio) return;

    const onLoadedMetadata = () => {
      setDuration(safeNumber(audio.duration));
      setCurrentTime(safeNumber(audio.currentTime));
    };
    const onTimeUpdate = () => {
      setCurrentTime(safeNumber(audio.currentTime));
    };
    const onSeeked = () => {
      setCurrentTime(safeNumber(audio.currentTime));
    };
    const onDurationChange = () => {
      setDuration(safeNumber(audio.duration));
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("seeked", onSeeked);
    audio.addEventListener("durationchange", onDurationChange);

    // Initial sync in case it's already playing
    setDuration(safeNumber(audio.duration));
    setCurrentTime(safeNumber(audio.currentTime));

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("seeked", onSeeked);
      audio.removeEventListener("durationchange", onDurationChange);
    };
  }, [currentTrack?.id]);

  // 2) When isPlaying changes: play/pause without touching src
  useEffect(() => {
    const audio = document.getElementById("vartify-audio") as HTMLAudioElement | null;
    if (!audio) return;
    if (!currentTrack || !audio.src) return;

    if (isPlaying) {
      if (audio.paused && audio.readyState >= 2) {
        void audio.play().catch(() => {});
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack?.id]);

  // 3) Volume sync
  useEffect(() => {
    const audio = document.getElementById("vartify-audio") as HTMLAudioElement | null;
    if (!audio) return;
    audio.volume = Math.max(0, Math.min(1, volume));
  }, [volume, currentTrack?.id]);

  // 4) Keyboard media controls
  useEffect(() => {
    const audio = document.getElementById("vartify-audio") as HTMLAudioElement | null;
    if (!audio) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTypingTarget =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (isTypingTarget) {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        usePlayerStore.getState().togglePlay();
      } else if (event.code === "ArrowRight") {
        event.preventDefault();
        seekTo(audio.currentTime + 10);
      } else if (event.code === "ArrowLeft") {
        event.preventDefault();
        seekTo(audio.currentTime - 10);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [currentTrack?.id]);

  // 5) Media Session integration
  useEffect(() => {
    const audio = document.getElementById("vartify-audio") as HTMLAudioElement | null;
    if (!audio || typeof navigator === "undefined" || !("mediaSession" in navigator)) {
      return;
    }

    navigator.mediaSession.metadata = currentTrack
      ? new MediaMetadata({
          title: currentTrack.name,
          artist: currentTrack.artist || "Unknown Artist",
          artwork: currentTrack.image
            ? [{ src: currentTrack.image, sizes: "512x512", type: "image/jpeg" }]
            : [],
        })
      : null;

    navigator.mediaSession.setActionHandler("play", () => {
      usePlayerStore.getState().setPlaying(true);
    });
    navigator.mediaSession.setActionHandler("pause", () => {
      usePlayerStore.getState().setPlaying(false);
    });
    navigator.mediaSession.setActionHandler("nexttrack", () => {
      usePlayerStore.getState().next();
    });
    navigator.mediaSession.setActionHandler("previoustrack", () => {
      usePlayerStore.getState().prev();
    });

    return () => {
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("nexttrack", null);
      navigator.mediaSession.setActionHandler("previoustrack", null);
    };
  }, [currentTrack]);

  return { currentTime, duration };
}