"use client";

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

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      {trackTitle && (
        <div className="text-center">
          <p className="text-sm font-medium text-white">{trackTitle}</p>
          {trackArtist && (
            <p className="text-xs text-zinc-400">{trackArtist}</p>
          )}
        </div>
      )}

      <div className="flex items-center gap-4">
        <button
          onClick={isPlaying ? onPause : onPlay}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black transition-transform hover:scale-105 active:scale-95"
        >
          {isPlaying ? (
            <svg width="14" height="16" viewBox="0 0 14 16" fill="currentColor">
              <rect x="1" y="0" width="4" height="16" rx="1" />
              <rect x="9" y="0" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="14" height="16" viewBox="0 0 14 16" fill="currentColor">
              <path d="M1 1.5v13l12-6.5z" />
            </svg>
          )}
        </button>

        <div className="flex flex-1 items-center gap-2">
          <span className="w-10 text-right text-xs text-zinc-500">
            {formatTime(currentTime)}
          </span>
          <div
            className="relative h-1.5 flex-1 cursor-pointer rounded-full bg-zinc-800"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = (e.clientX - rect.left) / rect.width;
              onSeek(x * duration);
            }}
          >
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-cyan-500 transition-[width] duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="w-10 text-xs text-zinc-500">
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}
