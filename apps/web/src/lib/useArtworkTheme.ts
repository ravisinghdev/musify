"use client";

import { useEffect, useState } from "react";

interface ThemeColors {
  primary: string; // e.g. "rgb(99, 102, 241)"
  secondary: string;
  glowRgba: string; // e.g. "rgba(99, 102, 241, 0.18)"
}

const DEFAULT_THEME: ThemeColors = {
  primary: "rgb(99, 102, 241)",
  secondary: "rgb(56, 189, 248)",
  glowRgba: "rgba(99, 102, 241, 0.16)",
};

export function useArtworkTheme(artworkUrl?: string | null): ThemeColors {
  const [theme, setTheme] = useState<ThemeColors>(DEFAULT_THEME);

  useEffect(() => {
    if (!artworkUrl || typeof window === "undefined") {
      setTheme(DEFAULT_THEME);
      return;
    }

    let isMounted = true;
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      if (!isMounted) return;
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, 16, 16);
        const data = ctx.getImageData(0, 0, 16, 16).data;

        let r = 0, g = 0, b = 0, count = 0;
        // Sample pixels with reasonable saturation
        for (let i = 0; i < data.length; i += 16) {
          const pr = data[i];
          const pg = data[i + 1];
          const pb = data[i + 2];
          // Skip extreme dark or extreme white
          const brightness = (pr + pg + pb) / 3;
          if (brightness > 35 && brightness < 230) {
            r += pr;
            g += pg;
            b += pb;
            count++;
          }
        }

        if (count > 0) {
          r = Math.round(r / count);
          g = Math.round(g / count);
          b = Math.round(b / count);

          // Boost color slightly if too muted
          const max = Math.max(r, g, b);
          if (max < 160) {
            const factor = 160 / Math.max(max, 1);
            r = Math.min(255, Math.round(r * factor));
            g = Math.min(255, Math.round(g * factor));
            b = Math.min(255, Math.round(b * factor));
          }

          const primary = `rgb(${r}, ${g}, ${b})`;
          // Invert/shift hue for secondary complementary accent
          const secondary = `rgb(${b}, ${Math.round((r + g) / 2)}, ${r})`;
          const glowRgba = `rgba(${r}, ${g}, ${b}, 0.22)`;

          setTheme({ primary, secondary, glowRgba });
        }
      } catch {
        // Fallback for CORS restricted images
        setTheme(DEFAULT_THEME);
      }
    };

    img.onerror = () => {
      if (isMounted) setTheme(DEFAULT_THEME);
    };

    img.src = artworkUrl;

    return () => {
      isMounted = false;
    };
  }, [artworkUrl]);

  return theme;
}

