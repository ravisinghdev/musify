"use client";

import { useCallback, useRef } from "react";
import { haptics } from "./haptics";

interface GestureOptions {
  onLongPress?: () => void;
  onClick?: () => void;
  onDoubleTap?: () => void;
  delay?: number; // ms for long press, default 450
  doubleTapThreshold?: number; // ms for double tap, default 300
}

export function useGesture<T extends HTMLElement = HTMLElement>({
  onLongPress,
  onClick,
  onDoubleTap,
  delay = 450,
  doubleTapThreshold = 300,
}: GestureOptions) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const lastTapRef = useRef<number>(0);
  const singleTapTimerRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(
    (clientX: number, clientY: number) => {
      isLongPressRef.current = false;
      startPosRef.current = { x: clientX, y: clientY };

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        isLongPressRef.current = true;
        haptics.light();
        if (onLongPress) {
          onLongPress();
        }
      }, delay);
    },
    [delay, onLongPress]
  );

  const move = useCallback((clientX: number, clientY: number) => {
    if (!startPosRef.current) return;
    const dx = Math.abs(clientX - startPosRef.current.x);
    const dy = Math.abs(clientY - startPosRef.current.y);
    // If movement is larger than 10px, the user is scrolling - cancel long press
    if (dx > 10 || dy > 10) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
  }, []);

  const end = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startPosRef.current = null;
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      // If long press already fired, do not fire normal click
      if (isLongPressRef.current) {
        e.preventDefault();
        e.stopPropagation();
        isLongPressRef.current = false;
        return;
      }

      const now = Date.now();
      const timeSinceLastTap = now - lastTapRef.current;

      if (onDoubleTap && timeSinceLastTap > 0 && timeSinceLastTap < doubleTapThreshold) {
        // Double tap detected!
        if (singleTapTimerRef.current) {
          clearTimeout(singleTapTimerRef.current);
          singleTapTimerRef.current = null;
        }
        lastTapRef.current = 0;
        haptics.medium();
        onDoubleTap();
      } else {
        lastTapRef.current = now;
        if (onDoubleTap) {
          // Wait briefly to see if second tap follows
          if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);
          singleTapTimerRef.current = setTimeout(() => {
            if (onClick) onClick();
            singleTapTimerRef.current = null;
          }, doubleTapThreshold);
        } else {
          // Immediate click
          if (onClick) onClick();
        }
      }
    },
    [doubleTapThreshold, onClick, onDoubleTap]
  );

  return {
    onTouchStart: (e: React.TouchEvent) => {
      const touch = e.touches[0];
      if (touch) start(touch.clientX, touch.clientY);
    },
    onTouchMove: (e: React.TouchEvent) => {
      const touch = e.touches[0];
      if (touch) move(touch.clientX, touch.clientY);
    },
    onTouchEnd: end,
    onTouchCancel: end,
    onMouseDown: (e: React.MouseEvent) => {
      start(e.clientX, e.clientY);
    },
    onMouseMove: (e: React.MouseEvent) => {
      move(e.clientX, e.clientY);
    },
    onMouseUp: end,
    onMouseLeave: end,
    onContextMenu: (e: React.MouseEvent) => {
      // Desktop right click also triggers action options
      if (onLongPress) {
        e.preventDefault();
        haptics.heavy();
        onLongPress();
      }
    },
    onClick: handleClick,
  };
}

