"use client";

import { useCallback, useState } from "react";

export const LIVE_ORIGIN = "https://www.hockerty.com";

const MIRROR_PATH_PREFIX = "/3d/new_man/";

/** Same-origin path for a layer URL, or null if not a mirrorable 3D asset. */
export function sameOriginMirrorPath(src: string): string | null {
  try {
    const url = new URL(
      src,
      typeof window !== "undefined" ? window.location.href : "http://localhost"
    );
    if (!url.pathname.startsWith(MIRROR_PATH_PREFIX)) {
      return null;
    }
    return url.pathname + (url.search || "");
  } catch {
    return null;
  }
}

/** Build the Hockerty CDN URL for a local /3d/new_man/ layer path. */
export function mirrorLayerSrc(src: string): string | null {
  const path = sameOriginMirrorPath(src);
  if (!path) {
    return null;
  }
  return LIVE_ORIGIN + path;
}

export function useMirrorLayerImg(initialSrc: string) {
  const [src, setSrc] = useState(initialSrc);
  const [triedMirror, setTriedMirror] = useState(false);

  const onError = useCallback(() => {
    if (triedMirror) {
      return;
    }
    const mirrored = mirrorLayerSrc(src);
    if (!mirrored) {
      return;
    }
    setTriedMirror(true);
    setSrc(mirrored);
  }, [src, triedMirror]);

  return { src, onError };
}
