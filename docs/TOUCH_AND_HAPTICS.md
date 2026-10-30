# Musify Touch Interactions & Haptic Feedback System

Musify features a native Android-grade touch gesture and haptic feedback engine designed to provide tactile, responsive, and tactilely refined music streaming experience across Android and modern mobile web.

---

## 1. Central Haptic Engine (`src/lib/haptics/`)

The haptic engine dynamically detects whether the app is executing inside native Android (via `@capacitor/haptics`) or in a mobile browser (via standard `navigator.vibrate` with millisecond pattern scaling).

### API Methods
- `haptics.light()`: Subtle tick for navigation tab switching, opening menus, closing bottom sheets, and minor selections.
- `haptics.medium()`: Defined impact for Play/Pause, track skipping (Next/Prev), and Liking a track.
- `haptics.heavy()`: Firm impact when a Long-Press threshold (450ms) is reached to open contextual action sheets.
- `haptics.selection()`: Micro-vibration for toggling Shuffle, Repeat, or changing dropdowns.
- `haptics.success()`: Positive tactile chime for "Added to Queue", "Saved to Liked Songs", or saving settings.
- `haptics.warning()`: Cautionary pattern when clearing the queue or resetting preferences.
- `haptics.error()`: Alert pattern for stream errors or offline failure.
- `haptics.tick(id, intervalMs)`: Throttled selection vibration for continuous scrubbing (seek bars, volume slider) to avoid continuous buzzing.

---

## 2. Supported Gestures

### Mini Player Dock
- **Tap**: Expands player into full-screen visualizer mode.
- **Swipe Up**: Slides open the full-screen visualizer.
- **Swipe Down**: Dismisses / closes player dock.
- **Swipe Left**: Skips to the Next track with haptic feedback.
- **Swipe Right**: Skips to the Previous track with haptic feedback.
- **Scrubber Drag**: Real-time seeking with throttled haptic feedback ticks.

### Full-Screen Vinyl Player
- **Swipe Down**: Collapses the full-screen player back to the mini dock.
- **Swipe Left**: Next track with tactile impact.
- **Swipe Right**: Previous track with tactile impact.
- **Double-Tap (Vinyl / Artwork)**: Toggles Like status, emitting `haptics.success()` and triggering an animated bursting heart effect.
- **Long-Press (Vinyl / Title)**: Triggers `haptics.heavy()` and opens the native Track Action Sheet.
- **Seekbar Drag**: Smooth continuous seeking with tactile boundary notches.

### Queue Modal
- **Tap Track**: Plays selected track with `haptics.medium()`.
- **Drag & Drop**: Reorder upcoming tracks with `haptics.light()` on pick and `haptics.medium()` on release.
- **Move Up / Down Buttons**: Segmented reordering with selection ticks.
- **Remove Track**: Instant removal with light haptic feedback.
- **Long-Press Track**: Opens contextual Track Action Sheet.
- **Clear Queue**: Destructive action with `haptics.warning()`.
- **Add AI Recommendations**: Bulk addition with `haptics.success()`.

### Quick Picks & Track Rows
- **Tap**: Plays track immediately.
- **Long-Press / Right-Click**: Opens native Action Sheet (Play Now, Play Next, Add to Queue, Like/Unlike, Ask Musify AI, Share, Add to Playlist).

---

## 3. User Preferences (`Settings > Touch & Haptic Interactions`)

Users have granular control over their haptic and gesture experience:
- **Haptic Vibration Master Switch**: Enables/disables all haptic feedback globally.
- **Vibration Intensity**: Choose between `Light`, `Standard`, and `Strong` with a live "Test Feedback" button.
- **Swipe Track Switching**: Toggle swipe-to-skip.
- **Swipe to Close Player**: Toggle swipe-to-dismiss.
- **Double-Tap to Like**: Toggle double-tap heart gesture.
- **Long-Press Context Menu**: Toggle long-press action sheets.
- **Queue Swipe Actions**: Toggle queue gestures.
- **Reset Preferences**: Restores all touch and haptic settings to defaults.

