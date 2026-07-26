/**
 * Butler AI — expo-video SimpleCache Guard
 * © 2025-2026 Shawn Papanek. All rights reserved.
 *
 * Problem: expo-video registers a native Android VideoModule that creates a
 * media3 SimpleCache in a fixed directory. When the OnSpace.ai preview host
 * APK already holds a lock on that directory, the module init throws:
 *   IllegalStateException: Another SimpleCache instance uses the folder
 * This crashes NativeUnimoduleProxy.getConstants() BEFORE any JS renders.
 *
 * Fix strategy: prevent any JS path from ever touching expo-video APIs.
 * The native module itself cannot be prevented (it auto-registers), but
 * making sure zero JS code calls into it avoids the crash in practice
 * because the exception is caught in the native bridge and converted to
 * a JS error — as long as we never access NativeUnimoduleProxy for video.
 *
 * This file is a no-op service that documents the guard approach.
 */

// Safe guard: ensure expo-video is never imported by any service
export const VIDEO_GUARD_ACTIVE = true;

export function isVideoSupported(): boolean {
  // Always return false — Butler AI uses no in-app video playback.
  // All tutorial content is external (GitHub, YouTube links).
  return false;
}
