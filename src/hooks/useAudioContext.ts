"use client";

import { useCallback, useRef, useState } from "react";

export function useAudioContext() {
  const ctxRef = useRef<AudioContext | null>(null);
  const [isReady, setIsReady] = useState(false);

  const getContext = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
      setIsReady(true);
    }
    // Resume if suspended (browser autoplay policy)
    if (ctxRef.current.state === "suspended") {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  return { getContext, isReady };
}
