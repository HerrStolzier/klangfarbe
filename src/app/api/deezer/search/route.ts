import { NextRequest, NextResponse } from "next/server";

const DEEZER_API = "https://api.deezer.com";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ error: "Missing query parameter" }, { status: 400 });
  }

  const url = `${DEEZER_API}/search/track?q=${encodeURIComponent(query)}&limit=8`;

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "Deezer API error" },
      { status: response.status },
    );
  }

  const data = await response.json();

  if (data.error) {
    return NextResponse.json({ error: data.error.message }, { status: 429 });
  }

  const tracks = (data.data ?? []).map(
    (track: {
      id: number;
      title: string;
      duration: number;
      preview: string;
      artist: { name: string };
      album: { title: string; cover_medium: string };
    }) => ({
      id: track.id,
      title: track.title,
      artist: track.artist.name,
      album: track.album.title,
      cover: track.album.cover_medium,
      duration: track.duration,
      preview: track.preview,
    }),
  );

  return NextResponse.json({ tracks });
}
