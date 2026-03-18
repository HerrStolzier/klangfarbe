export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white">
      <main className="flex flex-col items-center gap-8 px-6 text-center">
        <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">
          Klangfarbe
        </h1>
        <p className="max-w-md text-lg text-zinc-400">
          Sieh wie Musik aussieht. Lade einen Song hoch oder nutze dein Mikrofon
          — und erlebe Audio als visuelle Kunst.
        </p>
        <div className="flex gap-4">
          <a
            href="/visualizer"
            className="rounded-full bg-white px-8 py-3 font-medium text-black transition-colors hover:bg-zinc-200"
          >
            Starten
          </a>
        </div>
      </main>
    </div>
  );
}
