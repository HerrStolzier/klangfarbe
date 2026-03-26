"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const FEATURES = [
  "4 Visualizer",
  "5 Farbschemas",
  "Deezer-Suche",
  "Mikrofon",
  "BPM-Erkennung",
  "Export",
];

const pillVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.6 + i * 0.07, duration: 0.35 },
  }),
};

export function LandingContent() {
  return (
    <main className="relative z-10 flex flex-col items-center gap-6 px-6 text-center sm:gap-8">
      {/* Eyebrow label */}
      <motion.p
        className="text-xs font-medium uppercase tracking-[0.3em] text-cyan-400/70 sm:text-sm"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Audio Visualizer
      </motion.p>

      {/* Main title with display font + gradient */}
      <motion.h1
        className="text-7xl font-bold leading-none tracking-tight sm:text-9xl"
        style={{ fontFamily: "var(--font-space-grotesk)" }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        <span
          className="inline-block bg-gradient-to-br from-white via-zinc-200 to-cyan-400 bg-clip-text text-transparent"
          style={{
            filter: "drop-shadow(0 0 40px rgba(0,220,255,0.25))",
          }}
        >
          Klangfarbe
        </span>
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        className="max-w-lg text-base leading-relaxed text-zinc-400 sm:text-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25, duration: 0.5 }}
      >
        Sieh wie Musik aussieht. Lade einen Song hoch oder nutze dein Mikrofon
        — und erlebe Audio als visuelle Kunst.
      </motion.p>

      {/* CTA buttons */}
      <motion.div
        className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <Link
          href="/visualizer"
          className="relative rounded-full bg-white px-8 py-3 text-sm font-semibold text-black transition-all hover:scale-105 hover:bg-zinc-200 sm:text-base"
          style={{
            boxShadow: "0 0 20px rgba(255,255,255,0.15), 0 0 40px rgba(0,220,255,0.1)",
          }}
        >
          Jetzt starten
        </Link>
        <a
          href="https://github.com/HerrStolzier/klangfarbe"
          className="rounded-full border border-zinc-700 px-6 py-3 text-sm text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white sm:text-base"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
      </motion.div>

      {/* Feature pills — stagger animation */}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {FEATURES.map((feature, i) => (
          <motion.span
            key={feature}
            className="rounded-full bg-zinc-900/60 px-3 py-1 text-[10px] text-zinc-500 sm:text-xs"
            custom={i}
            variants={pillVariants}
            initial="hidden"
            animate="visible"
          >
            {feature}
          </motion.span>
        ))}
      </div>
    </main>
  );
}
