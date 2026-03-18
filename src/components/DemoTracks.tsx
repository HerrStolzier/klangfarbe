"use client";

import { useCallback, useState } from "react";
import { DEMO_SUGGESTIONS } from "@/lib/demo-tracks";
import type { DeezerTrack } from "@/lib/types";

interface DemoTracksProps {
  onSelect: (track: DeezerTrack) => void;
}

export function DemoTracks({ onSelect }: DemoTracksProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleClick = useCallback(
    async (query: string) => {
      setLoading(query);
      try {
        const res = await fetch(`/api/deezer/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        const track = data.tracks?.[0];
        if (track?.preview) {
          onSelect(track);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(null);
      }
    },
    [onSelect],
  );

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-zinc-600 sm:text-xs">Schnellstart:</span>
      {DEMO_SUGGESTIONS.map((demo) => (
        <button
          key={demo.query}
          onClick={() => handleClick(demo.query)}
          disabled={loading !== null}
          className="rounded-md bg-zinc-800/60 px-2 py-1 text-[10px] text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white disabled:opacity-50 sm:text-xs"
        >
          {loading === demo.query ? "..." : demo.label}
        </button>
      ))}
    </div>
  );
}
