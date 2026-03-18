"use client";

import { useCallback, useRef } from "react";

interface PlaybackControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  trackTitle?: string;
  trackArtist?: string;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function PlaybackControls({
  isPlaying,
  currentTime,
  duration,
  onPlay,
  onPause,
  onSeek,
  trackTitle,
  trackArtist,
}: PlaybackControlsProps) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const barRef = useRef<HTMLDivElement>(null);

  const seekFromEvent = useCallback(
    (clientX: number) => {
      if (!barRef.current) return;
      const d = duration > 0 ? duration : 30; // fallback to 30s for Deezer previews
      const rect = barRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      onSeek(x * d);
    },
    [duration, onSeek],
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      seekFromEvent(e.touches[0].clientX);

      const onTouchMove = (ev: TouchEvent) => {
        ev.preventDefault();
        seekFromEvent(ev.touches[0].clientX);
      };
      const onTouchEnd = () => {
        document.removeEventListener("touchmove", onTouchMove);
        document.removeEventListener("touchend", onTouchEnd);
      };

      document.addEventListener("touchmove", onTouchMove, { passive: false });
      document.addEventListener("touchend", onTouchEnd);
    },
    [seekFromEvent],
  );

  return (
    <div className="flex w-full min-w-0 flex-1 flex-col gap-2 sm:gap-3">
      {trackTitle && (
        <div className="text-center">
          <p className="truncate text-xs font-medium text-white sm:text-sm">
            {trackTitle}
          </p>
          {trackArtist && (
            <p className="truncate text-[10px] text-zinc-400 sm:text-xs">
              {trackArtist}
            </p>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 sm:gap-4">
        <button
          onClick={isPlaying ? onPause : onPlay}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-black transition-transform hover:scale-105 active:scale-95 sm:h-10 sm:w-10"
        >
          {isPlaying ? (
            <svg width="12" height="14" viewBox="0 0 14 16" fill="currentColor">
              <rect x="1" y="0" width="4" height="16" rx="1" />
              <rect x="9" y="0" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="12" height="14" viewBox="0 0 14 16" fill="currentColor">
              <path d="M1 1.5v13l12-6.5z" />
            </svg>
          )}
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
          <span className="w-8 text-right text-[10px] text-zinc-500 sm:w-10 sm:text-xs">
            {formatTime(currentTime)}
          </span>
          <div
            ref={barRef}
            className="relative h-2 flex-1 cursor-pointer rounded-full bg-zinc-800 sm:h-1.5"
            onMouseDown={(e) => {
              seekFromEvent(e.clientX);
              const onMouseMove = (ev: MouseEvent) => seekFromEvent(ev.clientX);
              const onMouseUp = () => {
                document.removeEventListener("mousemove", onMouseMove);
                document.removeEventListener("mouseup", onMouseUp);
              };
              document.addEventListener("mousemove", onMouseMove);
              document.addEventListener("mouseup", onMouseUp);
            }}
            onTouchStart={handleTouchStart}
          >
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-cyan-500 transition-[width] duration-100"
              style={{ width: `${progress}%` }}
            />
            {/* Thumb dot — larger on mobile for touch targets */}
            <div
              className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-white shadow-md shadow-black/30 sm:h-3 sm:w-3"
              style={{ left: `calc(${progress}% - 7px)` }}
            />
          </div>
          <span className="w-8 text-[10px] text-zinc-500 sm:w-10 sm:text-xs">
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}
