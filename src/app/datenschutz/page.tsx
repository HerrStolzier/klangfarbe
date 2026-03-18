import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Datenschutz — Klangfarbe",
};

export default function DatenschutzPage() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-black px-6 py-16 text-white">
      <div className="w-full max-w-xl">
        <Link
          href="/"
          className="mb-8 inline-block text-sm text-zinc-500 hover:text-white"
        >
          ← Zurück
        </Link>

        <h1 className="mb-6 text-3xl font-bold">Datenschutzerklärung</h1>

        <div className="space-y-6 text-sm leading-relaxed text-zinc-400">
          <section>
            <h2 className="mb-2 text-base font-medium text-white">
              1. Datenverarbeitung
            </h2>
            <p>
              Klangfarbe verarbeitet Audio ausschließlich lokal in deinem
              Browser. Es werden keine Audiodaten an unsere Server übertragen.
              Hochgeladene Dateien und Mikrofon-Input verlassen dein Gerät
              nicht.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-medium text-white">
              2. Deezer-API
            </h2>
            <p>
              Für die Song-Suche und Audio-Previews nutzen wir die öffentliche
              Deezer-API. Suchanfragen werden über unseren Server an Deezer
              weitergeleitet. Es werden keine personenbezogenen Daten an
              Deezer übermittelt.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-medium text-white">
              3. Vercel Analytics
            </h2>
            <p>
              Diese Website nutzt Vercel Analytics zur Erfassung anonymisierter
              Nutzungsstatistiken. Es werden keine Cookies gesetzt und keine
              personenbezogenen Daten erhoben. Weitere Informationen findest du
              in der{" "}
              <a
                href="https://vercel.com/docs/analytics/privacy-policy"
                className="text-cyan-400 hover:text-cyan-300"
                target="_blank"
                rel="noopener noreferrer"
              >
                Vercel Analytics Datenschutzerklärung
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-medium text-white">
              4. Lokale Speicherung
            </h2>
            <p>
              Klangfarbe speichert keine Daten auf deinem Gerät. Es werden
              keine Cookies, kein LocalStorage und keine IndexedDB verwendet.
              Deine Visualizer-Einstellungen werden ausschließlich in der URL
              gespeichert.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-medium text-white">
              5. Kontakt
            </h2>
            <p>
              Bei Fragen zum Datenschutz wende dich an:{" "}
              <a
                href="https://github.com/HerrStolzier"
                className="text-cyan-400 hover:text-cyan-300"
              >
                github.com/HerrStolzier
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
