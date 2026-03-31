"use client";

import { useEffect, useRef, useState } from "react";

import { selectCurrentTrack, usePlayerStore } from "@/store/playerStore";

function getGlobalAudioSingleton(): HTMLAudioElement {
  const g = globalThis as unknown as { __vartifyAudio?: HTMLAudioElement };
  if (!g.__vartifyAudio) {
    g.__vartifyAudio = new Audio();
    g.__vartifyAudio.preload = "metadata";
  }
  return g.__vartifyAudio;
}

function safeNumber(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function getAudio(): HTMLAudioElement {
  return getGlobalAudioSingleton();
}

export function seekTo(seconds: number): void {
  const audio = getAudio();
  const target = Math.max(0, seconds);
  audio.currentTime = target;

  if (usePlayerStore.getState().isPlaying) {
    void audio.play().catch(() => {});
  }
}

export function useAudioPlayer(): { currentTime: number; duration: number } {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (!audioRef.current && typeof window !== "undefined") {
    audioRef.current = getAudio();
  }

  const audio = audioRef.current;

  const currentTrack = usePlayerStore(selectCurrentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const volume = usePlayerStore((s) => s.volume);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioUrl = currentTrack?.audioUrl;

  // 1) Attach reliable audio event listeners (time/duration/ended/seek)
  useEffect(() => {
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

    const onEnded = () => {
      usePlayerStore.getState().next();
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("seeked", onSeeked);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("seeked", onSeeked);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("ended", onEnded);
    };
  }, [audio]);

  // 2) When the track changes: set src, load, reset time, and start if isPlaying
  useEffect(() => {
    if (!audio) return;

    if (!currentTrack || !audioUrl) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      setCurrentTime(0);
      setDuration(0);
      return;
    }

    setCurrentTime(0);
    setDuration(0);

    audio.pause();

    if (audio.src !== audioUrl) {
      audio.src = audioUrl;
    }

    audio.currentTime = 0;
    audio.load();

    if (usePlayerStore.getState().isPlaying) {
      void audio.play().catch(() => {});
    }
  }, [currentTrack?.id, audioUrl, audio]);

  // 3) When isPlaying changes: play/pause without touching src
  useEffect(() => {
    if (!audio) return;
    if (!currentTrack || !audio.src) return;

    if (isPlaying) {
      void audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack?.id, audio]);

  // 4) Volume sync
  useEffect(() => {
    if (!audio) return;
    audio.volume = Math.max(0, Math.min(1, volume));
  }, [volume, audio]);

  return { currentTime, duration };
}