"use client";

import type { AudioSource } from "@/hooks/useAudio";

interface MicButtonProps {
  source: AudioSource;
  onStartMic: () => void;
  onStopMic: () => void;
}

export function MicButton({ source, onStartMic, onStopMic }: MicButtonProps) {
  const isMicActive = source === "mic";

  return (
    <button
      onClick={isMicActive ? onStopMic : onStartMic}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:text-sm ${
        isMicActive
          ? "bg-red-600 text-white hover:bg-red-500"
          : "border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white"
      }`}
      title={isMicActive ? "Mikrofon stoppen" : "Mikrofon starten"}
    >
      {isMicActive ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <rect x="4" y="4" width="16" height="16" rx="2" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      )}
      {isMicActive ? "Stop" : "Mikrofon"}
    </button>
  );
}
