"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { PitchInfo } from "@/hooks/usePitch";

interface AudioInfoProps {
  bpm: number | null;
  pitch: PitchInfo | null;
  energy: { low: number; mid: number; high: number } | null;
}

function EnergyBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-6 text-[9px] uppercase text-zinc-500">{label}</span>
      <div className="h-1 w-12 overflow-hidden rounded-full bg-zinc-800 sm:w-16">
        <div
          className="h-full rounded-full bg-cyan-500 transition-[width] duration-75"
          style={{ width: `${Math.min(100, value * 100)}%` }}
        />
      </div>
    </div>
  );
}

export function AudioInfo({ bpm, pitch, energy }: AudioInfoProps) {
  const hasAnyInfo = bpm || pitch || energy;
  if (!hasAnyInfo) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-wrap items-center justify-center gap-3 sm:gap-4"
    >
      {/* BPM */}
      <AnimatePresence>
        {bpm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-baseline gap-1 rounded-md bg-zinc-900/60 px-2.5 py-1"
          >
            <span className="text-sm font-bold tabular-nums text-white sm:text-base">
              {bpm}
            </span>
            <span className="text-[10px] uppercase text-zinc-500">BPM</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pitch */}
      <AnimatePresence>
        {pitch && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-baseline gap-1 rounded-md bg-zinc-900/60 px-2.5 py-1"
          >
            <span className="text-sm font-bold text-white sm:text-base">
              {pitch.note}
              <span className="text-[10px] text-zinc-400">{pitch.octave}</span>
            </span>
            <span className="text-[10px] tabular-nums text-zinc-500">
              {pitch.cents > 0 ? "+" : ""}
              {pitch.cents}¢
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Energy */}
      {energy && (
        <div className="flex flex-col gap-0.5 rounded-md bg-zinc-900/60 px-2 py-1">
          <EnergyBar label="Low" value={energy.low} />
          <EnergyBar label="Mid" value={energy.mid} />
          <EnergyBar label="Hi" value={energy.high} />
        </div>
      )}
    </motion.div>
  );
}
