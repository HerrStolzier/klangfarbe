import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Impressum — Klangfarbe",
};

export default function ImpressumPage() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-black px-6 py-16 text-white">
      <div className="w-full max-w-xl">
        <Link
          href="/"
          className="mb-8 inline-block text-sm text-zinc-500 hover:text-white"
        >
          ← Zurück
        </Link>

        <h1 className="mb-6 text-3xl font-bold">Impressum</h1>

        <div className="space-y-4 text-sm leading-relaxed text-zinc-400">
          <p>Angaben gemäß § 5 TMG</p>

          <div>
            <p className="font-medium text-white">Verantwortlich</p>
            <p>HerrStolzier</p>
            <p>
              Kontakt:{" "}
              <a
                href="https://github.com/HerrStolzier"
                className="text-cyan-400 hover:text-cyan-300"
              >
                github.com/HerrStolzier
              </a>
            </p>
          </div>

          <div>
            <p className="font-medium text-white">Haftungsausschluss</p>
            <p>
              Klangfarbe ist ein Open-Source-Projekt und wird ohne Gewähr
              bereitgestellt. Die Nutzung erfolgt auf eigene Verantwortung.
            </p>
          </div>

          <div>
            <p className="font-medium text-white">Urheberrecht</p>
            <p>
              Der Quellcode steht unter der MIT-Lizenz. Audio-Previews werden
              über die Deezer-API bereitgestellt und unterliegen den
              Nutzungsbedingungen von Deezer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
