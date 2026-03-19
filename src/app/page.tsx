import Link from "next/link";
import { HeroBackground } from "@/components/HeroBackground";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black text-white">
      {/* Animated background */}
      <HeroBackground />

      {/* Content */}
      <main className="relative z-10 flex flex-col items-center gap-6 px-6 text-center sm:gap-8">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-cyan-400/70 sm:text-sm">
          Audio Visualizer
        </p>
        <h1 className="text-5xl font-bold tracking-tight sm:text-8xl">
          Klangfarbe
        </h1>
        <p className="max-w-lg text-base leading-relaxed text-zinc-400 sm:text-lg">
          Sieh wie Musik aussieht. Lade einen Song hoch oder nutze dein Mikrofon
          — und erlebe Audio als visuelle Kunst.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
          <Link
            href="/visualizer"
            className="rounded-full bg-white px-8 py-3 text-sm font-semibold text-black transition-all hover:scale-105 hover:bg-zinc-200 sm:text-base"
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
        </div>

        {/* Feature pills */}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {[
            "4 Visualizer",
            "5 Farbschemas",
            "Deezer-Suche",
            "Mikrofon",
            "BPM-Erkennung",
            "Export",
          ].map((feature) => (
            <span
              key={feature}
              className="rounded-full bg-zinc-900/60 px-3 py-1 text-[10px] text-zinc-500 sm:text-xs"
            >
              {feature}
            </span>
          ))}
        </div>
      </main>

      <footer className="absolute bottom-0 z-10 flex w-full justify-center gap-6 p-6 text-xs text-zinc-600">
        <Link href="/impressum" className="hover:text-zinc-400">
          Impressum
        </Link>
        <Link href="/datenschutz" className="hover:text-zinc-400">
          Datenschutz
        </Link>
      </footer>
    </div>
  );
}
