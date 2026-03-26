import Link from "next/link";
import { HeroBackground } from "@/components/HeroBackground";
import { LandingContent } from "@/components/LandingContent";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black text-white">
      {/* Animated background */}
      <HeroBackground />

      {/* Animated content */}
      <LandingContent />

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
