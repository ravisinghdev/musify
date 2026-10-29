"use client";

import React, { useEffect, useRef } from "react";
import type { Track } from "../types/music";

interface YouTubeAudioEngineProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  isRepeat?: boolean;
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onEnded: () => void;
  onIsPlayingChange: (isPlaying: boolean) => void;
  seekToTime: number | null;
  onSeekHandled: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export function YouTubeAudioEngine({
  currentTrack,
  isPlaying,
  volume,
  isMuted,
  isRepeat = false,
  onTimeUpdate,
  onEnded,
  onIsPlayingChange,
  seekToTime,
  onSeekHandled,
  onNext,
  onPrev,
}: YouTubeAudioEngineProps) {
  const playerRef = useRef<any>(null);
  const isReadyRef = useRef(false);
  const currentVideoIdRef = useRef<string | null>(null);

  // Dynamic references to eliminate stale closures in YouTube callbacks
  const onEndedRef = useRef(onEnded);
  const onIsPlayingChangeRef = useRef(onIsPlayingChange);
  const isRepeatRef = useRef(isRepeat);
  const onNextRef = useRef(onNext);
  const onPrevRef = useRef(onPrev);

  useEffect(() => {
    onEndedRef.current = onEnded;
    onIsPlayingChangeRef.current = onIsPlayingChange;
    isRepeatRef.current = isRepeat;
    onNextRef.current = onNext;
    onPrevRef.current = onPrev;
  });

  // Sync with OS Media Session API (lock-screen & hardware media keys)
  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;

    if (currentTrack) {
      const artistsText = currentTrack.artists.map((a) => a.name).join(", ");
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: currentTrack.title,
        artist: artistsText,
        album: currentTrack.album?.title || "Musify",
        artwork: currentTrack.artworkUrl
          ? [
              {
                src: currentTrack.artworkUrl,
                sizes: "512x512",
                type: "image/jpeg",
              },
            ]
          : [],
      });
    }

    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";

    navigator.mediaSession.setActionHandler("play", () =>
      onIsPlayingChangeRef.current(true),
    );
    navigator.mediaSession.setActionHandler("pause", () =>
      onIsPlayingChangeRef.current(false),
    );
    navigator.mediaSession.setActionHandler("nexttrack", () => {
      onNextRef.current?.();
    });
    navigator.mediaSession.setActionHandler("previoustrack", () => {
      onPrevRef.current?.();
    });

    try {
      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (details.seekTime !== undefined && details.seekTime !== null) {
          playerRef.current?.seekTo(details.seekTime, true);
        }
      });
      navigator.mediaSession.setActionHandler("seekforward", (details) => {
        const offset = details.seekOffset || 10;
        const curr = playerRef.current?.getCurrentTime?.() || 0;
        playerRef.current?.seekTo(curr + offset, true);
      });
      navigator.mediaSession.setActionHandler("seekbackward", (details) => {
        const offset = details.seekOffset || 10;
        const curr = playerRef.current?.getCurrentTime?.() || 0;
        playerRef.current?.seekTo(Math.max(0, curr - offset), true);
      });
    } catch {}

    return () => {
      if ("mediaSession" in navigator) {
        navigator.mediaSession.setActionHandler("play", null);
        navigator.mediaSession.setActionHandler("pause", null);
        navigator.mediaSession.setActionHandler("nexttrack", null);
        navigator.mediaSession.setActionHandler("previoustrack", null);
        try {
          navigator.mediaSession.setActionHandler("seekto", null);
          navigator.mediaSession.setActionHandler("seekforward", null);
          navigator.mediaSession.setActionHandler("seekbackward", null);
        } catch {}
      }
    };
  }, [currentTrack, isPlaying]);

  // Load YouTube Iframe API
  useEffect(() => {
    if (typeof window === "undefined") return;

    function initPlayer() {
      if (!window.YT || !window.YT.Player) return;

      if (playerRef.current) return;

      playerRef.current = new window.YT.Player("musify-hidden-yt-player", {
        height: "1",
        width: "1",
        videoId: currentTrack?.sourceTrackId || "xTvyyoF_LZY",
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
        },
        events: {
          onReady: (event: any) => {
            isReadyRef.current = true;
            event.target.setVolume(isMuted ? 0 : volume * 100);
            if (isPlaying) {
              event.target.playVideo();
            }
          },
          onStateChange: (event: any) => {
            // YT.PlayerState: -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued
            if (event.data === 1) {
              onIsPlayingChangeRef.current(true);
            } else if (event.data === 2) {
              onIsPlayingChangeRef.current(false);
            } else if (event.data === 0) {
              // Direct repeat handling: replay instantly from 0s
              if (isRepeatRef.current) {
                try {
                  event.target.seekTo(0, true);
                  event.target.playVideo();
                  return;
                } catch {}
              }
              onIsPlayingChangeRef.current(false);
              onEndedRef.current();
            }
          },
          onError: (err: any) => {
            console.warn("YouTube player error, advancing queue:", err);
            setTimeout(() => {
              onNextRef.current?.();
            }, 600);
          },
        },
      });
    }

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      const existingScript = document.getElementById("yt-iframe-api");
      if (!existingScript) {
        const tag = document.createElement("script");
        tag.id = "yt-iframe-api";
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScript = document.getElementsByTagName("script")[0];
        firstScript.parentNode?.insertBefore(tag, firstScript);
      }

      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        initPlayer();
      };
    }

    return () => {
      // Keep player intact across re-renders
    };
  }, []);

  // Track change
  useEffect(() => {
    if (!currentTrack || !isReadyRef.current || !playerRef.current) return;
    const videoId = currentTrack.sourceTrackId;
    if (!videoId || videoId.length !== 11) return;

    if (currentVideoIdRef.current !== videoId) {
      currentVideoIdRef.current = videoId;
      try {
        if (isPlaying) {
          playerRef.current.loadVideoById(videoId);
        } else {
          playerRef.current.cueVideoById(videoId);
        }
      } catch (e) {
        console.error("Failed to load video:", e);
      }
    }
  }, [currentTrack, isPlaying]);

  // Sync play/pause
  useEffect(() => {
    if (!isReadyRef.current || !playerRef.current) return;
    try {
      const state = playerRef.current.getPlayerState?.();
      if (isPlaying && state !== 1 && state !== 3) {
        playerRef.current.playVideo();
      } else if (!isPlaying && state === 1) {
        playerRef.current.pauseVideo();
      }
    } catch {}
  }, [isPlaying]);

  // Sync volume & mute
  useEffect(() => {
    if (!isReadyRef.current || !playerRef.current) return;
    try {
      playerRef.current.setVolume(isMuted ? 0 : volume * 100);
      if (isMuted) {
        playerRef.current.mute();
      } else {
        playerRef.current.unMute();
      }
    } catch {}
  }, [volume, isMuted]);

  // Sync seek
  useEffect(() => {
    if (seekToTime === null || !isReadyRef.current || !playerRef.current) return;
    try {
      playerRef.current.seekTo(seekToTime, true);
      onSeekHandled();
    } catch {}
  }, [seekToTime, onSeekHandled]);

  // Time update polling (high-frequency 200ms for silky smooth lyrics sync)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isReadyRef.current || !playerRef.current) return;
      try {
        const state = playerRef.current.getPlayerState?.();
        if (state === 1 || state === 3) {
          const curr = playerRef.current.getCurrentTime?.() ?? 0;
          const dur = playerRef.current.getDuration?.() ?? 0;
          onTimeUpdate(curr, dur);
        }
      } catch {}
    }, 200);

    return () => clearInterval(interval);
  }, [onTimeUpdate]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed bottom-0 right-0 h-1 w-1 opacity-[0.001] z-[-1] overflow-hidden"
    >
      <div id="musify-hidden-yt-player" />
    </div>
  );
}

