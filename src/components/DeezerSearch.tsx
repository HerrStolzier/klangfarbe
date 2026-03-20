"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
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
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-cyan-500 sm:px-4 sm:py-2.5 sm:text-base"
        />
        <button
          onClick={search}
          disabled={isLoading}
          className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-500 disabled:opacity-50 sm:px-5 sm:py-2.5 sm:text-base"
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
            className="mt-2 flex max-h-[40vh] flex-col gap-0.5 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900/90 p-1.5 backdrop-blur-sm sm:mt-3 sm:gap-1 sm:p-2"
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
                  className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-zinc-800 active:bg-zinc-700 sm:gap-3 sm:px-3 sm:py-2"
                >
                  <Image
                    src={track.cover}
                    alt={track.album}
                    width={40}
                    height={40}
                    className="h-9 w-9 rounded sm:h-10 sm:w-10"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-white sm:text-sm">
                      {track.title}
                    </p>
                    <p className="truncate text-[10px] text-zinc-400 sm:text-xs">
                      {track.artist} — {track.album}
                    </p>
                  </div>
                  <span className="hidden text-xs text-zinc-600 sm:block">
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
