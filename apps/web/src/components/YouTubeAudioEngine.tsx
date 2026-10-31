"use client";

import React, { useEffect, useRef, useState } from "react";
import type { Track } from "../types/music";
import type { EqualizerBands } from "../lib/settingsStore";

interface YouTubeAudioEngineProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  isRepeat?: boolean;
  repeatMode?: "off" | "all" | "one";
  playbackSpeed?: number;
  crossfadeSeconds?: number;
  onTimeUpdate: (currentTime: number, duration: number, loadedFraction?: number) => void;
  onEnded: () => void;
  onIsPlayingChange: (isPlaying: boolean) => void;
  seekToTime: number | null;
  onSeekHandled: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  equalizerEnabled?: boolean;
  equalizerBands?: EqualizerBands | Record<number, number>;
  equalizerPreset?: string;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

function getTrackVideoId(track: Track | null): string | null {
  if (!track) return null;
  if (track.sourceTrackId && track.sourceTrackId.length === 11) {
    return track.sourceTrackId;
  }
  if (track.id.startsWith("yt_") && track.id.length === 14) {
    return track.id.slice(3);
  }
  if (track.id.length === 11) {
    return track.id;
  }
  return null;
}

export function YouTubeAudioEngine({
  currentTrack,
  isPlaying,
  volume,
  isMuted,
  isRepeat = false,
  repeatMode = "off",
  playbackSpeed = 1.0,
  crossfadeSeconds = 3,
  onTimeUpdate,
  onEnded,
  onIsPlayingChange,
  seekToTime,
  onSeekHandled,
  onNext,
  onPrev,
  equalizerEnabled = false,
  equalizerBands,
  equalizerPreset,
}: YouTubeAudioEngineProps) {
  const playerRef = useRef<any>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const currentVideoIdRef = useRef<string | null>(null);
  const currentTrackRef = useRef<Track | null>(currentTrack);
  const isPlayingRef = useRef<boolean>(isPlaying);

  // Dynamic references to eliminate stale closures in YouTube callbacks
  const onEndedRef = useRef(onEnded);
  const onIsPlayingChangeRef = useRef(onIsPlayingChange);
  const isRepeatRef = useRef(isRepeat);
  const repeatModeRef = useRef<"off" | "all" | "one">(repeatMode);
  const onNextRef = useRef(onNext);
  const onPrevRef = useRef(onPrev);

  useEffect(() => {
    currentTrackRef.current = currentTrack;
    isPlayingRef.current = isPlaying;
    onEndedRef.current = onEnded;
    onIsPlayingChangeRef.current = onIsPlayingChange;
    isRepeatRef.current = isRepeat;
    repeatModeRef.current = repeatMode || (isRepeat ? "all" : "off");
    onNextRef.current = onNext;
    onPrevRef.current = onPrev;
  });

  // Synchronize playback speed
  useEffect(() => {
    if (!isPlayerReady || !playerRef.current) return;
    try {
      playerRef.current.setPlaybackRate?.(playbackSpeed || 1.0);
    } catch {}
  }, [playbackSpeed, isPlayerReady]);

  // Page visibility spoof to prevent browser/WebView from pausing audio when app is minimized
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      Object.defineProperty(document, "hidden", { get: () => false, configurable: true });
      Object.defineProperty(document, "visibilityState", { get: () => "visible", configurable: true });
      const cancelVisibility = (e: Event) => e.stopImmediatePropagation();
      window.addEventListener("visibilitychange", cancelVisibility, true);
      return () => window.removeEventListener("visibilitychange", cancelVisibility, true);
    } catch {}
  }, []);

  // Silent HTML5 audio track to maintain OS background audio focus & prevent mobile browser suspension
  const silentAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const audio = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA");
      audio.loop = true;
      audio.volume = 0.001;
      silentAudioRef.current = audio;
    } catch {}

    return () => {
      try {
        silentAudioRef.current?.pause();
        silentAudioRef.current = null;
      } catch {}
    };
  }, []);

  useEffect(() => {
    if (!silentAudioRef.current) return;
    if (isPlaying) {
      silentAudioRef.current.play().catch(() => {});
    } else {
      silentAudioRef.current.pause();
    }
  }, [isPlaying]);

  // Sync with OS Media Session API & Android Native Foreground Playback Service
  useEffect(() => {
    // 1. Android Native Background Playback Bridge
    if (typeof window !== "undefined" && (window as any).MusifyNativeBridge) {
      try {
        if (currentTrack) {
          const artistsText = currentTrack.artists
            .map((a) => a.name)
            .join(", ");
          const art =
            currentTrack.artworkUrl ||
            (currentTrack.sourceTrackId
              ? `https://i.ytimg.com/vi/${currentTrack.sourceTrackId}/hqdefault.jpg`
              : "");
          const curr = playerRef.current?.getCurrentTime?.() ?? 0;
          const dur = playerRef.current?.getDuration?.() ?? 0;
          (window as any).MusifyNativeBridge.updatePlayback(
            currentTrack.title,
            artistsText,
            art,
            isPlaying,
            curr,
            dur,
          );
        } else {
          (window as any).MusifyNativeBridge.stopPlayback();
        }
      } catch {}
    }

    // 2. Standard Web Media Session API (lock-screen & hardware media keys)
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

  // Handle native Android notification / lock screen remote controls
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleNativeControl = (e: any) => {
      const action = e.detail?.action;
      if (typeof action === "string" && action.startsWith("seek:")) {
        const seconds = parseFloat(action.replace("seek:", ""));
        if (!isNaN(seconds) && isFinite(seconds) && seconds >= 0) {
          try {
            playerRef.current?.seekTo?.(seconds, true);
          } catch {}
        }
        return;
      }
      if (e.detail?.seekSeconds !== undefined) {
        const seconds = Number(e.detail.seekSeconds);
        if (!isNaN(seconds) && isFinite(seconds) && seconds >= 0) {
          try {
            playerRef.current?.seekTo?.(seconds, true);
          } catch {}
        }
        return;
      }

      if (action === "play") {
        onIsPlayingChangeRef.current(true);
      } else if (action === "pause") {
        onIsPlayingChangeRef.current(false);
      } else if (action === "next") {
        onNextRef.current?.();
      } else if (action === "prev") {
        onPrevRef.current?.();
      }
    };
    window.addEventListener("musify-native-control", handleNativeControl);
    return () =>
      window.removeEventListener("musify-native-control", handleNativeControl);
  }, []);

  // Load YouTube Iframe API
  useEffect(() => {
    if (typeof window === "undefined") return;

    function initPlayer() {
      if (!window.YT || !window.YT.Player) return;
      if (playerRef.current) return;

      const trackVid = getTrackVideoId(currentTrackRef.current);
      // Use selected track video if available, else standard fallback with autoplay: 0
      const initialVid = trackVid || "xTvyyoF_LZY";

      playerRef.current = new window.YT.Player("musify-hidden-yt-player", {
        height: "200",
        width: "200",
        videoId: initialVid,
        host: "https://www.youtube-nocookie.com",
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          enablejsapi: 1,
          origin: typeof window !== "undefined" ? window.location.origin : undefined,
        },
        events: {
          onReady: (event: any) => {
            setIsPlayerReady(true);
            try {
              event.target.setVolume(isMuted ? 0 : volume * 100);
            } catch {}

            const activeTrack = currentTrackRef.current;
            if (activeTrack) {
              const vid = getTrackVideoId(activeTrack);
              if (vid) {
                currentVideoIdRef.current = vid;
                if (isPlayingRef.current) {
                  event.target.loadVideoById(vid);
                  try {
                    event.target.playVideo();
                  } catch {}
                } else {
                  event.target.cueVideoById(vid);
                }
              }
            } else {
              // No track selected: guarantee fallback video does NOT play
              try {
                event.target.pauseVideo();
              } catch {}
            }
          },
          onStateChange: (event: any) => {
            // YT.PlayerState: -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued
            if (event.data === 1) {
              if (currentTrackRef.current) {
                onIsPlayingChangeRef.current(true);
              } else {
                // Ghost song guard: stop if no track selected
                try {
                  event.target.stopVideo();
                } catch {}
                onIsPlayingChangeRef.current(false);
              }
            } else if (event.data === 2) {
              // If Musify expects audio to be playing (isPlayingRef.current is true),
              // this pause event was triggered by browser/OS backgrounding or visibility change.
              // Auto-resume immediately!
              if (isPlayingRef.current) {
                try {
                  event.target.playVideo();
                } catch {}
                setTimeout(() => {
                  if (isPlayingRef.current) {
                    try {
                      const state = playerRef.current?.getPlayerState?.();
                      if (state === 2) {
                        playerRef.current?.playVideo?.();
                      }
                    } catch {}
                  }
                }, 150);
              } else {
                onIsPlayingChangeRef.current(false);
              }
            } else if (event.data === 0) {
              // Direct repeat-one handling: replay instantly from 0s
              if (repeatModeRef.current === "one") {
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
            console.warn("YouTube player error:", err);
            // Only advance if a real track failed to embed (codes 101 or 150)
            if (
              currentTrackRef.current &&
              (err?.data === 101 || err?.data === 150)
            ) {
              setTimeout(() => {
                onNextRef.current?.();
              }, 800);
            }
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

  // Track change & player ready synchronization
  useEffect(() => {
    if (!playerRef.current || !isPlayerReady) return;

    if (!currentTrack) {
      if (currentVideoIdRef.current) {
        currentVideoIdRef.current = null;
        try {
          playerRef.current.stopVideo?.();
        } catch {}
      }
      return;
    }

    const videoId = getTrackVideoId(currentTrack);
    if (!videoId) return;

    if (currentVideoIdRef.current !== videoId) {
      currentVideoIdRef.current = videoId;
      try {
        if (isPlaying) {
          playerRef.current.loadVideoById(videoId);
          try {
            playerRef.current.playVideo();
          } catch {}
        } else {
          playerRef.current.cueVideoById(videoId);
        }
      } catch (e) {
        console.error("Failed to load video:", e);
      }
    } else if (isPlaying) {
      try {
        const state = playerRef.current.getPlayerState?.();
        if (state !== 1 && state !== 3) {
          playerRef.current.playVideo?.();
        }
      } catch {}
    }
  }, [currentTrack, isPlaying, isPlayerReady]);

  // Sync play/pause state
  useEffect(() => {
    if (!isPlayerReady || !playerRef.current) return;
    try {
      const state = playerRef.current.getPlayerState?.();
      if (isPlaying && state !== 1 && state !== 3) {
        playerRef.current.playVideo?.();
      } else if (!isPlaying && state === 1) {
        playerRef.current.pauseVideo?.();
      }
    } catch {}
  }, [isPlaying, isPlayerReady]);

  // Real-time acoustic equalizer gain & loudness calculation
  const effectiveVolume = React.useMemo(() => {
    if (isMuted) return 0;
    if (!equalizerEnabled || !equalizerBands) return volume;
    const sub = (equalizerBands[60] ?? 0) * 0.25;
    const bass = (equalizerBands[230] ?? 0) * 0.25;
    const mid = (equalizerBands[910] ?? 0) * 0.20;
    const pres = (equalizerBands[3600] ?? 0) * 0.15;
    const treble = (equalizerBands[14000] ?? 0) * 0.15;
    const totalDb = sub + bass + mid + pres + treble;
    // Map dB curve smoothly with limiter headroom
    const multiplier = Math.pow(10, totalDb / 50);
    return Math.min(1.0, Math.max(0.05, volume * multiplier));
  }, [volume, isMuted, equalizerEnabled, equalizerBands]);

  // Sync volume, mute & dynamic acoustic equalizer
  useEffect(() => {
    if (!isPlayerReady || !playerRef.current) return;
    try {
      playerRef.current.setVolume?.(isMuted ? 0 : Math.round(effectiveVolume * 100));
      if (isMuted) {
        playerRef.current.mute?.();
      } else {
        playerRef.current.unMute?.();
      }
    } catch {}

    // Android Native Hardware Equalizer Bridge
    if (typeof window !== "undefined" && (window as any).MusifyNativeBridge?.setEqualizer) {
      try {
        (window as any).MusifyNativeBridge.setEqualizer(
          equalizerEnabled ? JSON.stringify(equalizerBands || {}) : "{}"
        );
      } catch {}
    }
  }, [effectiveVolume, isMuted, isPlayerReady, equalizerEnabled, equalizerBands]);

  // Sync seek
  useEffect(() => {
    if (seekToTime === null || !isPlayerReady || !playerRef.current) return;
    try {
      playerRef.current.seekTo?.(seekToTime, true);
      onSeekHandled();
    } catch {}
  }, [seekToTime, onSeekHandled, isPlayerReady]);

  // Time update polling (high-frequency 200ms for silky smooth lyrics sync)
  const lastTimelineSyncRef = useRef<number>(0);
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPlayerReady || !playerRef.current) return;
      try {
        const state = playerRef.current.getPlayerState?.();
        if (state === 1 || state === 3) {
          if (!currentTrackRef.current) {
            try {
              playerRef.current.stopVideo?.();
            } catch {}
            return;
          }
          const curr = playerRef.current.getCurrentTime?.() ?? 0;
          const dur = playerRef.current.getDuration?.() ?? 0;
          const loadedFraction = playerRef.current.getVideoLoadedFraction?.() ?? 0;
          onTimeUpdate(curr, dur, loadedFraction);

          // Sync timeline with Android native media notification every 1500ms
          const now = Date.now();
          if (now - lastTimelineSyncRef.current > 1500) {
            lastTimelineSyncRef.current = now;
            if (typeof window !== "undefined" && (window as any).MusifyNativeBridge?.updateTimeline) {
              try {
                (window as any).MusifyNativeBridge.updateTimeline(curr, dur);
              } catch {}
            }
          }

          // Audio Crossfade Volume Transition Curve
          if (!isMuted && crossfadeSeconds > 0 && dur > crossfadeSeconds * 2) {
            const baseVol = volume * 100;
            if (curr < crossfadeSeconds) {
              // Fade In
              const fadeRatio = Math.max(0.05, curr / crossfadeSeconds);
              playerRef.current.setVolume?.(Math.round(baseVol * fadeRatio));
            } else if (curr > dur - crossfadeSeconds) {
              // Fade Out
              const remaining = Math.max(0, dur - curr);
              const fadeRatio = Math.max(0.05, remaining / crossfadeSeconds);
              playerRef.current.setVolume?.(Math.round(baseVol * fadeRatio));
            } else {
              // Full Volume
              playerRef.current.setVolume?.(baseVol);
            }
          }
        }
      } catch {}
    }, 200);

    return () => clearInterval(interval);
  }, [onTimeUpdate, isPlayerReady, isMuted, volume, crossfadeSeconds]);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        bottom: 0,
        right: 0,
        width: "200px",
        height: "200px",
        opacity: 0.001,
        pointerEvents: "none",
        zIndex: -9999,
      }}
    >
      <div id="musify-hidden-yt-player" />
    </div>
  );
}
