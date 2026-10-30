"use client";

import { useCallback, useRef } from "react";
import { haptics } from "../haptics";

export interface TouchGestureOptions {
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onDragMove?: (deltaX: number, deltaY: number) => void;
  onDragEnd?: (deltaX: number, deltaY: number) => void;
  longPressDelay?: number; // ms, default: 450
  doubleTapDelay?: number; // ms, default: 300
  swipeThreshold?: number; // px, default: 50
  preventScrollOnHorizontalSwipe?: boolean;
  enabled?: boolean;
}

export function useTouchGestures({
  onTap,
  onDoubleTap,
  onLongPress,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onDragMove,
  onDragEnd,
  longPressDelay = 450,
  doubleTapDelay = 300,
  swipeThreshold = 50,
  preventScrollOnHorizontalSwipe = true,
  enabled = true,
}: TouchGestureOptions) {
  const startX = useRef(0);
  const startY = useRef(0);
  const startTime = useRef(0);
  const currentX = useRef(0);
  const currentY = useRef(0);

  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const singleTapTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPressed = useRef(false);
  const lastTapTime = useRef(0);
  const isDragging = useRef(false);

  const clearLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent | TouchEvent) => {
      if (!enabled || !e.touches || e.touches.length === 0) return;
      const touch = e.touches[0];
      if (!touch) return;

      startX.current = touch.clientX;
      startY.current = touch.clientY;
      currentX.current = touch.clientX;
      currentY.current = touch.clientY;
      startTime.current = Date.now();
      isLongPressed.current = false;
      isDragging.current = true;

      clearLongPress();

      if (onLongPress) {
        longPressTimer.current = setTimeout(() => {
          isLongPressed.current = true;
          haptics.heavy();
          onLongPress();
        }, longPressDelay);
      }
    },
    [clearLongPress, enabled, longPressDelay, onLongPress]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent | TouchEvent) => {
      if (!enabled || !isDragging.current || !e.touches || e.touches.length === 0) return;
      const touch = e.touches[0];
      if (!touch) return;

      currentX.current = touch.clientX;
      currentY.current = touch.clientY;

      const deltaX = currentX.current - startX.current;
      const deltaY = currentY.current - startY.current;

      // If finger moved more than 12px, cancel long-press
      if (Math.hypot(deltaX, deltaY) > 12) {
        clearLongPress();
      }

      // If predominantly horizontal gesture and option is set, prevent vertical scrolling
      if (
        preventScrollOnHorizontalSwipe &&
        Math.abs(deltaX) > Math.abs(deltaY) &&
        Math.abs(deltaX) > 20 &&
        e.cancelable
      ) {
        // e.preventDefault();
      }

      if (onDragMove) {
        onDragMove(deltaX, deltaY);
      }
    },
    [clearLongPress, enabled, onDragMove, preventScrollOnHorizontalSwipe]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent | TouchEvent) => {
      if (!enabled || !isDragging.current) return;
      isDragging.current = false;
      clearLongPress();

      const deltaX = currentX.current - startX.current;
      const deltaY = currentY.current - startY.current;
      const duration = Date.now() - startTime.current;
      const distance = Math.hypot(deltaX, deltaY);

      if (onDragEnd) {
        onDragEnd(deltaX, deltaY);
      }

      // If long-press already triggered, swallow touch end
      if (isLongPressed.current) {
        return;
      }

      // Detect Swipes: quick flick or deliberate drag exceeding threshold
      const isQuickFlick = duration < 350 && distance > 30;
      const isDistanceSwipe = distance > swipeThreshold;

      if (isQuickFlick || isDistanceSwipe) {
        const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);

        if (isHorizontal) {
          if (deltaX > 0 && onSwipeRight) {
            haptics.medium();
            onSwipeRight();
            return;
          } else if (deltaX < 0 && onSwipeLeft) {
            haptics.medium();
            onSwipeLeft();
            return;
          }
        } else {
          if (deltaY > 0 && onSwipeDown) {
            haptics.light();
            onSwipeDown();
            return;
          } else if (deltaY < 0 && onSwipeUp) {
            haptics.light();
            onSwipeUp();
            return;
          }
        }
      }

      // Detect Taps if distance was minimal
      if (distance < 12) {
        const now = Date.now();
        const timeSinceLastTap = now - lastTapTime.current;

        if (onDoubleTap && timeSinceLastTap > 0 && timeSinceLastTap < doubleTapDelay) {
          if (singleTapTimer.current) {
            clearTimeout(singleTapTimer.current);
            singleTapTimer.current = null;
          }
          lastTapTime.current = 0;
          haptics.success();
          onDoubleTap();
        } else {
          lastTapTime.current = now;
          if (onDoubleTap) {
            if (singleTapTimer.current) clearTimeout(singleTapTimer.current);
            singleTapTimer.current = setTimeout(() => {
              if (onTap) {
                haptics.light();
                onTap();
              }
              singleTapTimer.current = null;
            }, doubleTapDelay);
          } else if (onTap) {
            haptics.light();
            onTap();
          }
        }
      }
    },
    [
      clearLongPress,
      doubleTapDelay,
      enabled,
      onDoubleTap,
      onDragEnd,
      onSwipeDown,
      onSwipeLeft,
      onSwipeRight,
      onSwipeUp,
      onTap,
      swipeThreshold,
    ]
  );

  const handleTouchCancel = useCallback(() => {
    isDragging.current = false;
    clearLongPress();
  }, [clearLongPress]);

  return {
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchCancel,
    },
  };
}

