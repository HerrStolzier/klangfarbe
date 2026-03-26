import { NextRequest, NextResponse } from "next/server";

const DEEZER_API = "https://api.deezer.com";
const MAX_QUERY_LENGTH = 200;

// Simple sliding window rate limiter (per-instance burst protection)
const searchRequests = new Map<string, number[]>();
const SEARCH_RATE_LIMIT = 20; // requests per minute
const SEARCH_WINDOW_MS = 60_000;

function getRateLimitRemaining(ip: string): number {
  const now = Date.now();
  const timestamps = (searchRequests.get(ip) ?? []).filter(
    (t) => now - t < SEARCH_WINDOW_MS,
  );
  timestamps.push(now);
  searchRequests.set(ip, timestamps);
  return Math.max(0, SEARCH_RATE_LIMIT - timestamps.length);
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (searchRequests.get(ip) ?? []).filter(
    (t) => now - t < SEARCH_WINDOW_MS,
  );
  // Check before adding current request
  return timestamps.length >= SEARCH_RATE_LIMIT;
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ error: "Missing query parameter" }, { status: 400 });
  }

  if (query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json(
      { error: `Query too long (max ${MAX_QUERY_LENGTH} characters)` },
      { status: 400 },
    );
  }

  // Rate limiting based on IP
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests — please wait a moment" },
      {
        status: 429,
        headers: { "x-ratelimit-remaining": "0" },
      },
    );
  }

  const remaining = getRateLimitRemaining(ip);

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

  return NextResponse.json(
    { tracks },
    { headers: { "x-ratelimit-remaining": String(remaining) } },
  );
}
