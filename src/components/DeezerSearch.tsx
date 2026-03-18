"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { DeezerTrack } from "@/lib/types";

interface DeezerSearchProps {
  onSelect: (track: DeezerTrack) => void;
}

export function DeezerSearch({ onSelect }: DeezerSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DeezerTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const search = useCallback(async () => {
    if (query.trim().length === 0) return;

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/deezer/search?q=${encodeURIComponent(query)}`,
      );
      const data = await res.json();
      setResults(data.tracks ?? []);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") search();
  };

  return (
    <div className="w-full max-w-md">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Song suchen..."
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-white placeholder-zinc-500 outline-none transition-colors focus:border-cyan-500"
        />
        <button
          onClick={search}
          disabled={isLoading}
          className="rounded-lg bg-cyan-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-cyan-500 disabled:opacity-50"
        >
          {isLoading ? "..." : "Suchen"}
        </button>
      </div>

      <AnimatePresence>
        {results.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-3 flex flex-col gap-1 rounded-lg border border-zinc-800 bg-zinc-900/80 p-2"
          >
            {results.map((track) => (
              <motion.li
                key={track.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <button
                  onClick={() => {
                    onSelect(track);
                    setResults([]);
                    setQuery("");
                  }}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-zinc-800"
                >
                  <img
                    src={track.cover}
                    alt={track.album}
                    className="h-10 w-10 rounded"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                      {track.title}
                    </p>
                    <p className="truncate text-xs text-zinc-400">
                      {track.artist} — {track.album}
                    </p>
                  </div>
                  <span className="text-xs text-zinc-600">
                    {Math.floor(track.duration / 60)}:
                    {String(track.duration % 60).padStart(2, "0")}
                  </span>
                </button>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
